import { getAllBerita, getBeritaById, createBerita, updateBerita, deleteBerita } from '../Models/beritaModel.js';
import {
  validateTitle,
  validateContent,
  validateStatus,
  validateId,
  combineErrors,
  formatErrorResponse,
} from '../utils/validator.js';
import pool from '../config/db.js';

export const getBeritaList = async (req, res) => {
  try {
    const berita = await getAllBerita();
    return res.json({
      message: 'Daftar berita berhasil diambil',
      count: berita.length,
      data: berita,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const getBeritaDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Detail berita gagal: ID tidak valid'));
    }

    const berita = await getBeritaById(id);
    if (!berita) {
      return res.status(404).json(
        formatErrorResponse([`Berita dengan ID ${id} tidak ditemukan di sistem`], 'Berita tidak ditemukan')
      );
    }
    return res.json({
      message: 'Detail berita berhasil diambil',
      data: berita,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const getBeritaByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const statusErrors = validateStatus(status);
    if (statusErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(statusErrors, 'Berita status gagal: Status tidak valid'));
    }

    const q = `SELECT id, judul, konten, image_url, author, status, created_at FROM berita WHERE status=$1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(q, [status]);

    if (rows.length === 0) {
      return res.status(404).json(
        formatErrorResponse([`Tidak ada berita dengan status '${status}'`], 'Berita tidak ditemukan')
      );
    }

    return res.json({
      message: `Berita dengan status '${status}' berhasil diambil`,
      count: rows.length,
      data: rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const createNewBerita = async (req, res) => {
  try {
    const { judul, konten, author, status } = req.body;

    const judulErrors = validateTitle(judul);
    const kontenErrors = validateContent(konten);
    const statusErrors = validateStatus(status);

    const allErrors = combineErrors(judulErrors, kontenErrors, statusErrors);

    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Buat berita gagal: Data tidak valid'));
    }

    const image_url = req.fileUrl || null;
    const berita = await createBerita({ judul, konten, image_url, author, status });
    return res.status(201).json({
      message: 'Berita berhasil dibuat',
      data: berita,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const updateBeritaData = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, konten, author, status } = req.body;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Update berita gagal: ID tidak valid'));
    }

    const judulErrors = validateTitle(judul);
    const kontenErrors = validateContent(konten);
    const statusErrors = validateStatus(status);

    const allErrors = combineErrors(judulErrors, kontenErrors, statusErrors);

    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Update berita gagal: Data tidak valid'));
    }

    const image_url = req.fileUrl || undefined;
    const berita = await updateBerita(id, { judul, konten, image_url, author, status });
    if (!berita) {
      return res.status(404).json(
        formatErrorResponse([`Berita dengan ID ${id} tidak ditemukan di sistem`], 'Berita tidak ditemukan')
      );
    }
    return res.json({
      message: 'Berita berhasil diperbarui',
      data: berita,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const deleteBeritaData = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Hapus berita gagal: ID tidak valid'));
    }

    const result = await deleteBerita(id);
    if (!result) {
      return res.status(404).json(
        formatErrorResponse([`Berita dengan ID ${id} tidak ditemukan di sistem`], 'Berita tidak ditemukan')
      );
    }
    return res.json({
      message: 'Berita berhasil dihapus',
      data: { deletedId: result.id },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export default { getBeritaList, getBeritaDetail, getBeritaByStatus, createNewBerita, updateBeritaData, deleteBeritaData };
