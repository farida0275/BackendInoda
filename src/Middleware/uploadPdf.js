import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import path from 'path';

const storage = multer.memoryStorage();

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = file.mimetype;

  if (mime === 'application/pdf' && ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diperbolehkan'), false);
  }
};

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,
  },
});

// helper upload buffer -> cloudinary
const streamUpload = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });

const sanitizeFileName = (name = '') => {
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

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

        const originalBaseName = sanitizeFileName(file.originalname || fieldName);
        const safeBaseName = originalBaseName || sanitizeFileName(fieldName) || 'file';
        const safeName = `${safeBaseName}-${Date.now()}.pdf`;

        const result = await streamUpload(file.buffer, {
          resource_type: 'raw',
          folder,
          public_id: safeName,
          overwrite: false,
          use_filename: false,
          unique_filename: false,
          filename_override: file.originalname,
        });

        uploaded[fieldName] = {
          url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          originalname: file.originalname,
          resource_type: result.resource_type,
          format: result.format || 'pdf',
        };
      }

      req.uploadedFiles = uploaded;
      return next();
    } catch (err) {
      console.error('uploadPdfFieldsToCloudinary error:', err);
      return res.status(500).json({
        message: 'Upload PDF gagal',
        errors: [err.message || 'Terjadi kesalahan saat upload PDF'],
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export default uploadPdf;