import express from 'express'
import jwtMiddleware from '../middlewares/check_user.js';
import Tenant from '../models/tenant.js';
import Property from '../models/properties.js';
import User from '../models/user.js';
import { getProperty, getUser } from './get_models.js';
import Payment from '../models/payment.js';

const app = express()
const router = express.Router();
app.use(express.json());


router.get('/', jwtMiddleware, async (req, res) => {
    try {
        const tenants = await Tenant.find({});
        if (!tenants || tenants.length === 0) {
            return res.status(404).json({ message: "No tenants found" });
        }

        const data = await Promise.all(
            tenants.map(async (datum) => {
                let obj = datum.toObject(); // Convert Mongoose document to plain object
                return {
                    ...obj,
                    user: await getUser(obj.user), // Process autopopulated user
                    acquiredProperty: await getProperty(obj.acquiredProperty) // Process autopopulated acquiredProperty
                };
            })
        );

        return res.status(200).json({ message: "Tenants retrieved successfully", data });
    } catch (err) {
        console.error('Error fetching tenants:', err); // Log error for debugging
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.get('/:id', jwtMiddleware, async (req, res) => {
    try {
        // Find tenant by user ID
        const tenant = await Tenant.findOne({ user: req.params.id });

        // Check if tenant exists
        if (!tenant) {
            return res.status(404).json({ message: "No tenant found" });
        }

        // Convert tenant to plain object and resolve related data
        const tenantObj = tenant.toObject();
        const data = {
            ...tenantObj,
            user: await getUser(tenantObj.user),
            acquiredProperty: await getProperty(tenantObj.acquiredProperty),
        };

        // Return successful response
        return res.status(200).json({ message: "Tenant retrieved successfully", data });
    } catch (err) {
        console.error('Error fetching tenant:', err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

router.post('/add', jwtMiddleware, async (req, res) => {
    const { userId, propertyId, state } = req.body;
    try{
        // check if tenant is not currently occupying a property
        const checkTenantStatus = await User.findOne({_id: userId});
        if(checkTenantStatus.role === 'tenant'){
            return res.status(406).json({message: "Tenant currently occupy a property"})
        }
         // check if property is not acquired
        const checkPropertyAvailability = await Property.findOne({_id: propertyId});
        if(!checkPropertyAvailability){
            return res.status(404).json({message: "Property not found!"})
        }
        if(checkPropertyAvailability.acquired){
            return res.status(404).json({message: 'Property already acquired'})
        }
        // if not, tenant can acquire after making payment
        const createTenant = await Tenant.create({user: userId, acquiredProperty:propertyId, status: state });
        // update user role to tenant
        const modifyUser = await User.updateOne(
            { _id: userId },
            { $set: { role: 'tenant' } }
        );

        if(!modifyUser){
            return res.status(400).json({message: "Failed to update user role"})
        }
        // update property to acquired
        if(createTenant){
                const z = await Property.updateOne(
                    {_id: propertyId},
                    {$set: { acquired: userId }}
                )
                if(!z){
                    res.status(304).json({message: "Property failed to be modified!"})
                }
        }
        return res.status(201).json({ message: "Tenent Aciquisition successfull" });
    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }

})

router.get('/paymentHistory/:id', jwtMiddleware, async (req, res) => {
    try {
        const payments = await Payment.find({user: req.params.id});
        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: "No payment history found for this user" });
        }

        const data = await Promise.all(
            payments.map(async (payment) => {
                return {
                    plan_code: payment.plan_code,
                    subscription_code: payment.subscription_code,
                    customer_code: payment.customer_code,
                    amount: payment.amount,
                    paid_at: payment.paid_at,
                    method: payment.method,
                    reference: payment.reference,
                    status: payment.status,
                    next_payment_date: payment.next_payment_date,
                    user: await getUser(payment.user),
                };
            })
        );

        res.status(200).json({
            message: "Payment history retrieved successfully",
            data
        });
    } catch (err) {
        console.error('Error fetching payment history:', err);
        return res.status(500).json({ message: "Internal server error", error: err.message });

    }
});


router.get('/payment/:id', jwtMiddleware, async (req, res) => {
    try{
        const payment = await Payment.findOne({user: req.params.id});
        if(!payment){
            return res.status(404).json({ message: "No payment found for this user" });
        }

        const data = {
                plan_code: payment.plan_code,
                subscription_code: payment.subscription_code,
                customer_code: payment.customer_code,
                amount: payment.amount,
                paid_at: payment.paid_at,
                method: payment.method,
                reference: payment.reference,
                status: payment.status,
                next_payment_date: payment.next_payment_date,
                user: await getUser(payment.user)
        }

        res.status(201).json({
            message: "Payment retrieved successfully",
            data
        })

    }catch(err){
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
})


export default router;