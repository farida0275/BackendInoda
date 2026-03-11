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
  resetAllPenilaian,
  resetPenilaianByJuriId,
  resetPenilaianByPesertaId,
  resetPenilaianMilikJuri,
  resetSatuPenilaianMilikJuri,
} from '../Models/penilaianModel.js';

import {
  validateId,
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

const hitungSkor = (body) => {
  const proposalItems = [
    Number(body.proposal_tampilan || 0),
    Number(body.proposal_kelengkapan || 0),
    Number(body.proposal_keterkaitan || 0),
    Number(body.proposal_tujuan || 0),
    Number(body.proposal_deskripsi || 0),
  ];

  const videoItems = [
    Number(body.video_latar_belakang || 0),
    Number(body.video_penjaringan_ide || 0),
    Number(body.video_pemilihan_ide || 0),
    Number(body.video_manfaat || 0),
    Number(body.video_dampak || 0),
  ];

  const totalProposal = proposalItems.reduce((sum, item) => sum + item, 0);
  const totalVideo = videoItems.reduce((sum, item) => sum + item, 0);

  const rataProposal = totalProposal / 5;
  const rataVideo = totalVideo / 5;

  const totalSubstansi =
    Number(body.substansi_kesiapterapan || 0) +
    Number(body.substansi_kebaharuan || 0) +
    Number(body.substansi_komersialisasi || 0) +
    Number(body.substansi_usp || 0) +
    Number(body.substansi_kemanfaatan || 0) +
    Number(body.substansi_kedalaman || 0);

  const skorProposal = Number(((rataProposal / 100) * 20).toFixed(2));
  const skorVideo = Number(((rataVideo / 100) * 20).toFixed(2));
  const skorSubstansi = Number(((totalSubstansi / 120) * 60).toFixed(2));
  const skorAkhir = Number(
    (skorProposal + skorVideo + skorSubstansi).toFixed(2)
  );

  return {
    skor_proposal: skorProposal,
    skor_video: skorVideo,
    skor_substansi: skorSubstansi,
    skor_akhir: skorAkhir,
  };
};

const validatePenilaianPayload = (body, { withSlot = false } = {}) => {
  const errors = [];

  errors.push(...validateRequiredNumber(body.peserta_id, 'peserta_id', { min: 1 }));
  errors.push(...validateRequiredNumber(body.inovasi_id, 'inovasi_id', { min: 1 }));

  if (withSlot) {
    errors.push(
      ...validateRequiredNumber(body.slot_penilai, 'slot_penilai', {
        min: 1,
        max: 3,
      })
    );
  }

  errors.push(...validateRequiredNumber(body.proposal_tampilan, 'proposal_tampilan', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.proposal_kelengkapan, 'proposal_kelengkapan', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.proposal_keterkaitan, 'proposal_keterkaitan', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.proposal_tujuan, 'proposal_tujuan', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.proposal_deskripsi, 'proposal_deskripsi', { min: 0, max: 100 }));

  errors.push(...validateRequiredNumber(body.video_latar_belakang, 'video_latar_belakang', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.video_penjaringan_ide, 'video_penjaringan_ide', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.video_pemilihan_ide, 'video_pemilihan_ide', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.video_manfaat, 'video_manfaat', { min: 0, max: 100 }));
  errors.push(...validateRequiredNumber(body.video_dampak, 'video_dampak', { min: 0, max: 100 }));

  errors.push(...validateRequiredNumber(body.substansi_kesiapterapan, 'substansi_kesiapterapan', { min: 0, max: 20 }));
  errors.push(...validateRequiredNumber(body.substansi_kebaharuan, 'substansi_kebaharuan', { min: 0, max: 10 }));
  errors.push(...validateRequiredNumber(body.substansi_komersialisasi, 'substansi_komersialisasi', { min: 0, max: 20 }));
  errors.push(...validateRequiredNumber(body.substansi_usp, 'substansi_usp', { min: 0, max: 20 }));
  errors.push(...validateRequiredNumber(body.substansi_kemanfaatan, 'substansi_kemanfaatan', { min: 0, max: 35 }));
  errors.push(...validateRequiredNumber(body.substansi_kedalaman, 'substansi_kedalaman', { min: 0, max: 15 }));

  errors.push(...validateOptionalString(body.catatan, 'catatan', 10000));

  return errors;
};

const buildPayload = (body, juriId) => {
  const skor = hitungSkor(body);

  return {
    peserta_id: Number(body.peserta_id),
    inovasi_id: Number(body.inovasi_id),
    ...(juriId ? { juri_id: Number(juriId) } : {}),

    proposal_tampilan: Number(body.proposal_tampilan),
    proposal_kelengkapan: Number(body.proposal_kelengkapan),
    proposal_keterkaitan: Number(body.proposal_keterkaitan),
    proposal_tujuan: Number(body.proposal_tujuan),
    proposal_deskripsi: Number(body.proposal_deskripsi),

    video_latar_belakang: Number(body.video_latar_belakang),
    video_penjaringan_ide: Number(body.video_penjaringan_ide),
    video_pemilihan_ide: Number(body.video_pemilihan_ide),
    video_manfaat: Number(body.video_manfaat),
    video_dampak: Number(body.video_dampak),

    substansi_kesiapterapan: Number(body.substansi_kesiapterapan),
    substansi_kebaharuan: Number(body.substansi_kebaharuan),
    substansi_komersialisasi: Number(body.substansi_komersialisasi),
    substansi_usp: Number(body.substansi_usp),
    substansi_kemanfaatan: Number(body.substansi_kemanfaatan),
    substansi_kedalaman: Number(body.substansi_kedalaman),

    skor_proposal: skor.skor_proposal,
    skor_video: skor.skor_video,
    skor_substansi: skor.skor_substansi,
    skor_akhir: skor.skor_akhir,

    catatan: body.catatan ?? null,
  };
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

    const errors = validatePenilaianPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian gagal')
      );
    }

    const { peserta_id, inovasi_id } = req.body;

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

    const payload = buildPayload(req.body, req.user.id);

    let record;
    let message;

    if (existing) {
      record = await updatePenilaianById(existing.id, payload);
      message = 'Penilaian juri berhasil diperbarui';
    } else {
      record = await createPenilaian(payload);
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

    const errors = validatePenilaianPayload(req.body, { withSlot: true });
    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian admin gagal')
      );
    }

    const { peserta_id, inovasi_id, slot_penilai } = req.body;

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

    const payload = buildPayload(req.body, penugasan.juri_id);

    let record;
    let message;

    if (existing) {
      record = await updatePenilaianById(existing.id, payload);
      message = 'Penilaian slot berhasil diperbarui oleh admin';
    } else {
      record = await createPenilaian(payload);
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

    const mergedBody = {
      ...existing,
      ...req.body,
      peserta_id: existing.peserta_id,
      inovasi_id: existing.inovasi_id,
    };

    const errors = validatePenilaianPayload(mergedBody);
    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi penilaian gagal')
      );
    }

    const payload = buildPayload(mergedBody, existing.juri_id);
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

/* =========================
   TAMBAHAN RESET ADMIN
========================= */

export const resetSemuaPenilaianHandler = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya admin yang dapat mereset semua penilaian'],
          'Forbidden'
        )
      );
    }

    const deletedRows = await resetAllPenilaian();

    return res.json({
      message: 'Semua penilaian berhasil direset',
      data: {
        deletedCount: deletedRows.length,
        deletedIds: deletedRows.map((item) => item.id),
      },
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

export const resetPenilaianByJuriHandler = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya admin yang dapat mereset penilaian berdasarkan juri'],
          'Forbidden'
        )
      );
    }

    const { juriId } = req.params;
    const idErrors = validateId(juriId);

    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Reset gagal: juri_id tidak valid')
      );
    }

    const deletedRows = await resetPenilaianByJuriId(Number(juriId));

    return res.json({
      message: `Penilaian milik juri ID ${juriId} berhasil direset`,
      data: {
        juri_id: Number(juriId),
        deletedCount: deletedRows.length,
        deletedIds: deletedRows.map((item) => item.id),
      },
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

export const resetPenilaianByPesertaHandler = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya admin yang dapat mereset penilaian berdasarkan peserta'],
          'Forbidden'
        )
      );
    }

    const { pesertaId } = req.params;
    const idErrors = validateId(pesertaId);

    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Reset gagal: peserta_id tidak valid')
      );
    }

    const deletedRows = await resetPenilaianByPesertaId(Number(pesertaId));

    return res.json({
      message: `Penilaian peserta ID ${pesertaId} berhasil direset`,
      data: {
        peserta_id: Number(pesertaId),
        deletedCount: deletedRows.length,
        deletedIds: deletedRows.map((item) => item.id),
      },
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

/* =========================
   TAMBAHAN RESET JURI
========================= */

export const resetPenilaianSayaHandler = async (req, res) => {
  try {
    if (!isJuri(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya juri yang dapat mereset penilaian miliknya'],
          'Forbidden'
        )
      );
    }

    const deletedRows = await resetPenilaianMilikJuri(Number(req.user.id));

    return res.json({
      message: 'Semua penilaian milik juri berhasil direset',
      data: {
        juri_id: Number(req.user.id),
        deletedCount: deletedRows.length,
        deletedIds: deletedRows.map((item) => item.id),
      },
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

export const resetSatuPenilaianSayaHandler = async (req, res) => {
  try {
    if (!isJuri(req.user)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Hanya juri yang dapat mereset penilaian miliknya'],
          'Forbidden'
        )
      );
    }

    const { id } = req.params;
    const idErrors = validateId(id);

    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Reset gagal: ID tidak valid')
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

    if (Number(existing.juri_id) !== Number(req.user.id)) {
      return res.status(403).json(
        formatErrorResponse(
          ['Kamu hanya dapat mereset penilaian milikmu sendiri'],
          'Forbidden'
        )
      );
    }

    const deleted = await resetSatuPenilaianMilikJuri(
      Number(id),
      Number(req.user.id)
    );

    return res.json({
      message: 'Penilaian milik juri berhasil direset',
      data: {
        deletedId: deleted?.id || Number(id),
      },
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

  resetSemuaPenilaianHandler,
  resetPenilaianByJuriHandler,
  resetPenilaianByPesertaHandler,
  resetPenilaianSayaHandler,
  resetSatuPenilaianSayaHandler,
};