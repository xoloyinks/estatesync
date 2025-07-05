import { getDocumentUrl } from "../setup/aws_s3.js";

export async function getUser(user) {
    if (!user) return null; // Consistent return type

    try {
        return {
            id: user._id?.toString(), 
            first_name: user.first_name || '', 
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            role: user.role || '',
            gender: user.gender || '',
            image: user.image ? await getDocumentUrl(user.image) : null, 
            createdAt: user.createdAt, 
            updatedAt: user.updatedAt
        };
    } catch (err) {
        console.error('Error in getUser:', err);
        return null; 
    }
}

export async function getProperty(property) {
    if (!property) return null; 

    try {
        return {
            id: property._id?.toString(),
            title: property.title || '',
            description: property.description || '',
            price: property.price || 0,
            location: property.location || '',
            images: Array.isArray(property.images)
                ? await Promise.all(property.images.map(async (image) => await getDocumentUrl(image) || null))
                : [], 
            agent: await getUser(property.agent),
            mode: property.mode || '',
            bedrooms: property.bedrooms || 0,
            createdAt: property.createdAt,
            acquired: property?.acquired || '',
            planCode: property.planCode || ''
        };
    } catch (err) {
        console.error('Error in getProperty:', err);
        return null;
    }
}