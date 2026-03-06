import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadToCloudinary = async (req, res, next) => {
	if (!req.file || !req.file.buffer) return next();

	try {
		const streamUpload = (buffer) => {
			return new Promise((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream((error, result) => {
					if (result) resolve(result);
					else reject(error);
				});
				streamifier.createReadStream(buffer).pipe(stream);
			});
		};

		const result = await streamUpload(req.file.buffer);
		req.fileUrl = result.secure_url;
		next();
	} catch (err) {
		next(err);
	}
};

export default upload;

