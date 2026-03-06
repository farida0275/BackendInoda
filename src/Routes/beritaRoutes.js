import express from 'express';
import { getBeritaList, getBeritaDetail, getBeritaByStatus, createNewBerita, updateBeritaData, deleteBeritaData } from '../controller/beritaController.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';

const router = express.Router();

// Middleware untuk check admin role
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

router.get('/', getBeritaList);
router.get('/:id', getBeritaDetail);
router.get('/status/:status', getBeritaByStatus);

router.post('/', authenticate, isAdmin, upload.single('image'), uploadToCloudinary, createNewBerita);
router.put('/:id', authenticate, isAdmin, upload.single('image'), uploadToCloudinary, updateBeritaData);
router.delete('/:id', authenticate, isAdmin, deleteBeritaData);

export default router;
