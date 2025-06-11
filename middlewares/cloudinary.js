const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// const uploadToCloudinary = async (localPath) => {
//   try {
//     const result = await cloudinary.uploader.upload(localPath, {
//       folder: 'avatars',
//     });
//     fs.unlinkSync(localPath); // cleanup
//     return result;
//   } catch (error) {
//     throw new Error('Upload to Cloudinary failed');
//   }
// };

const uploadToCloudinary = async (localPath) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'avatars',
    });
    fs.unlinkSync(localPath);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Upload to Cloudinary failed: ' + (error.message || error));
  }
};
module.exports = { upload, uploadToCloudinary };
