import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
import axios from 'axios';
import path from 'path';
import { ApiError } from './ApiError.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:true
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
      if (!localFilePath) return null;

      const fileName = path.basename(localFilePath,path.extname(localFilePath))
      const response = await cloudinary.uploader.upload(localFilePath, {
          public_id: fileName, 
          overwrite: true,
          resource_type: "auto",
      });

       fs.unlinkSync(localFilePath);
      return response;
  } catch (error) {
      fs.unlinkSync(localFilePath)
      return null;
  }
}

const downloadFromCloudinary = async (cloudinaryUrl, downloadDir = 'C:/Downloads') => {
  try {
    
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const urlObj = new URL(cloudinaryUrl);
    const fileNameWithFormat = path.basename(urlObj.pathname);
    const [fileName, fileFormat] = fileNameWithFormat.split('.');
    const downloadPath = path.join(downloadDir, `${fileName}.${fileFormat}`);

    const response = await axios({
      url: cloudinaryUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(downloadPath);
      });
      writer.on('error', (err) => {
        console.error('Error writing file:', err);
        reject(err);
      });
    });
  } catch (error) {
    throw new ApiError(500,'Error downloading file:', error);
  }
};

export { uploadOnCloudinary , downloadFromCloudinary}