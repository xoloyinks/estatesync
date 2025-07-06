import express from 'express'
import { upload, getDocumentUrl } from '../setup/aws_s3.js';
import User from '../models/user.js';
import { jwtSign } from '../utils/jwt.js';
import { hashPassword, comparePasswords } from '../utils/bcrypting.js';
import { getUser } from './get_models.js';
import { UploadDoc } from '../services/UploadDoc.js';


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

      const userExist = await User.findOne({email: req.body.email});
      if(userExist){
           return res.status(400).json({ message: "User with email already exists" });
      }

      const savedDocument = await UploadDoc({email: req.body.email, filename: req.file.originalname, buffer: req.file.buffer})
      if (!savedDocument) {
        return res.status(500).json({ message: "Failed to save document" });
      }

      let hashedPassword = await hashPassword(req.body.password);
      
      const userData = {
        email: req.body.email,
        gender: req.body.gender,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone_number: req.body.phone_number,
        role: req.body.role,
        image: savedDocument._id,
        password: hashedPassword,
      };
      

      const savedUser = await User.create(userData);
      
      if (!savedUser) {
        return res.status(500).json({ message: "Failed to save user" });
      }

      const s3Filename = savedDocument._id;

      const userWithUrl = {
        ...savedUser.toObject(),
        image: getDocumentUrl(s3Filename),
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
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required!" });
    }

    let user = await User.findOne({email: email.toLowerCase()})

    if(user){
      if(await comparePasswords(password, user.password)){
        const token = jwtSign({ 
          id: user._id, email: user.email, role: user.role 
      });
      res.status(200).json({
        token,
        message: "Logged in",
        data: await getUser(user)
      })
    }else{
        return res.status(401).json({ message: "Invalid password" });
      }
    } else{
      return res.status(404).json({ message: "User not found" });
    }
})

export default router