import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const storage = multer.memoryStorage();

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Hanya file PDF yang diperbolehkan'), false);
};

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // opsional: maksimal total file per request (sesuaikan dengan jumlah field pdf kamu)
  },
});

// helper upload buffer -> cloudinary
const streamUpload = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

export const uploadPdfFieldsToCloudinary = (folder = 'pdf_peserta') => {
  return async (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        req.uploadedFiles = {};
        return next();
      }

      const uploaded = {};

      for (const [fieldName, fileArr] of Object.entries(req.files)) {
        const file = fileArr?.[0];
        if (!file?.buffer) continue;

        // bikin nama aman (tanpa spasi/karakter aneh) + unik
        const safeName = `${fieldName}-${Date.now()}`.replace(/\s+/g, '-');

        const result = await streamUpload(file.buffer, {
          resource_type: 'raw', // PDF = raw
          folder,
          public_id: safeName,
          overwrite: false, // biar tidak ketimpa tanpa sengaja
        });

        uploaded[fieldName] = {
          url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          originalname: file.originalname,
        };
      }

      req.uploadedFiles = uploaded;
      return next();
    } catch (err) {
      console.error('uploadPdfFieldsToCloudinary error:', err);
      return next(err);
    }
  };
};

export default uploadPdf;