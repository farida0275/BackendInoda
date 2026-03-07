import express from 'express';
import {
  getDataPesertas,
  getDataPesertaDetail,
  createDataPesertaHandler,
  updateDataPesertaHandler,
  deleteDataPesertaHandler,
} from '../Controller/dataPesertaController.js';

import { authenticate } from '../Middleware/auth.js';
import { uploadPdf, uploadPdfFieldsToCloudinary } from '../Middleware/uploadPdf.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

const pdfFields = uploadPdf.fields([
  { name: 'anggaran_pdf', maxCount: 1 },
  { name: 'profil_bisnis_pdf', maxCount: 1 },
  { name: 'dokumen_haki_pdf', maxCount: 1 },
  { name: 'penghargaan_pdf', maxCount: 1 },
  { name: 'proposal_pdf', maxCount: 1 },
]);

// List all (semua user autentikasi bisa akses, partisipan lihat kolom terbatas)
router.get('/', authenticate, getDataPesertas);

// Detail (owner/admin check dilakukan di controller)
router.get('/:id', authenticate, getDataPesertaDetail);

// Create (peserta buat data sendiri)
router.post(
  '/',
  authenticate,
  pdfFields,
  uploadPdfFieldsToCloudinary('pdf_peserta'),
  createDataPesertaHandler
);

// Update (owner/admin check dilakukan di controller)
router.put(
  '/:id',
  authenticate,
  pdfFields,
  uploadPdfFieldsToCloudinary('pdf_peserta'),
  updateDataPesertaHandler
);

router.delete('/:id', authenticate, deleteDataPesertaHandler);

export default router;