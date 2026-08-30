import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import bidRoutes from "./routes/bids";
import { initSocket } from "./lib/socket";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// initSocket attaches Socket.io to httpServer here so getIO() works
// correctly wherever it's called (including during tests) — but since
// httpServer is never listen()'d in this file, no port is actually
// bound just by importing this module. Supertest tests the `app`
// (Express handler) directly and binds its own ephemeral port
// internally, independent of this httpServer.
initSocket(httpServer, FRONTEND_URL);

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/listings", bidRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export { httpServer };
export default app;
