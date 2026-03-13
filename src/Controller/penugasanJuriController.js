import {
  getAllPenugasan,
  getPenugasanByJuri,
  createPenugasan,
  createPenugasanByInovasi,
  deletePenugasanById,
  getEligiblePesertaById,
} from '../Models/penugasanJuriModel.js';

const formatErrorResponse = (errors, message = 'Validasi gagal') => ({
  message,
  errors: Array.isArray(errors) ? errors : [errors],
  timestamp: new Date().toISOString(),
});

const validateRequiredNumber = (value, fieldName, { min = 1, max } = {}) => {
  const errors = [];

  if (value === undefined || value === null || value === '') {
    errors.push(`${fieldName} harus diisi`);
    return errors;
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    errors.push(`${fieldName} harus berupa angka`);
    return errors;
  }

  if (!Number.isInteger(num)) {
    errors.push(`${fieldName} harus berupa angka bulat`);
  }

  if (min !== undefined && num < min) {
    errors.push(`${fieldName} minimal ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`${fieldName} maksimal ${max}`);
  }

  return errors;
};

export const getPenugasanList = async (req, res) => {
  try {
    const data = await getAllPenugasan();

    return res.json({
      message: 'Daftar penugasan juri berhasil diambil',
      count: data.length,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const getPenugasanSaya = async (req, res) => {
  try {
    const juriId = req.user.id;
    const data = await getPenugasanByJuri(juriId);

    return res.json({
      message: 'Penugasan juri berhasil diambil',
      count: data.length,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const createPenugasanHandler = async (req, res) => {
  try {
    const { peserta_id, inovasi_id, juri_id, slot_penilai } = req.body;

    const errors = [];
    errors.push(...validateRequiredNumber(peserta_id, 'peserta_id'));
    errors.push(...validateRequiredNumber(inovasi_id, 'inovasi_id'));
    errors.push(...validateRequiredNumber(juri_id, 'juri_id'));
    errors.push(
      ...validateRequiredNumber(slot_penilai, 'slot_penilai', { min: 1, max: 3 })
    );

    if (errors.length > 0) {
      return res
        .status(400)
        .json(formatErrorResponse(errors, 'Validasi penugasan juri gagal'));
    }

    const pesertaEligible = await getEligiblePesertaById(Number(peserta_id));

    if (!pesertaEligible) {
      return res.status(400).json(
        formatErrorResponse(
          [
            'Peserta tidak memenuhi syarat untuk penugasan juri. Pastikan peserta sudah masuk tahap semifinal dan status seleksi masih Diproses.',
          ],
          'Validasi penugasan juri gagal'
        )
      );
    }

    if (Number(pesertaEligible.kategori) !== Number(inovasi_id)) {
      return res.status(400).json(
        formatErrorResponse(
          ['inovasi_id tidak sesuai dengan kategori peserta'],
          'Validasi penugasan juri gagal'
        )
      );
    }

    const payload = {
      peserta_id: Number(peserta_id),
      inovasi_id: Number(inovasi_id),
      juri_id: Number(juri_id),
      slot_penilai: Number(slot_penilai),
    };

    const result = await createPenugasan(payload);

    return res.status(201).json({
      message: 'Penugasan juri berhasil dibuat',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json(
        formatErrorResponse(
          ['Slot penilai untuk peserta dan inovasi ini sudah terpakai'],
          'Data duplikat'
        )
      );
    }

    if (err.code === '23514') {
      return res.status(400).json(
        formatErrorResponse(
          ['slot_penilai hanya boleh 1 sampai 3'],
          'Validasi penugasan juri gagal'
        )
      );
    }

    return res.status(500).json(
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const createPenugasanByInovasiHandler = async (req, res) => {
  try {
    const { juri_id, slot_penilai, inovasi_id } = req.body;

    const errors = [];
    errors.push(...validateRequiredNumber(juri_id, 'juri_id'));
    errors.push(
      ...validateRequiredNumber(slot_penilai, 'slot_penilai', { min: 1, max: 3 })
    );
    errors.push(...validateRequiredNumber(inovasi_id, 'inovasi_id'));

    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(
          errors,
          'Validasi penugasan juri berdasarkan inovasi gagal'
        )
      );
    }

    const payload = {
      juri_id: Number(juri_id),
      slot_penilai: Number(slot_penilai),
      inovasi_id: Number(inovasi_id),
    };

    const results = await createPenugasanByInovasi(payload);

    return res.status(201).json({
      message: 'Penugasan juri berdasarkan inovasi berhasil dibuat',
      count: results.length,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    if (err.message === 'INOVASI_NOT_FOUND') {
      return res.status(404).json(
        formatErrorResponse(
          ['Inovasi tidak ditemukan'],
          'Data tidak ditemukan'
        )
      );
    }

    if (err.message === 'PESERTA_BY_INOVASI_NOT_FOUND') {
      return res.status(404).json(
        formatErrorResponse(
          [
            'Tidak ada peserta yang cocok dengan inovasi ini dan memenuhi syarat penilaian juri',
          ],
          'Data tidak ditemukan'
        )
      );
    }

    if (err.code === '23505') {
      return res.status(409).json(
        formatErrorResponse(
          ['Ada slot penilai yang sudah terpakai untuk peserta pada inovasi ini'],
          'Data duplikat'
        )
      );
    }

    if (err.code === '23514') {
      return res.status(400).json(
        formatErrorResponse(
          ['slot_penilai hanya boleh 1 sampai 3'],
          'Validasi penugasan juri berdasarkan inovasi gagal'
        )
      );
    }

    return res.status(500).json(
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const deletePenugasanHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const errors = validateRequiredNumber(id, 'id');
    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(
          errors,
          'Hapus penugasan juri gagal: ID tidak valid'
        )
      );
    }

    const result = await deletePenugasanById(Number(id));

    if (!result) {
      return res.status(404).json(
        formatErrorResponse(
          [`Penugasan juri dengan ID ${id} tidak ditemukan`],
          'Data tidak ditemukan'
        )
      );
    }

    return res.json({
      message: 'Penugasan juri berhasil dihapus',
      data: { deletedId: result.id },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export default {
  getPenugasanList,
  getPenugasanSaya,
  createPenugasanHandler,
  createPenugasanByInovasiHandler,
  deletePenugasanHandler,
};