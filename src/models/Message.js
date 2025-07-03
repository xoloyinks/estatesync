import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    trim: true, // Allow empty content for file messages
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    default: null, // For file messages
  },
  fileType: {
    type: String,
    default: null, // e.g., "image/jpeg", "application/pdf"
  },
  fileName: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;