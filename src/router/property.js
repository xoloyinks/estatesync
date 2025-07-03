import express from 'express';
import User from '../models/user.js';
import jwtMiddleware from '../middlewares/check_user.js';
import { upload, uploadImage, getDocumentUrl } from '../setup/aws_s3.js';
import Document from '../models/document.js';
import Property from '../models/properties.js';
import { getProperty } from './get_models.js';

const router = express.Router()
const app = express();
app.use(express.json());

router.post('/createProperty', upload.array('images'), jwtMiddleware, async (req, res) => {
  try {
    // Validate required fields
    const { title, location, price, agent_email, mode, bedrooms, description = '', admin_email } = req.body;
    if (!title || !location || !price || !agent_email || !mode || !bedrooms) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find agent by email
    const agent = await User.findOne({ email: agent_email });
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Validate images
    const arrayImages = req.files;
    if (!arrayImages || !Array.isArray(arrayImages) || arrayImages.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Upload images and save document references
    const docIdImages = [];
    for (const file of arrayImages) {
      const s3Filename = await uploadImage(admin_email, file.originalname, file.buffer);
      if (!s3Filename) {
        return res.status(500).json({ message: "Failed to upload image to S3" });
      }
      const documentData = {
        name: file.originalname,
        filename: s3Filename,
        email: admin_email,
      };
      const savedDocument = await Document.create(documentData);
      if (!savedDocument) {
        return res.status(500).json({ message: "Failed to save document" });
      }
      docIdImages.push(savedDocument._id);
    }

    // Create property
    const propertyData = {
      title,
      location,
      price,
      description,
      agent: agent._id,
      images: docIdImages,
      mode,
      bedrooms,
    };

    const newProperty = await Property.create(propertyData);
    if (!newProperty) {
      return res.status(500).json({ message: "Failed to create property" });
    }

    return res.status(201).json({ message: "Property created successfully", property: newProperty });
  } catch (err) {
    console.error("Error creating property:", err.message);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

router.get('/', async (req, res) => {
  
  try {
        const properties = await Property.find({});

        const propertiesWithImageUrls = await Promise.all(
            properties.map(async (property) => {
                let obj = property.toObject(); 
                const x = await getProperty(obj);                
                return x;
            })
        );

        if(!propertiesWithImageUrls){
          res.status(404).json({message: "Properies not found"})
        }

        res.status(201).json({message: "Properties returned", data: propertiesWithImageUrls});

    } catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
})

router.get('/:id', async (req, res) => {
    try{
      const property = await Property.findById(req.params.id)
      if(!property){
          res.status(404).json({message: "Property not found"});
      }
      res.status(201).json({message: "Property returned", data: property})
    }catch(err){
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
})



export default router;