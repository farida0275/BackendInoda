import express from 'express';
import {
  getPenugasanList,
  getPenugasanSaya,
  createPenugasanHandler,
  createPenugasanByInovasiHandler,
  deletePenugasanHandler,
} from '../Controller/penugasanJuriController.js';

import { authenticate } from '../Middleware/auth.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};

const isJuriOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'juri' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Juri/Admin only' });
  }
  next();
};

router.get('/', authenticate, isAdmin, getPenugasanList);
router.get('/saya', authenticate, isJuriOrAdmin, getPenugasanSaya);

router.post('/', authenticate, isAdmin, createPenugasanHandler);
router.post('/by-inovasi', authenticate, isAdmin, createPenugasanByInovasiHandler);

router.delete('/:id', authenticate, isAdmin, deletePenugasanHandler);

export default router;