import express from 'express';
import {
  getInovasiList,
  getInovasiDetail,
  createNewInovasi,
  updateInovasiData,
  deleteInovasiData,
} from '../Controller/inovasiController.js';
import { authenticate } from '../Middleware/auth.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Admin access required' });
  next();
};

router.get('/', getInovasiList);
router.get('/:id', getInovasiDetail);
router.post('/', authenticate, isAdmin, createNewInovasi);
router.put('/:id', authenticate, isAdmin, updateInovasiData);
router.delete('/:id', authenticate, isAdmin, deleteInovasiData);

export default router;
