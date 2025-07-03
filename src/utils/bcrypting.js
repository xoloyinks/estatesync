import bcrypt from 'bcrypt'

 async function hashPassword(password){ 
    try{ 
        // Generate a salt 
        const salt = await bcrypt.genSalt(10); 
        // Hash the password with the salt 
        const hashedPassword = await bcrypt.hash(password, salt); 
        return hashedPassword; 
    }catch (error) { 
        console.error("Error hashing password:", error); 
        throw error; 
    } 
 } 
  
 // Function to compare a password with a hashed password 
 async function comparePasswords(password, hashedPassword) { 
   try { 
     // Compare the password with the hashed password 
     const match = await bcrypt.compare(password, hashedPassword); 
     return match; 
   } catch (error) { 
     console.error("Error comparing passwords:", error); 
     return false; 
   } 
 }

export { hashPassword, comparePasswords };