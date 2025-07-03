import express from "express"
import jwtMiddleware from "../middlewares/check_user.js";
import { getDocumentUrl, upload } from "../setup/aws_s3.js";
import { UploadDoc } from "../services/UploadDoc.js";
import Application from "../models/application.js";
import { getProperty, getUser } from "./get_models.js";

const router = express.Router()
const app = express();

router.post('/', jwtMiddleware, upload.single('image'), async (req, res) => {
    try{
        const { id, status, email, property } = req.body;
        const image = req.file;

        if(!image){
            return res.status(404).json({ message: "Image not attached!" });
        }

        const savedDocument = await UploadDoc({ email, filename: image.originalname, buffer: image.buffer});
        if(!savedDocument){
            return res.status(500).json({ message: "Failed to save document" });
        }

        const prefix = "HOU";
        const number = Math.floor(Math.random() * 9000) + Math.floor(Math.random() * 1000); 
        const code = `${prefix}${number}`;

        const application = {
            user: id,
            proof: await savedDocument._id,
            status,
            code,
            property
        }

        const savedApplication = await Application.create(application);

        if (!savedApplication) {
            return res.status(500).json({ message: "Failed to save application" });
        }

        return res.status(201).json({ message: "Application submitted!", data: code })
    }catch(err){
        return res.status(500).json({ message: "Internal Server error", data: err.message })
    }
})

router.get('/:id', jwtMiddleware, async (req, res) => {
    try{
        let application = await Application.findOne({code: req.params.id});
        if(!application){
            return res.status(404).json({ message: "Error returning application" })
        }

        const data = {
            id: application._id,
            user: await getUser(application.user),
            property: await getProperty(application.property),
            proof: await getDocumentUrl(application.proof),
            status: application.status,
            code: application.code,
            createdAt: application.createdAt,
        };

        // Return the response
        return res.status(200).json({ message: "Application returned", data });
    }catch(err){
        return res.status(500).json({ message: "Internal Server error" });
    }
})

router.get('/', jwtMiddleware, async (req, res) => {
    try{
        const applications = await Application.find({});
        if(!applications){
            return res.status(404).json({ message: "Error returning application" })
        }
        if(Array.isArray(applications)){
            const data = await Promise.all(
                applications.map(async(datum) => {
                    let obj = datum.toObject();
                    return {
                        id: obj._id,
                        user: await getUser(obj.user),
                        property: await getProperty(obj.property),
                        proof: await getDocumentUrl(obj.proof),
                        status: obj.status,
                        code: obj.code,
                        createdAt: obj.createdAt,
                    }
                })
            )
            return res.status(201).json({ message: "Applications returned", data })
        }
        
    }catch(err){
        return res.status(500).json({ message: "Internal Server error" });
    }
})

router.patch('/approve/:id', jwtMiddleware, async (req, res) => {
    try{
        const approvedApplication = await Application.findOneAndUpdate(
            { code: req.params.id },
            { status: "approved",
              payment: "pending"
            },
            { new: true }
        );
        if(!approvedApplication){
            return res.status(404).json({ message: "Error approving application" })
        }
        return res.status(200).json({ message: "Application approved" });
    }catch(err){
        return res.status(500).json({ message: "Internal Server error" });
    }
})

router.patch('/reject/:id', jwtMiddleware, async (req, res) => {
    try{
        const rejectedApplication = await Application.findOneAndUpdate(
            { code: req.params.id },
            { status: "rejected" },
            { new: true }
        );
        if(!rejectedApplication){
            return res.status(404).json({ message: "Error rejecting application" })
        }
        return res.status(200).json({ message: "Application rejected" });
    }catch(err){
        return res.status(500).json({ message: "Internal Server error" });
    }
})

export default router