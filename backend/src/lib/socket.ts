import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export function initSocket(httpServer: HttpServer, frontendUrl: string): Server {
  io = new Server(httpServer, {
    cors: { origin: frontendUrl },
  });

  io.on("connection", (socket) => {
    socket.on("watch-listing", (listingId: string) => {
      socket.join(`listing:${listingId}`);
    });

    socket.on("unwatch-listing", (listingId: string) => {
      socket.leave(`listing:${listingId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized — call initSocket() first");
  }
  return io;
}
