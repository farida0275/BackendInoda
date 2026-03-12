import express from 'express';
import {
  getDataPesertas,
  getMySubmissions,
  getDataPesertaDetail,
  createDataPesertaHandler,
  updateDataPesertaHandler,
  updateSeleksiPesertaHandler,
  deleteDataPesertaHandler,
} from '../Controller/dataPesertaController.js';

import { authenticate } from '../Middleware/auth.js';
import { uploadPdf, uploadPdfFieldsToDrive } from '../Middleware/uploadPdf.js';

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

router.get('/my-submissions', authenticate, getMySubmissions);

router.get('/:id', authenticate, getDataPesertaDetail);

router.post(
  '/',
  authenticate,
  pdfFields,
  uploadPdfFieldsToDrive(),
  createDataPesertaHandler
);

router.put(
  '/:id',
  authenticate,
  pdfFields,
  uploadPdfFieldsToDrive(),
  updateDataPesertaHandler
);

router.put('/:id/seleksi', authenticate, isAdmin, updateSeleksiPesertaHandler);

router.delete('/:id', authenticate, deleteDataPesertaHandler);

export default router;