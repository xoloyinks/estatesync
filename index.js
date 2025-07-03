import express from "express";
import cors from "cors";
import routes from "./src/router/index.js";
import connectDb from "./mongo.js";
import { createServer } from "http";
import { Server as socketIo } from "socket.io";
import initializeSocket from "./src/utils/socketHandler.js";
import { jwtVerify } from "./src/utils/jwt.js";

const server = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server_io = createServer(server);

// Initialize Socket.IO with custom path and CORS
const io = new socketIo(server_io, {
  cors: {
    origin: "*", // Adjust to your frontend URL in production (e.g., http://localhost:3000)
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
  path: "/api/socket.io",
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    console.error("Socket.IO auth error: No token provided");
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwtVerify(token); // Use custom jwtVerify
    socket.user = decoded; // Attach user data (e.g., { id: userId }) to socket
    console.log("Socket.IO auth success, user:", decoded.id);
    next();
  } catch (error) {
    console.error("Socket.IO auth error:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Initialize Socket.IO handlers
initializeSocket(io);

server.get("/", (req, res) => {
  res.send("Welcome to the Server!");
});

server.use(cors());
server.use(express.json({ limit: "100mb" }));
server.use(express.urlencoded({ limit: "100mb", extended: true }));
server.use("/api", routes);

// Start HTTP server
server_io.listen(PORT, () => {
  connectDb();
  console.log(`Connected to port ${PORT}`);
});