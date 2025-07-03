import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import { getDocumentUrl } from "../setup/aws_s3.js";

const router = express.Router();

// Get chat history between two users
router.get("/history/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate("documentId") // Populate Document reference
      .sort({ createdAt: 1 })
      .lean(); // Convert to plain JavaScript objects for modification

    // Add fileUrl to messages with documentId
    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.documentId) {
          const fileUrl = await getDocumentUrl(msg.documentId._id.toString());
          return { ...msg, fileUrl, fileName: msg.documentId.name };
        }
        return msg;
      })
    );

    // console.log("Chat history with URLs:", messagesWithUrls);
    res.status(200).json(messagesWithUrls);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;