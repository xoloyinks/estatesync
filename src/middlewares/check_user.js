import { jwtVerify } from "../utils/jwt.js";

export default function jwtMiddleware(req, res, next) {
  const bearer = req.header("Authorization");
  
    if (!bearer) {
        return res.status(401).json({ message: "Authorization header is missing" });
    }
    const token = bearer.split(" ")[1];

    jwtVerify(token, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        req.user = decoded; 
        next(); 
    })
  
}