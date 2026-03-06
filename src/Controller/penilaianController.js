import {
  getAllPenilaian,
  getPenilaianById,
  createPenilaian,
  updatePenilaianById,
  deletePenilaianById,
} from '../Models/penilaianModel.js';

import {
  validateId,
  validateOptionalNumber,
  validateOptionalString,
  formatErrorResponse,
} from '../utils/validator.js';

const isAdmin = (user) => user?.role === 'admin';

const isOwnerOrAdmin = (req, record) => {
  if (!record) return false;
  if (isAdmin(req.user)) return true;
  return Number(record.juri_id) === Number(req.user?.id);
};

export const getPenilaians = async (req, res) => {
  try {
    const list = await getAllPenilaian();
    return res.json({
      message: 'Daftar penilaian berhasil diambil',
      count: list.length,
      data: list,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const getPenilaianDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res
        .status(400)
        .json(formatErrorResponse(idErrors, 'Detail penilaian gagal: ID tidak valid'));
    }

    const record = await getPenilaianById(id);
    if (!record) {
      return res
        .status(404)
        .json(formatErrorResponse([`Penilaian dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan'));
    }

    if (!isOwnerOrAdmin(req, record)) {
      return res
        .status(403)
        .json(formatErrorResponse(['Kamu tidak punya akses ke data ini'], 'Forbidden'));
    }

    return res.json({
      message: 'Detail penilaian berhasil diambil',
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const createPenilaianHandler = async (req, res) => {
  try {
    const {
      peserta_id,
      inovasi_id,
      skor,
      catatan,
    } = req.body;

    const errors = [];

    errors.push(...validateOptionalNumber(peserta_id, 'peserta_id', { min: 1 }));
    errors.push(...validateOptionalNumber(inovasi_id, 'inovasi_id', { min: 1 }));

    if (skor === undefined || skor === null || skor === '') {
      errors.push('skor harus diisi');
    } else {
      errors.push(...validateOptionalNumber(skor, 'skor', { min: 0, max: 100 }));
    }

    errors.push(...validateOptionalString(catatan, 'catatan', 10000));

    if (errors.length > 0) {
      return res.status(400).json(formatErrorResponse(errors, 'Validasi penilaian gagal'));
    }

    // ✅ juri_id ambil dari login, bukan dari body
    const payload = {
      peserta_id,
      juri_id: req.user.id,
      inovasi_id,
      skor,
      catatan,
    };

    const record = await createPenilaian(payload);

    return res.status(201).json({
      message: 'Penilaian berhasil dibuat',
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json(
        formatErrorResponse(
          ['Penilaian untuk kombinasi peserta, juri, dan inovasi ini sudah ada'],
          'Data duplikat'
        )
      );
    }

    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const updatePenilaianHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Update gagal: ID tidak valid'));
    }

    const existing = await getPenilaianById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse([`Penilaian dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan')
      );
    }

    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses mengubah data ini'], 'Forbidden')
      );
    }

    const { peserta_id, inovasi_id, skor, catatan } = req.body;

    const errors = [];
    if (peserta_id !== undefined) errors.push(...validateOptionalNumber(peserta_id, 'peserta_id', { min: 1 }));
    if (inovasi_id !== undefined) errors.push(...validateOptionalNumber(inovasi_id, 'inovasi_id', { min: 1 }));
    if (skor !== undefined) errors.push(...validateOptionalNumber(skor, 'skor', { min: 0, max: 100 }));
    if (catatan !== undefined) errors.push(...validateOptionalString(catatan, 'catatan', 10000));

    if (errors.length > 0) {
      return res.status(400).json(formatErrorResponse(errors, 'Validasi penilaian gagal'));
    }

    // ✅ jangan izinkan ganti juri_id dari body
    const payload = {};
    if (peserta_id !== undefined) payload.peserta_id = peserta_id;
    if (inovasi_id !== undefined) payload.inovasi_id = inovasi_id;
    if (skor !== undefined) payload.skor = skor;
    if (catatan !== undefined) payload.catatan = catatan;

    const updated = await updatePenilaianById(id, payload);

    return res.json({
      message: 'Penilaian berhasil diperbarui',
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json(
        formatErrorResponse(
          ['Penilaian untuk kombinasi peserta, juri, dan inovasi ini sudah ada'],
          'Data duplikat'
        )
      );
    }

    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const deletePenilaianHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const idErrors = validateId(id);

    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Hapus gagal: ID tidak valid'));
    }

    const result = await deletePenilaianById(id);
    if (!result) {
      return res
        .status(404)
        .json(formatErrorResponse([`Penilaian dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan'));
    }

    return res.json({
      message: 'Penilaian berhasil dihapus',
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
  getPenilaians,
  getPenilaianDetail,
  createPenilaianHandler,
  updatePenilaianHandler,
  deletePenilaianHandler,
};