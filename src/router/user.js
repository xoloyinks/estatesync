import express from 'express'
import { getDocumentUrl, upload } from '../setup/aws_s3.js';
import { UploadDoc } from '../services/UploadDoc.js';
import User from '../models/user.js';
import jwtMiddleware from '../middlewares/check_user.js';
import { comparePasswords, hashPassword } from '../utils/bcrypting.js';
import { getUser } from './get_models.js';

const router = express.Router();
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

router.patch('/update', jwtMiddleware, upload.single('image'), async (req, res) => {
    // console.log(req.body)
    // res.send('Memo');
    try {
        const { email, first_name, last_name, new_email, phone_number } = req.body;
        const image = req.file;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // let hashedPassword = await hashPassword(password);

        // Build updateFields only from allowed fields
        let updateFields = {};
        if (first_name) updateFields.first_name = first_name;
        if (last_name) updateFields.last_name = last_name;
        // if (hashedPassword) updateFields.password = hashedPassword; 
        if (phone_number) updateFields.phone_number = phone_number; 

        // Check if new_email is provided and not already taken
        if (new_email && new_email !== email) {
            const emailExists = await User.exists({ email: new_email });
            if (emailExists) {
                return res.status(409).json({ message: "New email is already taken" });
            }
            updateFields.email = new_email;
        }

        // Handle image upload
        if (image) {
            const savedDocument = await UploadDoc({ email, filename: image.originalname, buffer: image.buffer });
            if (!savedDocument) {
                return res.status(500).json({ message: "Failed to save document" });
            }
            updateFields.image = await getDocumentUrl(savedDocument._id);
        }

        // Prevent updating fields not in allowedFields
        // (Mongoose $set will only update fields present in updateFields)

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.patch('/updatePassword', jwtMiddleware, async (req, res) => {
    try {
        const { email, current_password, new_password } = req.body;

        if (!email || !current_password || !new_password) {
            return res.status(400).json({ message: "Email, current password, and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await comparePasswords(current_password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // If you hash passwords, hash new_password here before saving!
        let hashedNewPassword = await hashPassword(new_password); 
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: { password: hashedNewPassword } },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ message: "Password updated successfully", user: updatedUser });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.get('/', jwtMiddleware, async (req, res) => {
    try{
        const users = await User.find({});
        res.send(users)
    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
})

router.get('/admin', jwtMiddleware, async (req, res) => {
    try {
        let admin = await User.findOne({ role: 'admin' });
        if (!admin || admin.length === 0) {
            return res.status(404).json({ message: "No admin found" });
        }
        const data = {
            _id: admin._id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email,
            role: admin.role,
            phone_number: admin.phone_number,
            image: admin.image || null, // Handle case where image might not be set
        }
        res.status(200).json({ message: "Admin retrieved successfully", data });
        // console.log("admin", admin)
    } catch (err) {
        console.error("Error fetching admins:", err.message);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.get('/:id', async(req, res) => {
    try{
        const user = await User.findById(req.params.id);
        res.send(user)
    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});







export default router