import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import session from "express-session";
import MongoStore from "connect-mongo";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import foodProductRoutes from "./routes/foodProductRoutes";
import projectRoutes from "./routes/projectRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import User from "./models/User";

// Load environment variables from .env file
dotenv.config();

// Ensure default admin user
const ensureAdminUser = async () => {
  try {
    const email = "admin@admin.com";
    const plainPassword = "ADMIN";

    const existing = await User.findOne({ email });

    if (existing) {
      existing.password = plainPassword; // will be hashed by pre-save hook
      existing.role = "admin";
      existing.status = "active";
      await existing.save();
      console.log("🔄 Default admin user updated (admin@admin.com)");
    } else {
      await User.create({
        name: "Administrator",
        email,
        password: plainPassword, // will be hashed by pre-save hook
        role: "admin",
        status: "active",
      });
      console.log("✅ Default admin user created (admin@admin.com)");
    }
  } catch (err) {
    console.error("Failed to ensure admin user:", err);
  }
};

// Connect to DB and then seed admin user
connectDB()
  .then(() => ensureAdminUser())
  .catch((err) => console.error('DB connection failed:', err));

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware - only enable CORS in development (production handled by Nginx)
if (process.env.NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:5173",
        // Production domains
        "https://www.datacorpsolutions.com",
        "https://datacorpsolutions.com",
        "https://ai.datacorpsolutions.com",
        "https://api.datacorpsolutions.com"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "AdminAuthorization",
        "adminauthorization",
        "X-Admin-Role",
        "x-admin-role",
        "X-Admin-Email",
        "x-admin-email",
        "X-User-ID",
        "x-user-id",
        "X-User-Role",
        "x-user-role"
      ],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );
}
app.use(express.json());
app.use(cookieParser()); // Cookie parser for handling cookies

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`=== REQUEST LOG ===`);
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  console.log('===================');
  next();
});

// Configure Express to trust reverse proxy (needed for secure cookies behind Nginx)
// Accept values:
//   - If TRUST_PROXY is a valid integer => use that many hops
//   - If TRUST_PROXY is "true" / "yes" => trust first proxy (1)
//   - Otherwise default to 1
const trustProxyEnv = process.env.TRUST_PROXY;
let trustProxy: any = 1;
if (trustProxyEnv) {
  if (/^(true|yes)$/i.test(trustProxyEnv)) {
    trustProxy = 1;
  } else if (!isNaN(parseInt(trustProxyEnv, 10))) {
    trustProxy = parseInt(trustProxyEnv, 10);
  } else {
    trustProxy = trustProxyEnv; // allow special strings like 'loopback'
  }
}
app.set("trust proxy", trustProxy);

// Session configuration with MongoDB storage
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || "fallback-session-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      touchAfter: 24 * 3600, // Lazy session update - only update session every 24 hours
    }),
    proxy: process.env.NODE_ENV === "production", // respect X-Forwarded-* headers when behind a proxy
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? 'api.datacorpsolutions.com' : undefined)
    },
    name: "sessionId", // Custom session name for security
  })
);

// Routes
console.log('=== MOUNTING ROUTES ===');

app.use("/api/admin", adminRoutes);
console.log('✓ Admin routes mounted at /api/admin');

app.use("/api/users", userRoutes); // Session-based authentication
console.log('✓ User routes mounted at /api/users');

app.use("/api/products", productRoutes);
console.log('✓ Product routes mounted at /api/products');

app.use("/api/foodproducts", foodProductRoutes);
console.log('✓ Food product routes mounted at /api/foodproducts');

app.use("/api/projects", projectRoutes);
console.log('✓ Project routes mounted at /api/projects');

app.use("/api/upload", uploadRoutes);
console.log('✓ Upload routes mounted at /api/upload');

console.log('=====================');

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// API Documentation endpoint
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "CPG Matchmaker API",
    version: "1.0.0",
    endpoints: {
      authentication: {
        login: "POST /api/users/login",
        logout: "POST /api/users/logout",
        googleLogin: "POST /api/users/google-login",
      },
      users: {
        register: "POST /api/users/register",
        verifyEmail: "POST /api/users/verify-email",
        resendVerification: "POST /api/users/resend-verification",
        forgotPassword: "POST /api/users/forgot-password",
        resetPassword: "POST /api/users/reset-password",
        profile: "GET /api/users/profile (session protected)",
        updateProfile: "PUT /api/users/profile (session protected)",
        getCurrentUser: "GET /api/users/me (session protected)",
        manufacturers: "GET /api/users/manufacturers"
      },
      admin: "/api/admin",
      products: "/api/products",
      foodProducts: "/api/foodproducts",
      projects: {
        base: "/api/projects",
        create: "POST /api/projects",
        getAll: "GET /api/projects",
        getById: "GET /api/projects/:id",
        update: "PUT /api/projects/:id",
        delete: "DELETE /api/projects/:id",
        updateStatus: "PATCH /api/projects/:id/status",
        getManufacturers: "GET /api/projects/:id/manufacturers",
        contactManufacturer: "POST /api/projects/:id/contact/:manufacturerId",
        analytics: "GET /api/projects/analytics"
      },
      upload: {
        uploadSingleImage: "POST /api/upload",
        uploadMultipleImages: "POST /api/upload/multiple (up to 6 images)",
        getSignedUrl: "GET /api/upload/signed-url"
      }
    },
    authenticationGuide: {
      sessionBased: "Uses express-session with MongoDB storage",
      sessionStorage: "Sessions stored in MongoDB 'sessions' collection",
      sessionDuration: "7 days",
      cookieSettings: {
        httpOnly: true,
        secure: "HTTPS in production only",
        sameSite: "none in production, lax in development"
      },
      protectedRoutes: "Include session cookie with requests to protected endpoints"
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    console.log(`👥 User API: http://localhost:${PORT}/api/users`);
    // console.log(`  ├── Session Auth: /api/users/login, /api/users/logout`);
    // console.log(`  └── Google OAuth: /api/users/google-login`);
    console.log(`🛡️  Admin API: http://localhost:${PORT}/api/admin`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🍎 Food Products API: http://localhost:${PORT}/api/foodproducts`);
    console.log(`🏭 Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
    // console.log(`  ├── Project CRUD: /api/projects (GET, POST, PUT, DELETE)`);
    // console.log(`  ├── Manufacturer Matching: /api/projects/:id/manufacturers`);
    // console.log(`  └── Analytics: /api/projects/analytics`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`🗄️  Session Storage: MongoDB`);
  });
}

export default app;
