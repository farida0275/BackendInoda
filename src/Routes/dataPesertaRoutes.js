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

router.get('/', authenticate, getDataPesertas);

router.get('/:id', authenticate, getDataPesertaDetail);

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