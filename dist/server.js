"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const foodProductRoutes_1 = __importDefault(require("./routes/foodProductRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
// Load environment variables from .env file
dotenv_1.default.config();
// Kết nối MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
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
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)()); // Cookie parser for handling cookies
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
// Session configuration with MongoDB storage
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || "fallback-session-secret",
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions",
        touchAfter: 24 * 3600, // Lazy session update - only update session every 24 hours
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
    name: "sessionId", // Custom session name for security
}));
// Routes
console.log('=== MOUNTING ROUTES ===');
app.use("/api/admin", adminRoutes_1.default);
console.log('✓ Admin routes mounted at /api/admin');
app.use("/api/users", userRoutes_1.default); // Session-based authentication
console.log('✓ User routes mounted at /api/users');
app.use("/api/products", productRoutes_1.default);
console.log('✓ Product routes mounted at /api/products');
app.use("/api/foodproducts", foodProductRoutes_1.default);
console.log('✓ Food product routes mounted at /api/foodproducts');
app.use("/api/projects", projectRoutes_1.default);
console.log('✓ Project routes mounted at /api/projects');
console.log('=====================');
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
// API Documentation endpoint
app.get("/api", (req, res) => {
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
        console.log(`👥 User API: http://localhost:${PORT}/api/users`);
        console.log(`  ├── Session Auth: /api/users/login, /api/users/logout`);
        console.log(`  └── Google OAuth: /api/users/google-login`);
        console.log(`🛡️  Admin API: http://localhost:${PORT}/api/admin`);
        console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
        console.log(`🍎 Food Products API: http://localhost:${PORT}/api/foodproducts`);
        console.log(`🏭 Projects API: http://localhost:${PORT}/api/projects`);
        console.log(`  ├── Project CRUD: /api/projects (GET, POST, PUT, DELETE)`);
        console.log(`  ├── Manufacturer Matching: /api/projects/:id/manufacturers`);
        console.log(`  └── Analytics: /api/projects/analytics`);
        console.log(`💚 Health Check: http://localhost:${PORT}/health`);
        console.log(`🗄️  Session Storage: MongoDB`);
    });
}
exports.default = app;
