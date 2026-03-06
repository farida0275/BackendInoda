import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from '../src/Routes/authRoutes.js';
import usersRoutes from '../src/Routes/usersRoutes.js';
import beritaRoutes from '../src/Routes/beritaRoutes.js';
import dataPesertaRoutes from '../src/Routes/dataPesertaRoutes.js';
import inovasiRoutes from '../src/Routes/inovasiRoutes.js';
import penilaianRoutes from '../src/Routes/penilaianRoutes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/berita', beritaRoutes);
app.use('/api/data-peserta', dataPesertaRoutes);
app.use('/api/inovasi', inovasiRoutes);
app.use('/api/penilaian', penilaianRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serverless API ready' });
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

export default function handler(req, res) {
  return app(req, res);
}
