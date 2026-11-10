import type { Server, Socket } from "socket.io";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";

export function registerSocketHandlers(io: Server) {
  io.on("connection", async (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`Socket connected: ${socket.id}, User: ${userId}`);

    if (userId) {
      // 1. Join personal user room: user:${userId}
      socket.join(`user:${userId}`);

      // 2. Join rooms for all spaces the user belongs to
      try {
        const ownedSpaces = await Space.find({ ownerId: userId }).select("_id").lean();
        const memberships = await SpaceMember.find({ userId, status: "ACTIVE" })
          .select("spaceId")
          .lean();

        const spaceIds = new Set<string>();
        ownedSpaces.forEach((s) => spaceIds.add(s._id.toString()));
        memberships.forEach((m) => spaceIds.add(m.spaceId.toString()));

        spaceIds.forEach((spaceId) => {
          socket.join(`space:${spaceId}`);
        });
      } catch (err) {
        console.error(`Error joining space rooms for user ${userId}:`, err);
      }
    }

    socket.on("space:join", (spaceId: string) => {
      if (spaceId) {
        socket.join(`space:${spaceId}`);
      }
    });

    socket.on("space:leave", (spaceId: string) => {
      if (spaceId) {
        socket.leave(`space:${spaceId}`);
      }
    });

    socket.on("disconnect", (reason: any) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
}
