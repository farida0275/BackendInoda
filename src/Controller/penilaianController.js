import {
  getAllPenilaian,
  getPenilaianById,
  getPenilaianByJuriId,
  createPenilaian,
  updatePenilaianById,
  deletePenilaianById,
  findPenugasanForJuri,
  findPenugasanBySlot,
  findPenilaianByUnique,
} from '../Models/penilaianModel.js';

import {
  validateId,
  validateOptionalNumber,
  validateOptionalString,
  formatErrorResponse,
} from '../utils/validator.js';

const isAdmin = (user) => user?.role === 'admin';
const isJuri = (user) => user?.role === 'juri';

const isOwnerOrAdmin = (req, record) => {
  if (!record) return false;
  if (isAdmin(req.user)) return true;
  return Number(record.juri_id) === Number(req.user?.id);
};

const validateRequiredNumber = (value, fieldName, { min, max } = {}) => {
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
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const getPenilaianSaya = async (req, res) => {
  try {
    if (!isJuri(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya juri yang dapat mengakses penilaian miliknya'],
          'Forbidden'
        )
      );
    }

    const list = await getPenilaianByJuriId(req.user.id);

    return res.json({
      message: 'Daftar penilaian saya berhasil diambil',
      count: list.length,
      data: list,
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

export const getPenilaianDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Detail penilaian gagal: ID tidak valid')
      );
    }

    const record = await getPenilaianById(id);
    if (!record) {
      return res.status(404).json(
        formatErrorResponse(
          [`Penilaian dengan ID ${id} tidak ditemukan`],
          'Data tidak ditemukan'
        )
      );
    }

    if (!isOwnerOrAdmin(req, record)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses ke data ini'], 'Forbidden')
      );
    }

    return res.json({
      message: 'Detail penilaian berhasil diambil',
      data: record,
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

export const createPenilaianHandler = async (req, res) => {
  try {
    if (!isJuri(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya juri yang dapat menggunakan endpoint ini'],
          'Forbidden'
        )
      );
    }

    const { peserta_id, inovasi_id, skor, catatan } = req.body;

    const errors = [];
    errors.push(...validateRequiredNumber(peserta_id, 'peserta_id', { min: 1 }));
    errors.push(...validateRequiredNumber(inovasi_id, 'inovasi_id', { min: 1 }));
    errors.push(...validateRequiredNumber(skor, 'skor', { min: 0, max: 100 }));
    errors.push(...validateOptionalString(catatan, 'catatan', 10000));

    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian gagal')
      );
    }

    const penugasan = await findPenugasanForJuri({
      peserta_id: Number(peserta_id),
      inovasi_id: Number(inovasi_id),
      juri_id: Number(req.user.id),
    });

    if (!penugasan) {
      return res.status(403).json(
        formatErrorResponse(
          ['Kamu tidak memiliki penugasan untuk peserta dan inovasi ini'],
          'Forbidden'
        )
      );
    }

    const existing = await findPenilaianByUnique({
      peserta_id: Number(peserta_id),
      inovasi_id: Number(inovasi_id),
      juri_id: Number(req.user.id),
    });

    let record;
    let message;

    if (existing) {
      record = await updatePenilaianById(existing.id, {
        skor: Number(skor),
        catatan: catatan ?? null,
      });
      message = 'Penilaian juri berhasil diperbarui';
    } else {
      record = await createPenilaian({
        peserta_id: Number(peserta_id),
        juri_id: Number(req.user.id),
        inovasi_id: Number(inovasi_id),
        skor: Number(skor),
        catatan: catatan ?? null,
      });
      message = 'Penilaian juri berhasil dibuat';
    }

    const detail = await getPenilaianById(record.id);

    return res.status(existing ? 200 : 201).json({
      message,
      data: detail,
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
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const createPenilaianAdminHandler = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya admin yang dapat menggunakan endpoint ini'],
          'Forbidden'
        )
      );
    }

    const { peserta_id, inovasi_id, slot_penilai, skor, catatan } = req.body;

    const errors = [];
    errors.push(...validateRequiredNumber(peserta_id, 'peserta_id', { min: 1 }));
    errors.push(...validateRequiredNumber(inovasi_id, 'inovasi_id', { min: 1 }));
    errors.push(...validateRequiredNumber(slot_penilai, 'slot_penilai', { min: 1, max: 3 }));
    errors.push(...validateRequiredNumber(skor, 'skor', { min: 0, max: 100 }));
    errors.push(...validateOptionalString(catatan, 'catatan', 10000));

    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian admin gagal')
      );
    }

    const penugasan = await findPenugasanBySlot({
      peserta_id: Number(peserta_id),
      inovasi_id: Number(inovasi_id),
      slot_penilai: Number(slot_penilai),
    });

    if (!penugasan) {
      return res.status(404).json(
        formatErrorResponse(
          ['Penugasan untuk slot tersebut tidak ditemukan'],
          'Data tidak ditemukan'
        )
      );
    }

    const existing = await findPenilaianByUnique({
      peserta_id: Number(peserta_id),
      inovasi_id: Number(inovasi_id),
      juri_id: Number(penugasan.juri_id),
    });

    let record;
    let message;

    if (existing) {
      record = await updatePenilaianById(existing.id, {
        skor: Number(skor),
        catatan: catatan ?? null,
      });
      message = 'Penilaian slot berhasil diperbarui oleh admin';
    } else {
      record = await createPenilaian({
        peserta_id: Number(peserta_id),
        juri_id: Number(penugasan.juri_id),
        inovasi_id: Number(inovasi_id),
        skor: Number(skor),
        catatan: catatan ?? null,
      });
      message = 'Penilaian slot berhasil dibuat oleh admin';
    }

    const detail = await getPenilaianById(record.id);

    return res.status(existing ? 200 : 201).json({
      message,
      data: detail,
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
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const updatePenilaianHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Update gagal: ID tidak valid')
      );
    }

    const existing = await getPenilaianById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse(
          [`Penilaian dengan ID ${id} tidak ditemukan`],
          'Data tidak ditemukan'
        )
      );
    }

    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses mengubah data ini'], 'Forbidden')
      );
    }

    const { skor, catatan } = req.body;

    const errors = [];
    if (skor !== undefined) {
      errors.push(...validateOptionalNumber(skor, 'skor', { min: 0, max: 100 }));
    }
    if (catatan !== undefined) {
      errors.push(...validateOptionalString(catatan, 'catatan', 10000));
    }

    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian gagal')
      );
    }

    const payload = {};
    if (skor !== undefined) payload.skor = Number(skor);
    if (catatan !== undefined) payload.catatan = catatan;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json(
        formatErrorResponse(['Tidak ada data yang diubah'], 'Tidak ada perubahan data')
      );
    }

    const updated = await updatePenilaianById(id, payload);
    const detail = await getPenilaianById(updated.id);

    return res.json({
      message: 'Penilaian berhasil diperbarui',
      data: detail,
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
      formatErrorResponse(
        ['Terjadi kesalahan pada server, silakan coba lagi'],
        'Server error'
      )
    );
  }
};

export const deletePenilaianHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const idErrors = validateId(id);

    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Hapus gagal: ID tidak valid')
      );
    }

    const existing = await getPenilaianById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse(
          [`Penilaian dengan ID ${id} tidak ditemukan`],
          'Data tidak ditemukan'
        )
      );
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(['Hanya admin yang dapat menghapus penilaian'], 'Forbidden')
      );
    }

    const result = await deletePenilaianById(id);

    return res.json({
      message: 'Penilaian berhasil dihapus',
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
  getPenilaians,
  getPenilaianSaya,
  getPenilaianDetail,
  createPenilaianHandler,
  createPenilaianAdminHandler,
  updatePenilaianHandler,
  deletePenilaianHandler,
};