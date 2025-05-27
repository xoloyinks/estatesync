import express from 'express'
import { uploadProfileImage, upload, getDocumentUrl } from '../setup/aws_s3.js';
import Document from '../models/document.js';
import User from '../models/user.js';
const router = express.Router()
const app = express();

// Debug middleware to log requests and responses
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.on("finish", () => {
    console.log(`Response sent for: ${req.method} ${req.url}`);
  });
  next();
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    console.log("Headers already sent, skipping error handler");
    return next(err);
  }
  console.error("Error:", err.message);
  return res.status(500).json({ message: "Upload failed", error: err.message });
});

router.post('/createAccount', upload.single('image'), async(req, res, next) => {
  try {
      if (!req.file) {
        return res.status(400).json({ message: "Profile image is required" });
      }
      if (!req.body.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (!req.body.last_name || !req.body.phone_number || !req.body.password) {
        return res.status(400).json({ message: "Last name, phone number, and password are required" });
      }

      const s3Filename = await uploadProfileImage(req.body.email, req.file.originalname, req.file.buffer);
      const documentData = new Document({
        name: req.file.originalname,
        filename: s3Filename,
        email: req.body.email,
      });
      
      const savedDocument = await documentData.save();
      
      const userData = {
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number,
        image: savedDocument._id,
        password: req.body.password,
      };

      const users = new User(userData)

      const savedUser = await users.save();
      if (!savedUser) {
        return res.status(500).json({ message: "Failed to save user" });
      }

      const userWithUrl = {
        ...savedUser.toObject(),
        image: getDocumentUrl(savedUser.image),
      };

      return res.status(200).json({
        message: "Profile image uploaded and user saved to MongoDB",
        user: userWithUrl,
      });
    } catch (error) {
      return next(error);
    }
})

router.post('/login', async (req, res) => {
    console.log(req.body);
    res.send({data: "Data received!"})
})

export default router