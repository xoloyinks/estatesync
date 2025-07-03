import AWS from 'aws-sdk';
import { v4 } from 'uuid'
import multer from 'multer';
import 'dotenv/config';
import Document from '../models/document.js';

const awsS3BucketName =  process.env.AWS_BUCKET_NAME || 'estatesync';
const awsS3Region = process.env.AWS_REGION || 'eu-north-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY || 'AKIA3Z7VAOTHZL6VDQ7E';
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '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';

// console.log("awsS3BucketName:", awsS3Region);

AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsS3Region
});


// S3 service object
const s3 = new AWS.S3();

// Configure multer to use memory storage
export const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage to store file in memory as a Buffer
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

export function uid(){
    return v4().split('-')[0]
}

export async function uploadFileToS3(filename, data){
    filename = `${v4()}-${filename}`;
    const params = {
        Bucket: 'estatesync',
        Key: filename,
        Body: data
    }
    try{
        await s3.upload(params).promise();
        return filename;
    } catch(err){
        console.error("Error uploading file to S3: ", err)
    }
}

export async function uploadImage(userId, filename, data) {
  const cleanedFilename = filename.replace(/\s+/g, '');
  return await uploadFileToS3(`profile-image-${userId}-${cleanedFilename}`, data);
}

const getDocumentFileName = async (_id) => {
  if (!_id) return '';
  
  try {
    const doc = await Document.findById(_id);
    if (!doc) return '';
    return doc.filename; // return only the filename
  } catch (err) {
    console.error('Error fetching document by _id:', err);
    return '';
  }
};

// Returns a public URL (not signed)
export async function getObjectUrl(filename) {
    if (!filename) return '';
    const docfilename = await getDocumentFileName(filename);
    // console.log(`https://${awsS3BucketName}.s3.${awsS3Region}.amazonaws.com/${docfilename}`)
    return `https://${awsS3BucketName}.s3.${awsS3Region}.amazonaws.com/${docfilename}`;
}

// If you want a named wrapper like "getDocumentUrl"
export async function getDocumentUrl(filename) {
    const url = await getObjectUrl(filename);
    return url;
}


// Save a document to the database and return its _id
async function saveDocumentToDBAndGetId(name, data) {
  try {
    const filename = await uploadFile(name, data);
    const savedDocument = await Document.create({ name, filename }); // Used Document model here
    return savedDocument;
  } catch (error) {
    console.error("Error saving document to the database:", error);
    throw error;
  }
}


// getDocumentUrl('17e0c739-b66e-48a7-82be-40228a21f182-profile-image-xoloyinks@gmail.com-20240429_114037.jpg');
