import {
  getAllBerita,
  getBeritaById,
  createBerita,
  updateBerita,
  deleteBerita,
} from '../Models/beritaModel.js';
import {
  validateTitle,
  validateContent,
  validateStatus,
  validateId,
  validateAuthorName,
  validateSourceName,
  validateSourceUrl,
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

    const q = `
      SELECT 
        id,
        judul,
        konten,
        image_url,
        author,
        status,
        source_name,
        source_url,
        created_at
      FROM berita
      WHERE status = $1
      ORDER BY created_at DESC
    `;
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
    const { judul, konten, author, status, source_name, source_url } = req.body;

    const judulErrors = validateTitle(judul);
    const kontenErrors = validateContent(konten);
    const authorErrors = validateAuthorName(author);
    const statusErrors = validateStatus(status);
    const sourceNameErrors = validateSourceName(source_name);
    const sourceUrlErrors = validateSourceUrl(source_url);

    const relationErrors = [];
    const trimmedSourceName = typeof source_name === 'string' ? source_name.trim() : '';
    const trimmedSourceUrl = typeof source_url === 'string' ? source_url.trim() : '';

    const hasSourceName = trimmedSourceName !== '';
    const hasSourceUrl = trimmedSourceUrl !== '';

    if ((hasSourceName && !hasSourceUrl) || (!hasSourceName && hasSourceUrl)) {
      relationErrors.push('Nama sumber dan link sumber harus diisi bersamaan');
    }

    const allErrors = combineErrors(
      judulErrors,
      kontenErrors,
      authorErrors,
      statusErrors,
      sourceNameErrors,
      sourceUrlErrors,
      relationErrors
    );

    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Buat berita gagal: Data tidak valid'));
    }

    const image_url = req.fileUrl || null;

    const berita = await createBerita({
      judul: judul.trim(),
      konten: konten.trim(),
      image_url,
      author: author.trim(),
      status: status.trim().toLowerCase(),
      source_name: hasSourceName ? trimmedSourceName : null,
      source_url: hasSourceUrl ? trimmedSourceUrl : null,
    });

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
    const { judul, konten, author, status, source_name, source_url } = req.body;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Update berita gagal: ID tidak valid'));
    }

    const judulErrors = judul !== undefined ? validateTitle(judul) : [];
    const kontenErrors = konten !== undefined ? validateContent(konten) : [];
    const authorErrors = author !== undefined ? validateAuthorName(author) : [];
    const statusErrors = status !== undefined ? validateStatus(status) : [];
    const sourceNameErrors = source_name !== undefined ? validateSourceName(source_name) : [];
    const sourceUrlErrors = source_url !== undefined ? validateSourceUrl(source_url) : [];

    const relationErrors = [];
    const trimmedSourceName = typeof source_name === 'string' ? source_name.trim() : source_name;
    const trimmedSourceUrl = typeof source_url === 'string' ? source_url.trim() : source_url;

    if (source_name !== undefined || source_url !== undefined) {
      const hasSourceName =
        typeof trimmedSourceName === 'string' && trimmedSourceName !== '';
      const hasSourceUrl =
        typeof trimmedSourceUrl === 'string' && trimmedSourceUrl !== '';

      if ((hasSourceName && !hasSourceUrl) || (!hasSourceName && hasSourceUrl)) {
        relationErrors.push('Nama sumber dan link sumber harus diisi bersamaan');
      }
    }

    const allErrors = combineErrors(
      judulErrors,
      kontenErrors,
      authorErrors,
      statusErrors,
      sourceNameErrors,
      sourceUrlErrors,
      relationErrors
    );

    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Update berita gagal: Data tidak valid'));
    }

    const image_url = req.fileUrl || undefined;

    const berita = await updateBerita(id, {
      judul: typeof judul === 'string' ? judul.trim() : undefined,
      konten: typeof konten === 'string' ? konten.trim() : undefined,
      image_url,
      author: typeof author === 'string' ? author.trim() : undefined,
      status: typeof status === 'string' ? status.trim().toLowerCase() : undefined,
      source_name: typeof trimmedSourceName === 'string' ? trimmedSourceName : undefined,
      source_url: typeof trimmedSourceUrl === 'string' ? trimmedSourceUrl : undefined,
    });

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

export default {
  getBeritaList,
  getBeritaDetail,
  getBeritaByStatus,
  createNewBerita,
  updateBeritaData,
  deleteBeritaData,
};