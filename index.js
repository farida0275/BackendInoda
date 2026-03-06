import express from 'express';
import authRoutes from './src/Routes/authRoutes.js';
import usersRoutes from './src/Routes/usersRoutes.js';
import beritaRoutes from './src/Routes/beritaRoutes.js';
import inovasiRoutes from './src/Routes/inovasiRoutes.js';
import dataPesertaRoutes from './src/Routes/dataPesertaRoutes.js';
import penilaianRoutes from './src/Routes/penilaianRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/berita', beritaRoutes);
app.use('/api/inovasi', inovasiRoutes);
app.use('/api/data-peserta', dataPesertaRoutes);
app.use('/api/penilaian', penilaianRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
