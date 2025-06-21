import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Session } from 'express-session';

interface JwtPayload {
  id: string;
  role?: string;
  type?: 'access' | 'refresh';
}

interface RefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Store refresh tokens in memory (in production, use Redis or database)
const refreshTokenStore: Map<string, RefreshTokenData> = new Map();

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

// Helper functions for JWT
export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { 
      id: userId, 
      role: role,
      type: 'access'
    }, 
    process.env.JWT_SECRET || "fallbacksecret", 
    { 
      expiresIn: "15m" // 15 minutes
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { 
      id: userId,
      type: 'refresh'
    }, 
    process.env.JWT_REFRESH_SECRET || "fallbackrefreshsecret", 
    { 
      expiresIn: "7d" // 7 days
    }
  );
};

export const storeRefreshToken = (userId: string, token: string): void => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  refreshTokenStore.set(token, {
    userId,
    token,
    expiresAt,
    createdAt: new Date()
  });

  // Clean up expired tokens
  cleanExpiredRefreshTokens();
};

export const validateRefreshToken = (token: string): RefreshTokenData | null => {
  const tokenData = refreshTokenStore.get(token);
  
  if (!tokenData) {
    return null;
  }

  if (new Date() > tokenData.expiresAt) {
    refreshTokenStore.delete(token);
    return null;
  }

  return tokenData;
};

export const removeRefreshToken = (token: string): void => {
  refreshTokenStore.delete(token);
};

const cleanExpiredRefreshTokens = (): void => {
  const now = new Date();
  for (const [token, data] of refreshTokenStore.entries()) {
    if (now > data.expiresAt) {
      refreshTokenStore.delete(token);
    }
  }
};

// Middleware bảo vệ route với JWT access token
export const protectWithAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Kiểm tra Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        message: "Access token required",
        code: "NO_TOKEN"
      });
    }

    try {
      // Verify access token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || "fallbacksecret"
      ) as JwtPayload;

      // Kiểm tra token type
      if (decoded.type !== 'access') {
        return res.status(401).json({ 
          message: "Invalid token type",
          code: "INVALID_TOKEN_TYPE"
        });
      }

      // Tìm user từ JWT payload
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({ 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ 
          message: "User account is not active",
          code: "USER_INACTIVE"
        });
      }

      console.log(`Access token authentication successful for user: ${user.email}`);
      (req as any).user = user;
      return next();

    } catch (jwtError: any) {
      console.log("Access token verification failed:", jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: "Access token expired",
          code: "TOKEN_EXPIRED"
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: "Invalid access token",
          code: "INVALID_TOKEN"
        });
      }

      return res.status(401).json({ 
        message: "Token verification failed",
        code: "TOKEN_VERIFICATION_FAILED"
      });
    }
    
  } catch (error) {
    console.error("Access token authentication error:", error);
    res.status(500).json({ 
      message: "Authentication server error",
      code: "SERVER_ERROR"
    });
  }
};

// Protect middleware - xác thực cả JWT token và session
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  let user: any = null;

  try {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Session:', req.session ? 'EXISTS' : 'NONE');
    console.log('Session userId:', (req.session as any)?.userId || 'NONE');
    
    // 1. Kiểm tra JWT Token từ Authorization header (PRIORITY 1)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        token = req.headers.authorization.split(" ")[1];
        console.log('JWT Token found:', token ? 'YES' : 'NO');
        console.log('Token length:', token?.length || 0);
        
        if (token) {
          // Verify JWT token
          const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
          console.log('JWT_SECRET available:', !!JWT_SECRET);
          
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('Token decoded successfully:', {
            userId: decoded.id,
            email: decoded.email,
            role: decoded.role
          });

          // Lấy user từ database
          user = await User.findById(decoded.id).select("-password");
          if (user) {
            console.log('JWT User found:', {
              id: user._id,
              email: user.email,
              role: user.role,
              companyName: user.companyName
            });

            req.user = user;
            console.log('✅ JWT authentication successful');
            return next();
          } else {
            console.log('JWT User not found in database');
          }
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError);
        // Continue to session check if JWT fails
      }
    }

    // 2. Kiểm tra Session authentication (FALLBACK)
    if (req.session && (req.session as any).userId) {
      console.log('Session authentication attempt...');
      console.log('Session userId:', (req.session as any).userId);
      
      try {
        // Tìm user từ session
        user = await User.findById((req.session as any).userId).select("-password");
        
        if (user) {
          console.log('Session User found:', {
            id: user._id,
            email: user.email,
            role: user.role,
            companyName: user.companyName
          });
          
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

    // 3. Nếu không có cả JWT và session hợp lệ
    console.log('❌ No valid authentication found');
    res.status(401).json({ 
      message: "Not authorized, please login again",
      authType: "both_failed",
      hasJWT: !!token,
      hasSession: !!(req.session && (req.session as any).userId)
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
