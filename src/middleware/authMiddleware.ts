import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { Session } from 'express-session';

// Extend SessionData
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Mở rộng interface Request để thêm trường user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Simple authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Session', req.session);
  
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  next();
};

// Protect middleware - xác thực session
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let user: any = null;

  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Session:', req.session ? 'EXISTS' : 'NONE');
    console.log('Session userId:', req.session?.userId || 'NONE');
    
    // Kiểm tra Session authentication
    if (req.session && req.session.userId) {
      console.log('Session authentication attempt...');
      console.log('Session userId:', req.session.userId);
      
      try {
        // Tìm user từ session
        user = await User.findById(req.session.userId).select("-password");
        
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
        } else {
          console.log('Session User not found in database');
        }
      } catch (sessionError) {
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
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: "Server error in authentication" });
  }
};

// Middleware xác thực admin từ custom headers
export const protectAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log headers để dễ debug
  console.log(
    "Admin auth middleware - Headers received:",
    Object.keys(req.headers)
      .filter(h => !h.includes("sec-") && !h.includes("accept") && !h.includes("cache"))
      .map((h) => `${h}: ${req.headers[h]}`)
  );

  try {
    // Kiểm tra header AdminAuthorization (cả viết hoa và viết thường)
    const adminAuthHeader = 
      req.headers.adminauthorization || 
      req.headers.AdminAuthorization || 
      req.headers['admin-authorization'] ||
      req.headers['adminauthorization'];
    
    // Kiểm tra header X-Admin-Role (cả viết hoa và viết thường)
    const adminRole = 
      req.headers['x-admin-role'] || 
      req.headers['X-Admin-Role'] || 
      req.headers['x-admin-role'] ||
      req.headers['X-ADMIN-ROLE'];
    
    // Kiểm tra header X-Admin-Email (cả viết hoa và viết thường)
    const adminEmail = 
      req.headers['x-admin-email'] || 
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
    } else {
      token = adminAuthHeader.toString();
    }

    console.log("Admin token processed:", token ? "Valid format" : "Invalid format");

    // Gán thông tin user admin vào request
    (req as any).user = {
      role: "admin",
      email: typeof adminEmail === 'string' ? adminEmail : adminEmail.toString(),
    };

    console.log("Admin authentication successful for:", (req as any).user.email);
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Admin authentication failed: Server error"
    });
  }
};

// Middleware cho các role cụ thể
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.role)) {
      return res.status(403).json({
        message: `Role ${
          (req as any).user.role
        } is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Admin middleware - kiểm tra role admin
export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('=== ADMIN MIDDLEWARE DEBUG ===');
    console.log('User role:', req.user?.role);
    
    if (req.user && req.user.role === "admin") {
      console.log('✅ Admin access granted');
      next();
    } else {
      console.log('❌ Admin access denied - wrong role');
      res.status(403).json({ 
        message: "Access denied. Admin role required.",
        currentRole: req.user?.role || 'undefined'
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: "Server error in role verification" });
  }
};

// Middleware kiểm tra role manufacturer
export const manufacturer = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('=== MANUFACTURER MIDDLEWARE DEBUG ===');
    console.log('User in request:', req.user ? 'YES' : 'NO');
    console.log('User role:', req.user?.role);
    
    if (req.user && (req.user.role === "manufacturer" || req.user.role === "admin")) {
      console.log('✅ Manufacturer access granted');
      next();
    } else {
      console.log('❌ Manufacturer access denied - wrong role');
      res.status(403).json({ 
        message: "Access denied. Manufacturer role required.",
        currentRole: req.user?.role || 'undefined'
      });
    }
  } catch (error) {
    console.error('Manufacturer middleware error:', error);
    res.status(500).json({ message: "Server error in role verification" });
  }
};

// Middleware kiểm tra role brand
export const brand = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && (req.user.role === "brand" || req.user.role === "admin")) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as a brand" });
  }
};

// Middleware kiểm tra role retailer
export const retailer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && (req.user.role === "retailer" || req.user.role === "admin")) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as a retailer" });
  }
};
