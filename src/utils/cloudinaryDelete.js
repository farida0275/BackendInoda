import cloudinary from '../config/cloudinary.js';

export const deleteCloudinaryRawByPublicId = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
};