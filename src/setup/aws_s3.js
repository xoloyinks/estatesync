// import("aws-sdk/lib/maintenace_mode_message").then((module) => module.suppress = true)
import AWS from 'aws-sdk';
import CONFIG from './config.js';
import { v4 } from 'uuid'
import multer from 'multer';
import 'dotenv/config';

const awsS3BucketName =  process.env.AWS_BUCKET_NAME;
const awsS3Region = process.env.AWS_REGION;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

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

export async function uploadProfileImage(userId, filename, data){
    return await uploadFileToS3(`profile-image-${userId}-${filename}`, data)
}

export function getSignedUrl(filename){
    if(!filename) return '';
    try{
        return s3.getSignedUrl('getObject', {
            Bucket: awsS3BucketName,
            Key: filename,
            Expires: 5 * 60
        })
    }catch(err){
        console.error("Error uploading file to S3: ", err)

    }
}

export function getDocumentUrl({ name, filename }) {
    if (!filename) return { url: '' };
    const url = getSignedUrl(filename);
    if (!url) return { url: '' };
    return { url, name };
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

