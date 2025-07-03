import Document from "../models/document.js";
import { uploadImage } from "../setup/aws_s3.js";


export const UploadDoc = async ({email, filename, buffer}) => {
    const s3Filename = await uploadImage(email, filename, buffer);
      const documentData = {
        name: filename,
        filename: s3Filename,
        email: email,
      };
      
      const savedDocument = await Document.create(documentData);

      if (!savedDocument) {
        return res.status(500).json({ message: "Failed to save document" });
      }

      return savedDocument
}