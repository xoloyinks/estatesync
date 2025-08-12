import express from 'express';
import { upload, uploadImage } from '../setup/aws_s3.js';
import jwtMiddleware from '../middlewares/check_user.js';
import { hashPassword } from '../utils/bcrypting.js';
import User from '../models/user.js';
import Agent from '../models/agent.js';
import Document from '../models/document.js';
import Property from '../models/properties.js';
import { getProperty, getUser } from './get_models.js';

const router = express.Router();
const app = express();
app.use(express.json());

router.post('/add', upload.single('image'), jwtMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number, password, role, gender } = req.body;
    const image = req.file;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone_number || !password || !role || !image) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Upload image to S3 and save document
    const s3Filename = await uploadImage(email, image.originalname, image.buffer);
    if (!s3Filename) {
      return res.status(500).json({ message: "Failed to upload image to S3" });
    }
    const savedDocument = await Document.create({
      name: image.originalname,
      filename: s3Filename,
      email,
    });
    if (!savedDocument) {
      return res.status(500).json({ message: "Failed to save document" });
    }

    

    // Prepare assignedProperties as array of strings
    let assignedProperties = [];

    // Create user
    const savedUser = await User.create({
      email,
      first_name,
      gender,
      last_name,
      phone_number,
      role,
      image: savedDocument._id,
      password: hashedPassword,
    });

    // Create agent
    await Agent.create({
      user: savedUser._id,
      assignedProperties,
    });

    return res.status(201).json({ message: "Agent created successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

router.get('/properties/:id', jwtMiddleware, async(req, res) => {
  try{
      const agentProperties = await Property.find({agent: req.params.id});
      if(!agentProperties){
        return res.status(404).json({ message: "Error finding properties" });
      }
      if(Array.isArray(agentProperties)){
        const data = await Promise.all(
          agentProperties.map( async(property) => {
              return await getProperty(property);
          })
        );

        return res.status(201).json({ message: "Properties returned", data })
      }
      
  }catch(err){
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
})


// Get all agents
router.get('/', jwtMiddleware, async(req, res) => {
    try{
      const agents = await Agent.find({});
      if(!agents){
        return res.status(404).json({message: "Agents not found"})
      }
      const data = await Promise.all(
        agents.map(async (datum) => {
          let obj = datum.toObject();
          return {
            ...obj,
            user: await getUser(obj.user),
            assignedProperties: Array.isArray(obj.assignedProperties)
                            ? await Promise.all(obj.assignedProperties.map(async (property) => await getProperty(property) || null))
                            : [], 
          }
        })
      )
      return res.status(201).json({message: "Agents returned", data});
    }catch(err){
      return res.status(500).json({message: "Internal server error", data: err.message})
    }
})


// Get agent
router.get('/:id', jwtMiddleware, async(req, res) => {
  try{
    const agent = await Agent.findOne({ user: req.params.id });
     if(!agent){
        return res.status(404).json({message: "Agent not found"})
      }

      const data = {
        _id: agent._id,
        user: await getUser(agent.user),
         assignedProperties: Array.isArray(agent.assignedProperties)
                            ? await Promise.all(agent.assignedProperties.map(async (property) => await getProperty(property) || null))
                            : [], 
      }

      if(!data){
          return res.status(500).json({ message: "Error getting agent!" })
      }

      return res.status(201).json({ message: "Agent returned!", data })

  }catch(err){
    return res.status(500).json({message: "Internal server error", data: err.message})
  }
})


export default router;