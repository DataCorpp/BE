import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Session } from 'express-session';

interface JwtPayload {
  id: string;
}

// Extend SessionData
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

// Mở rộng interface Request để thêm trường user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware bảo vệ route sử dụng session
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Protect middleware - Session check:", req.session ? "Session exists" : "No session");
    
    // Kiểm tra xem có userId trong session không
    if (req.session && req.session.userId) {
      console.log(`Session user ID found: ${req.session.userId}`);
      
      // Tìm user từ session
      const user = await User.findById(req.session.userId).select("-password");
      
      if (!user) {
        console.log("User not found in database despite having session ID");
        res.status(401).json({ message: "User not found, please login again" });
        return;
      }
      
      console.log(`User found: ${user.email}, role: ${user.role}`);
      
      // Thêm thông tin user vào request
      (req as any).user = user;
      next();
    } else {
      console.log("No user session found");
      res.status(401).json({ message: "Not authorized, please login" });
    }
  } catch (error) {
    console.error("Session authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
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

// Middleware kiểm tra role
export const admin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

// Middleware kiểm tra role manufacturer
export const manufacturer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    req.user &&
    (req.user.role === "manufacturer" || req.user.role === "admin")
  ) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as a manufacturer" });
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
