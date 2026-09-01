import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
}

export function watchListing(listingId: string) {
  getSocket().emit("watch-listing", listingId);
}

export function unwatchListing(listingId: string) {
  getSocket().emit("unwatch-listing", listingId);
}
