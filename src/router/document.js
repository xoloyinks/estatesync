import express from "express";
import { getDocumentUrl } from "../setup/aws_s3.js";

const router = express.Router();

router.get("/url/:documentId", async (req, res) => {
  try {
    const url = await getDocumentUrl(req.params.documentId);
    if (!url) return res.status(404).json({ error: "Document not found" });
    res.json({ url });
  } catch (error) {
    console.error("Error fetching document URL:", error);
    res.status(500).json({ error: "Failed to fetch document URL" });
  }
});

export default router;