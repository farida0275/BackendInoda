import express from 'express';
import { register, login, getProfile, updateProfile } from '../Controller/authController.js';
import { authenticate } from '../Middleware/auth.js';
import { upload, uploadToCloudinary } from '../Middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('avatar'), uploadToCloudinary, updateProfile);

export default router;
