import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config({
    path: '../../.env', override: false
})


const jwtSecret = process.env.JWT_SECRET || '';

export const jwtSign = (payload, hour ='12h') => {
    return jwt.sign(payload, jwtSecret, { expiresIn: hour })
}

export const jwtVerify = (token, callback) => {
    if (token) return jwt.verify(token, jwtSecret, callback);
    return {};
}


