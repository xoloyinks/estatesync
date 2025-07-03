import mongoose from "mongoose";
import Message from "../models/Message.js";
import Document from "../models/document.js";
import { uploadFileToS3, getDocumentUrl } from "../setup/aws_s3.js";
import User from "../models/user.js";

const initializeSocket = (io) => {
  // Helper function to log the number of clients in a room
  const logRoomClients = (roomName) => {
    const room = io.sockets.adapter.rooms.get(roomName);
    const clientCount = room ? room.size : 0;
    console.log(`Room ${roomName} has ${clientCount} client(s) connected`);
  };

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user.id}`);
    let myid; // Variable to store userId for later use
    socket.on("join", (userId) => {
      myid = userId; // Store userId in a variable for later use
      console.log(`Join request: userId=${userId}, socket.id=${socket.id}, authId=${socket.user?.id}`);
      if (!userId) {
        console.error("No userId provided");
        socket.emit("error", "No userId provided");
        return;
      }
      const userIdStr = userId.toString(); // Ensure userId is a string
      if (userIdStr !== socket.user?.id?.toString()) {
        console.error("Unauthorized join attempt", { userId, authId: socket.user?.id });
        socket.emit("error", "Unauthorized join attempt");
        return;
      }
      const room = `user:${userIdStr}`;
      socket.join(room);
      console.log(`User ${userIdStr} joined room ${room}`);
      console.log("Socket rooms:", Array.from(socket.rooms)); // Should include socket.id and room
      const clients = io.sockets.adapter.rooms.get(room);
      console.log(`Clients in ${room}:`, clients ? Array.from(clients) : "None");
      logRoomClients(room);
    });

    socket.on("messageSend", async ({ senderId, content, receiverId }) => {
      console.log("Received messageSend:", { senderId, content, receiverId });
      try {
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
          console.error("Invalid ObjectId:", { senderId, receiverId });
          socket.emit("error", "Invalid user IDs");
          return;
        }

        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
          createdAt: new Date(),
        });
        await message.save();
        console.log("Message saved:", message);

        io.to(`user:${receiverId}`).emit("message", message);
        io.to(`user:${senderId}`).emit("message", message);
        console.log(`Emitted message to rooms: user:${senderId}, user:${receiverId}`);
        logRoomClients(`user:${senderId}`);
        logRoomClients(`user:${receiverId}`);
      } catch (error) {
        console.error("Error handling message:", error.message);
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("fileMessageSend", async ({ senderId, receiverId, file, fileName, fileType, content }) => {
      console.log("Received fileMessageSend:", { senderId, receiverId, fileName, fileType });
      try {
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
          console.error("Invalid ObjectId:", { senderId, receiverId });
          socket.emit("error", "Invalid user IDs");
          return;
        }
        if (!file || !fileName || !fileType) {
          console.error("Invalid file data:", { fileName, fileType });
          socket.emit("error", "Invalid file data");
          return;
        }

        const allowedTypes = [
          "image/jpeg", "image/png", "image/gif",
          "application/pdf",
          "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
        ];
        if (!allowedTypes.includes(fileType)) {
          console.error("Unsupported file type:", fileType);
          socket.emit("error", "Unsupported file type");
          return;
        }

        const user = await User.findById(senderId).select("email");
        if (!user || !user.email) {
          console.error("User or email not found for ID:", senderId);
          socket.emit("error", "User email not found");
          return;
        }

        const filename = await uploadFileToS3(`chat-file-${senderId}-${fileName}`, Buffer.from(file));
        if (!filename) {
          console.error("Failed to upload file to S3");
          socket.emit("error", "Failed to upload file");
          return;
        }

        const document = await Document.create({
          name: fileName,
          filename,
          email: user.email,
        });

        const fileUrl = await getDocumentUrl(filename);
        if (!fileUrl) {
          console.error("Failed to get file URL for:", filename);
          socket.emit("error", "Failed to get file URL");
          return;
        }

        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          content,
          documentId: document.id,
          fileType,
          fileName,
          fileUrl,
          createdAt: new Date(),
        });
        await message.save();
        console.log("File message saved:", message);

        io.to(`user:${receiverId}`).emit("message", message);
        io.to(`user:${senderId}`).emit("message", message);
        console.log(`Emitted file message to rooms: user:${senderId}, user:${receiverId}`);
        logRoomClients(`user:${senderId}`);
        logRoomClients(`user:${receiverId}`);
      } catch (error) {
        console.error("Error handling file message:", error.message);
        socket.emit("error", "Failed to send file");
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}, User ID: ${socket.user.id}`);
      logRoomClients(`user:${socket.user.id}`);
    });
  });
};

export default initializeSocket;