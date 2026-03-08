import express from 'express';
import {
  getPenilaians,
  getPenilaianSaya,
  getPenilaianDetail,
  createPenilaianHandler,
  createPenilaianAdminHandler,
  updatePenilaianHandler,
  deletePenilaianHandler,
} from '../Controller/penilaianController.js';
import { authenticate } from '../Middleware/auth.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

const isJuri = (req, res, next) => {
  if (req.user?.role !== 'juri') {
    return res.status(403).json({ message: 'Forbidden: Juri access required' });
  }
  next();
};

const isJuriOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'juri' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Juri/Admin access required' });
  }
  next();
};

router.get('/', authenticate, isAdmin, getPenilaians);
router.get('/saya', authenticate, isJuri, getPenilaianSaya);
router.get('/:id', authenticate, isJuriOrAdmin, getPenilaianDetail);

router.post('/', authenticate, isJuri, createPenilaianHandler);
router.post('/admin', authenticate, isAdmin, createPenilaianAdminHandler);

router.put('/:id', authenticate, isJuriOrAdmin, updatePenilaianHandler);
router.delete('/:id', authenticate, isAdmin, deletePenilaianHandler);

export default router;