import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

// Mở rộng interface Request để thêm trường user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware bảo vệ route
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as JwtPayload;

      // Lấy user từ token
      (req as any).user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware xác thực admin từ custom headers
export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  console.log('Admin auth middleware - Headers received:', 
    Object.keys(req.headers).map(h => `${h}: ${req.headers[h]}`));
  
  // Check for the admin authorization header (both direct and case-insensitive)
  const adminAuth = req.headers.adminauthorization || req.headers.AdminAuthorization;
  // If not found directly, try case-insensitive search
  const adminAuthHeader = adminAuth || 
    Object.keys(req.headers).find(h => h.toLowerCase() === 'adminauthorization');
  
  if ((adminAuthHeader && typeof adminAuthHeader === 'string' && adminAuthHeader.startsWith('Bearer')) || 
      (req.headers[adminAuthHeader as string] && 
       req.headers[adminAuthHeader as string]?.toString().startsWith('Bearer'))) {
    try {
      // Get the token from the header (handle both direct access and via found header)
      token = adminAuth ? 
        (typeof adminAuth === 'string' ? adminAuth.split(' ')[1] : adminAuth.toString().split(' ')[1]) : 
        req.headers[adminAuthHeader as string]?.toString().split(' ')[1];
        
      console.log('Admin token received:', token ? 'Valid token' : 'Invalid token');
      
      // Get admin role and email from headers (try both direct and case-insensitive)
      const adminRole = req.headers['x-admin-role'] || req.headers['X-Admin-Role'] || 
        req.headers[Object.keys(req.headers).find(h => h.toLowerCase() === 'x-admin-role') || ''];
        
      const adminEmail = req.headers['x-admin-email'] || req.headers['X-Admin-Email'] || 
        req.headers[Object.keys(req.headers).find(h => h.toLowerCase() === 'x-admin-email') || ''];
      
      console.log('Admin authentication - Role:', adminRole, 'Email:', adminEmail);
      
      if (!adminRole || adminRole.toString() !== 'admin' || !adminEmail) {
        console.log('Admin authentication failed - Invalid role or email');
        return res.status(401).json({ 
          message: 'Admin authentication failed, redirecting to login page' 
        });
      }
      
      // Set user object for admin role check middleware
      (req as any).user = {
        role: 'admin',
        email: adminEmail.toString()
      };
      
      console.log('Admin authentication successful');
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(401).json({ 
        message: 'Admin authentication failed, redirecting to login page' 
      });
    }
  } else {
    console.log('Admin authorization header missing or invalid');
    console.log('Available headers:', Object.keys(req.headers).join(', '));
    return res.status(401).json({ 
      message: 'Admin authentication failed, redirecting to login page' 
    });
  }
};

// Middleware cho các role cụ thể
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.role)) {
      return res.status(403).json({
        message: `Role ${(req as any).user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Middleware kiểm tra role
export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// Middleware kiểm tra role manufacturer
export const manufacturer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'manufacturer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a manufacturer' });
  }
};

// Middleware kiểm tra role brand
export const brand = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'brand' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a brand' });
  }
};

// Middleware kiểm tra role retailer
export const retailer = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'retailer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a retailer' });
  }
}; 