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

// Load environment variables from .env file
dotenv.config();

// Kết nối MongoDB
connectDB();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "AdminAuthorization",
      "X-Admin-Role",
      "X-Admin-Email",
      "X-User-ID",
      "X-User-Role",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser()); // Cookie parser for handling HTTP-only cookies

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

// Session configuration
app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
  })
);

// Routes
console.log('=== MOUNTING ROUTES ===');

app.use("/api/admin", adminRoutes);
console.log('✓ Admin routes mounted at /api/admin');

app.use("/api/users", userRoutes); // Includes both legacy and JWT auth routes
console.log('✓ User routes mounted at /api/users');

app.use("/api/products", productRoutes);
console.log('✓ Product routes mounted at /api/products');

app.use("/api/foodproducts", foodProductRoutes);
console.log('✓ Food product routes mounted at /api/foodproducts');

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
        // Legacy session-based auth
        legacyLogin: "POST /api/users/login",
        legacyLogout: "POST /api/users/logout",
        
        // JWT-based auth
        jwtLogin: "POST /api/users/auth/login",
        refreshToken: "POST /api/users/auth/refresh-token",
        jwtLogout: "POST /api/users/auth/logout",
        getCurrentUser: "GET /api/users/auth/me (JWT protected)",
      },
      users: {
        register: "POST /api/users/register",
        verifyEmail: "POST /api/users/verify-email",
        resendVerification: "POST /api/users/resend-verification",
        forgotPassword: "POST /api/users/forgot-password",
        resetPassword: "POST /api/users/reset-password",
        googleLogin: "POST /api/users/google-login",
        profile: "GET /api/users/profile (protected)",
        updateProfile: "PUT /api/users/profile (protected)",
        manufacturers: "GET /api/users/manufacturers"
      },
      admin: "/api/admin",
      products: "/api/products",
      foodProducts: "/api/foodproducts"
    },
    authenticationGuide: {
      accessToken: "Include 'Authorization: Bearer <token>' header for JWT routes",
      refreshToken: "Send to /api/users/auth/refresh-token when access token expires",
      expirations: {
        accessToken: "15 minutes",
        refreshToken: "7 days"
      },
      cookieSupport: "Refresh tokens are also stored in HTTP-only cookies"
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
    console.log(`  ├── Legacy Auth: /api/users/login, /api/users/logout`);
    console.log(`  └── JWT Auth: /api/users/auth/login, /api/users/auth/refresh-token`);
    console.log(`🛡️  Admin API: http://localhost:${PORT}/api/admin`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🍎 Food Products API: http://localhost:${PORT}/api/foodproducts`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  });
}

export default app;
