import multer from "multer";
import path from "path";
import { uploadBufferToDrive } from "../utils/googleDrive.js";

const storage = multer.memoryStorage();

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = file.mimetype;

  if (mime === "application/pdf" && ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Hanya file PDF yang diperbolehkan"), false);
  }
};

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

const sanitizeFileName = (name = "") => {
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const uploadPdfFieldsToDrive = () => {
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
        const safeBaseName = originalBaseName || sanitizeFileName(fieldName) || "file";
        const safeName = `${safeBaseName}-${Date.now()}.pdf`;

        const result = await uploadBufferToDrive(file, safeName);

        uploaded[fieldName] = {
          url: result.url,
          file_id: result.fileId,
          bytes: Number(result.size || 0),
          originalname: file.originalname,
          resource_type: "drive",
          format: "pdf",
        };
      }

      req.uploadedFiles = uploaded;
      return next();
    } catch (err) {
      console.error("uploadPdfFieldsToDrive error:", err);
      return res.status(500).json({
        message: "Upload PDF ke Google Drive gagal",
        errors: [err.message || "Terjadi kesalahan saat upload PDF"],
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export default uploadPdf;