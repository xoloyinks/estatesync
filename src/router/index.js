import express from 'express'
import authRouter from './auth.js'
import propertyRouter from './property.js'
import agentRouter from './agent.js'
import userRouter from './user.js'
import issueRouter from './issue.js'
import tenantRouter from './tenant.js'
import applicationRouter from './application.js'
import chatRouter from "./chat.js"
import documentRouter from "./document.js";
import paystackRouter from "./paystack.js";


const router = express.Router();

router.use('/auth', authRouter)
router.use('/properties', propertyRouter)
router.use('/agents', agentRouter)
router.use('/users', userRouter)
router.use('/issues', issueRouter)
router.use('/tenants', tenantRouter)
router.use('/applications', applicationRouter)
router.use('/chat', chatRouter);
router.use("/document", documentRouter);
router.use("/subscription", paystackRouter)

export default router;