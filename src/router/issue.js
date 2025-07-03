import express from "express";
import jwtMiddleware from "../middlewares/check_user.js";
import Issue from "../models/issues.js";
import { getProperty, getUser } from "./get_models.js";

const router = express.Router();

router.post('/', jwtMiddleware, async (req, res) => {
    try {
        const { user, property, category, issue, description, agent } = req.body;

        if (!user || !property || !category || !issue ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const data = { user, property, category, issue, description, agent, status: 'Pending' };
        const createdIssue = await Issue.create(data);

        return res.status(201).json({ message: "Issue created successfully", issue: createdIssue });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

// Agent specific issues
router.get('/agent/:id', jwtMiddleware, async (req, res) => {
    try{
        const issues = await Issue.find({agent: req.params.id});
        if(!issues){
            return res.status(404).json({ message: "Error finding issues" });
        }
        if(Array.isArray(issues)){
            const data = await Promise.all(
                issues.map(async (issue) => ({
                    agent: issue.agent,
                    category: issue.category,
                    issue: issue.issue,
                    status: issue.status,
                    description: issue.description,
                    createdAt: issue.createdAt,
                    user: await getUser(issue.user),
                    property: await getProperty(issue.property)
                }))
            )
            return res.status(201).json({ message: "Issues returned", data })
        }
    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.get('/tenant/:id', jwtMiddleware, async (req, res) => {
    try{
        const issues = await Issue.find({ user: req.params.id });
        if(!issues){
            res.status(404).json({ message: "Error finding issues" });
        }
        const data = await Promise.all(
                    issues.map(async (datum) => {
                        let obj = datum.toObject(); 
                        return {
                            ...obj,
                            user: await getUser(obj.user), 
                            property: await getProperty(obj.property) 
                        };
                    })
                );
        res.status(200).json({ message: "Tenant issues returned", data })
    }catch(err){
        res.status(500).json({message: "internal server error", error: err.message})
    }
})

// All issues
router.get('/', jwtMiddleware, async (req, res) => {
    try{
        const issues = await Issue.find({});
        if(!issues){
            return res.status(404).json({message: "Issues not found"})
        }
        res.status(201).json({
            message: 'Issues returned',
            data: issues
        })
    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
})

router.patch('/:id', jwtMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const updatedIssue = await Issue.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!updatedIssue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.status(200).json({ message: 'Status updated!', issue: updatedIssue });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});


export default router;





