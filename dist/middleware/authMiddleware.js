"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retailer = exports.brand = exports.manufacturer = exports.admin = exports.authorize = exports.protectAdmin = exports.protect = exports.requireAuth = void 0;
const User_1 = __importDefault(require("../models/User"));
// Simple authentication middleware
const requireAuth = (req, res, next) => {
    var _a;
    console.log('Session', req.session);
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId)) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
};
exports.requireAuth = requireAuth;
// Protect middleware - xác thực session
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let user = null;
    try {
        console.log('=== AUTH MIDDLEWARE DEBUG ===');
        console.log('Headers:', req.headers);
        console.log('Session:', req.session ? 'EXISTS' : 'NONE');
        console.log('Session userId:', ((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId) || 'NONE');
        // Kiểm tra Session authentication
        if (req.session && req.session.userId) {
            console.log('Session authentication attempt...');
            console.log('Session userId:', req.session.userId);
            try {
                // Tìm user từ session
                user = yield User_1.default.findById(req.session.userId).select("-password");
                if (user) {
                    console.log('Session User found:', {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        companyName: user.companyName
                    });
                    if (user.status !== 'active') {
                        return res.status(401).json({
                            message: "User account is not active",
                            code: "USER_INACTIVE"
                        });
                    }
                    req.user = user;
                    console.log('✅ Session authentication successful');
                    return next();
                }
                else {
                    console.log('Session User not found in database');
                }
            }
            catch (sessionError) {
                console.log('Session verification failed:', sessionError);
            }
        }
        // Nếu không có session hợp lệ
        console.log('❌ No valid authentication found');
        res.status(401).json({
            message: "Not authorized, please login again",
            authType: "session_failed",
            hasSession: !!(req.session && req.session.userId)
        });
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: "Server error in authentication" });
    }
});
exports.protect = protect;
// Middleware xác thực admin từ custom headers
const protectAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Log headers để dễ debug
    console.log("Admin auth middleware - Headers received:", Object.keys(req.headers)
        .filter(h => !h.includes("sec-") && !h.includes("accept") && !h.includes("cache"))
        .map((h) => `${h}: ${req.headers[h]}`));
    try {
        // Kiểm tra header AdminAuthorization (cả viết hoa và viết thường)
        const adminAuthHeader = req.headers.adminauthorization ||
            req.headers.AdminAuthorization ||
            req.headers['admin-authorization'] ||
            req.headers['adminauthorization'];
        // Kiểm tra header X-Admin-Role (cả viết hoa và viết thường)
        const adminRole = req.headers['x-admin-role'] ||
            req.headers['X-Admin-Role'] ||
            req.headers['x-admin-role'] ||
            req.headers['X-ADMIN-ROLE'];
        // Kiểm tra header X-Admin-Email (cả viết hoa và viết thường)
        const adminEmail = req.headers['x-admin-email'] ||
            req.headers['X-Admin-Email'] ||
            req.headers['x-admin-email'] ||
            req.headers['X-ADMIN-EMAIL'];
        console.log("Admin auth check - Headers processed:", {
            adminAuthHeader: adminAuthHeader ? "Present" : "Missing",
            adminRole: adminRole || "Missing",
            adminEmail: adminEmail || "Missing"
        });
        // Kiểm tra sự tồn tại của các header bắt buộc
        if (!adminAuthHeader) {
            console.log("Admin authorization header missing");
            return res.status(401).json({
                success: false,
                message: "Admin authentication failed: Missing authorization header"
            });
        }
        if (!adminRole || (typeof adminRole === 'string' && adminRole.toLowerCase() !== 'admin')) {
            console.log(`Admin role invalid: ${adminRole}`);
            return res.status(401).json({
                success: false,
                message: "Admin authentication failed: Invalid admin role"
            });
        }
        if (!adminEmail) {
            console.log("Admin email missing");
            return res.status(401).json({
                success: false,
                message: "Admin authentication failed: Missing admin email"
            });
        }
        // Kiểm tra token format - dễ dàng hóa việc kiểm tra 
        // Cả "Bearer token" và chỉ "token" đều được chấp nhận
        let token;
        if (typeof adminAuthHeader === 'string') {
            token = adminAuthHeader.startsWith('Bearer ')
                ? adminAuthHeader.split(' ')[1]
                : adminAuthHeader;
        }
        else {
            token = adminAuthHeader.toString();
        }
        console.log("Admin token processed:", token ? "Valid format" : "Invalid format");
        // Gán thông tin user admin vào request
        req.user = {
            role: "admin",
            email: typeof adminEmail === 'string' ? adminEmail : adminEmail.toString(),
        };
        console.log("Admin authentication successful for:", req.user.email);
        next();
    }
    catch (error) {
        console.error("Admin auth error:", error);
        return res.status(401).json({
            success: false,
            message: "Admin authentication failed: Server error"
        });
    }
});
exports.protectAdmin = protectAdmin;
// Middleware cho các role cụ thể
const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role ${req.user.role} is not authorized to access this resource`,
            });
        }
        next();
    };
};
exports.authorize = authorize;
// Admin middleware - kiểm tra role admin
const admin = (req, res, next) => {
    var _a, _b;
    try {
        console.log('=== ADMIN MIDDLEWARE DEBUG ===');
        console.log('User role:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        if (req.user && req.user.role === "admin") {
            console.log('✅ Admin access granted');
            next();
        }
        else {
            console.log('❌ Admin access denied - wrong role');
            res.status(403).json({
                message: "Access denied. Admin role required.",
                currentRole: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'undefined'
            });
        }
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: "Server error in role verification" });
    }
};
exports.admin = admin;
// Middleware kiểm tra role manufacturer
const manufacturer = (req, res, next) => {
    var _a, _b;
    try {
        console.log('=== MANUFACTURER MIDDLEWARE DEBUG ===');
        console.log('User in request:', req.user ? 'YES' : 'NO');
        console.log('User role:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        if (req.user && (req.user.role === "manufacturer" || req.user.role === "admin")) {
            console.log('✅ Manufacturer access granted');
            next();
        }
        else {
            console.log('❌ Manufacturer access denied - wrong role');
            res.status(403).json({
                message: "Access denied. Manufacturer role required.",
                currentRole: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'undefined'
            });
        }
    }
    catch (error) {
        console.error('Manufacturer middleware error:', error);
        res.status(500).json({ message: "Server error in role verification" });
    }
};
exports.manufacturer = manufacturer;
// Middleware kiểm tra role brand
const brand = (req, res, next) => {
    if (req.user && (req.user.role === "brand" || req.user.role === "admin")) {
        next();
    }
    else {
        res.status(401).json({ message: "Not authorized as a brand" });
    }
};
exports.brand = brand;
// Middleware kiểm tra role retailer
const retailer = (req, res, next) => {
    if (req.user && (req.user.role === "retailer" || req.user.role === "admin")) {
        next();
    }
    else {
        res.status(401).json({ message: "Not authorized as a retailer" });
    }
};
exports.retailer = retailer;
