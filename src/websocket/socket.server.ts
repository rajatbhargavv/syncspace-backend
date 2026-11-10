import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { SECRET_KEY_ACCESS } from "../config/env.js";
import { registerSocketHandlers } from "./socket.handlers.js";

let io: Server;

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((res, item) => {
    const parts = item.trim().split("=");
    const key = parts[0];
    const val = parts.slice(1).join("=");
    if (key && val) {
      res[key] = decodeURIComponent(val);
    }
    return res;
  }, {} as Record<string, string>);
}

export function initializeSocket(httpServer: HttpServer) {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
    : ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173"];

  io = new Server(httpServer, {
    cors: {
      origin: (origin: any, callback: any) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          process.env.NODE_ENV !== "production"
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    },
  });

  // Authentication middleware using accessToken cookie
  io.use((socket: any, next: (err?: any) => void) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      let token = cookies.accessToken || cookies.token;

      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, SECRET_KEY_ACCESS) as { id: string };
      if (!decoded || !decoded.id) {
        return next(new Error("Authentication error: Invalid token"));
      }

      (socket as any).userId = decoded.id;
      next();
    } catch (err: any) {
      return next(new Error("Authentication error: " + (err.message || "Failed to authenticate")));
    }
  });

  registerSocketHandlers(io);
  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.Io not initialized");
  }
  return io;
}
