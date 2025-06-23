"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const foodProductRoutes_1 = __importDefault(require("./routes/foodProductRoutes"));
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
    ],
    credentials: true,
}));
app.use(express_1.default.json());
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions",
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
}));
// Routes
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/products", productRoutes_1.default);
app.use("/api/foodproducts", foodProductRoutes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});
// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Admin API available at http://localhost:${PORT}/api/admin`);
        console.log(`User API available at http://localhost:${PORT}/api/users`);
        console.log(`Products API available at http://localhost:${PORT}/api/products`);
        console.log(`Food Products API available at http://localhost:${PORT}/api/foodproducts`);
    });
}
exports.default = app;
