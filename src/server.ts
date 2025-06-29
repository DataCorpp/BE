import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
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
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "AdminAuthorization",
      "X-Admin-Role",
      "X-Admin-Email",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/foodproducts", foodProductRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin API available at http://localhost:${PORT}/api/admin`);
    console.log(`User API available at http://localhost:${PORT}/api/users`);
    console.log(`Food Products API available at http://localhost:${PORT}/api/foodproducts`);
  });
}

export default app;
