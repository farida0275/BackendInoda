import {
  getAllDataPeserta,
  getDataPesertaById,
  createDataPeserta,
  updateDataPesertaById,
  deleteDataPesertaById,
} from '../Models/dataPesertaModel.js';

import {
  validateId,
  validateNama,
  validateEnum,
  validateOptionalString,
  validateOptionalDate,
  validateOptionalNumber,
  formatErrorResponse,
} from '../utils/validator.js';

import { deleteCloudinaryRawByPublicId } from '../utils/cloudinaryDelete.js';

const tahapanOptions = ['Inisiatif', 'Uji Coba', 'Penerapan'];
const inisiatorOptions = ['Kepala Daerah', 'Anggota DPRD', 'OPD', 'ASN', 'Masyarakat'];
const jenisOptions = ['Digital', 'Non Digital'];

const PDF_COLS = ['anggaran_pdf', 'profil_bisnis_pdf', 'dokumen_haki_pdf', 'penghargaan_pdf', 'proposal_pdf'];

const isAdmin = (user) => user?.role === 'admin';

const isOwnerOrAdmin = (req, record) => {
  if (!record) return false;
  if (isAdmin(req.user)) return true;
  return Number(record.dibuat_oleh) === Number(req.user?.id);
};

const extractPublicIdFromCloudinaryUrl = (url) => {
  if (!url) return null;

  const afterUpload = url.split('/upload/')[1];
  if (!afterUpload) return null;

  let path = afterUpload.split('?')[0];
  path = path.replace(/^v\d+\//, '');     // buang v123/
  path = path.replace(/\.[^/.]+$/, '');   // buang .pdf

  return path; // contoh: pdf_peserta/proposal_pdf-1712222222
};

// Helper: filter kolom untuk participant (non-admin)
const filterColumnsForParticipant = (record) => {
  const allowedCols = [
    'id',
    'nama_pemda',
    'nama_inovasi',
    'tahapan_inovasi',
    'urusan_utama',
    'urusan_beririsan',
    'waktu_uji_coba',
    'waktu_penerapan',
    'waktu_pengembangan',
    'created_at',
  ];
  const filtered = {};
  allowedCols.forEach((col) => {
    if (col in record) filtered[col] = record[col];
  });
  return filtered;
};

export const getDataPesertas = async (req, res) => {
  try {
    const list = await getAllDataPeserta();
    const isUserAdmin = req.user?.role === 'admin';
    const isUserJuri = req.user?.role === 'juri';
        const filteredList = (isUserAdmin || isUserJuri)
      ? list
      : list.map(filterColumnsForParticipant);
    
    return res.json({
      message: 'Daftar data peserta berhasil diambil',
      count: filteredList.length,
      data: filteredList,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const getDataPesertaDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Detail data peserta gagal: ID tidak valid')
      );
    }

    const record = await getDataPesertaById(id);
    if (!record) {
      return res.status(404).json(
        formatErrorResponse([`Data peserta dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan')
      );
    }

    // ✅ peserta hanya boleh lihat miliknya
    if (!isOwnerOrAdmin(req, record)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses ke data ini'], 'Forbidden')
      );
    }

    return res.json({
      message: 'Detail data peserta berhasil diambil',
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

export const createDataPesertaHandler = async (req, res) => {
  try {
    const uploaded = req.uploadedFiles || {};

    const {
      nama_pemda,
      nama_inovasi,
      tahapan_inovasi,
      inisiator_inovasi,
      nama_inisiator,
      jenis_inovasi,
      bentuk_inovasi,
      tematik,
      urusan_utama,
      urusan_beririsan,
      waktu_uji_coba,
      waktu_penerapan,
      waktu_pengembangan,
      skor_final,
      rancangan_bangun,
      tujuan_inovasi,
      manfaat_diperoleh,
      hasil_inovasi,
    } = req.body;

    const errors = [];
    errors.push(...validateNama(nama_pemda));
    errors.push(...validateNama(nama_inovasi));
    errors.push(...validateEnum(tahapan_inovasi, 'tahapan_inovasi', tahapanOptions));
    errors.push(...validateEnum(inisiator_inovasi, 'inisiator_inovasi', inisiatorOptions));
    errors.push(...validateNama(nama_inisiator));
    errors.push(...validateEnum(jenis_inovasi, 'jenis_inovasi', jenisOptions));

    errors.push(...validateOptionalString(bentuk_inovasi, 'bentuk_inovasi', 150));
    errors.push(...validateOptionalString(tematik, 'tematik', 150));
    errors.push(...validateOptionalString(urusan_utama, 'urusan_utama', 150));
    errors.push(...validateOptionalString(urusan_beririsan, 'urusan_beririsan', 255));

    errors.push(...validateOptionalDate(waktu_uji_coba, 'waktu_uji_coba'));
    errors.push(...validateOptionalDate(waktu_penerapan, 'waktu_penerapan'));
    errors.push(...validateOptionalDate(waktu_pengembangan, 'waktu_pengembangan'));

    errors.push(...validateOptionalNumber(skor_final, 'skor_final', { min: 0, max: 100 }));

    errors.push(...validateOptionalString(rancangan_bangun, 'rancangan_bangun', 10000));
    errors.push(...validateOptionalString(tujuan_inovasi, 'tujuan_inovasi', 10000));
    errors.push(...validateOptionalString(manfaat_diperoleh, 'manfaat_diperoleh', 10000));
    errors.push(...validateOptionalString(hasil_inovasi, 'hasil_inovasi', 10000));

    if (errors.length > 0) {
      return res.status(400).json(formatErrorResponse(errors, 'Validasi data peserta gagal'));
    }

    const payload = {
      nama_pemda,
      nama_inovasi,
      tahapan_inovasi,
      inisiator_inovasi,
      nama_inisiator,
      jenis_inovasi,
      bentuk_inovasi,
      tematik,
      urusan_utama,
      urusan_beririsan,
      waktu_uji_coba,
      waktu_penerapan,
      waktu_pengembangan,
      skor_final,
      rancangan_bangun,
      tujuan_inovasi,
      manfaat_diperoleh,
      hasil_inovasi,

      // URL dari cloudinary
      anggaran_pdf: uploaded.anggaran_pdf?.url || null,
      profil_bisnis_pdf: uploaded.profil_bisnis_pdf?.url || null,
      dokumen_haki_pdf: uploaded.dokumen_haki_pdf?.url || null,
      penghargaan_pdf: uploaded.penghargaan_pdf?.url || null,
      proposal_pdf: uploaded.proposal_pdf?.url || null,

      dibuat_oleh: req.user?.id || null,
    };

    const record = await createDataPeserta(payload);

    return res.status(201).json({
      message: 'Data peserta berhasil dibuat',
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

export const updateDataPesertaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const uploaded = req.uploadedFiles || {};

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Update gagal: ID tidak valid'));
    }

    const existing = await getDataPesertaById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse([`Data peserta dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan')
      );
    }

    // ✅ peserta hanya boleh update miliknya
    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses mengubah data ini'], 'Forbidden')
      );
    }

    const {
      nama_pemda,
      nama_inovasi,
      tahapan_inovasi,
      inisiator_inovasi,
      nama_inisiator,
      jenis_inovasi,
      bentuk_inovasi,
      tematik,
      urusan_utama,
      urusan_beririsan,
      waktu_uji_coba,
      waktu_penerapan,
      waktu_pengembangan,
      skor_final,
      rancangan_bangun,
      tujuan_inovasi,
      manfaat_diperoleh,
      hasil_inovasi,
    } = req.body;

    const errors = [];

    if (nama_pemda !== undefined) errors.push(...validateNama(nama_pemda));
    if (nama_inovasi !== undefined) errors.push(...validateNama(nama_inovasi));
    if (tahapan_inovasi !== undefined) errors.push(...validateEnum(tahapan_inovasi, 'tahapan_inovasi', tahapanOptions));
    if (inisiator_inovasi !== undefined) errors.push(...validateEnum(inisiator_inovasi, 'inisiator_inovasi', inisiatorOptions));
    if (nama_inisiator !== undefined) errors.push(...validateNama(nama_inisiator));
    if (jenis_inovasi !== undefined) errors.push(...validateEnum(jenis_inovasi, 'jenis_inovasi', jenisOptions));

    if (bentuk_inovasi !== undefined) errors.push(...validateOptionalString(bentuk_inovasi, 'bentuk_inovasi', 150));
    if (tematik !== undefined) errors.push(...validateOptionalString(tematik, 'tematik', 150));
    if (urusan_utama !== undefined) errors.push(...validateOptionalString(urusan_utama, 'urusan_utama', 150));
    if (urusan_beririsan !== undefined) errors.push(...validateOptionalString(urusan_beririsan, 'urusan_beririsan', 255));

    if (waktu_uji_coba !== undefined) errors.push(...validateOptionalDate(waktu_uji_coba, 'waktu_uji_coba'));
    if (waktu_penerapan !== undefined) errors.push(...validateOptionalDate(waktu_penerapan, 'waktu_penerapan'));
    if (waktu_pengembangan !== undefined) errors.push(...validateOptionalDate(waktu_pengembangan, 'waktu_pengembangan'));

    if (skor_final !== undefined) errors.push(...validateOptionalNumber(skor_final, 'skor_final', { min: 0, max: 100 }));

    if (rancangan_bangun !== undefined) errors.push(...validateOptionalString(rancangan_bangun, 'rancangan_bangun', 10000));
    if (tujuan_inovasi !== undefined) errors.push(...validateOptionalString(tujuan_inovasi, 'tujuan_inovasi', 10000));
    if (manfaat_diperoleh !== undefined) errors.push(...validateOptionalString(manfaat_diperoleh, 'manfaat_diperoleh', 10000));
    if (hasil_inovasi !== undefined) errors.push(...validateOptionalString(hasil_inovasi, 'hasil_inovasi', 10000));

    if (errors.length > 0) {
      return res.status(400).json(formatErrorResponse(errors, 'Validasi data peserta gagal'));
    }

    const payload = {};
    const assignIfDefined = (key, value) => {
      if (value !== undefined) payload[key] = value;
    };

    assignIfDefined('nama_pemda', nama_pemda);
    assignIfDefined('nama_inovasi', nama_inovasi);
    assignIfDefined('tahapan_inovasi', tahapan_inovasi);
    assignIfDefined('inisiator_inovasi', inisiator_inovasi);
    assignIfDefined('nama_inisiator', nama_inisiator);
    assignIfDefined('jenis_inovasi', jenis_inovasi);
    assignIfDefined('bentuk_inovasi', bentuk_inovasi);
    assignIfDefined('tematik', tematik);
    assignIfDefined('urusan_utama', urusan_utama);
    assignIfDefined('urusan_beririsan', urusan_beririsan);
    assignIfDefined('waktu_uji_coba', waktu_uji_coba);
    assignIfDefined('waktu_penerapan', waktu_penerapan);
    assignIfDefined('waktu_pengembangan', waktu_pengembangan);
    assignIfDefined('skor_final', skor_final);
    assignIfDefined('rancangan_bangun', rancangan_bangun);
    assignIfDefined('tujuan_inovasi', tujuan_inovasi);
    assignIfDefined('manfaat_diperoleh', manfaat_diperoleh);
    assignIfDefined('hasil_inovasi', hasil_inovasi);

    // ✅ auto delete file lama + set url baru
    for (const col of PDF_COLS) {
      if (uploaded[col]?.url) {
        const oldUrl = existing[col];
        const oldPublicId = extractPublicIdFromCloudinaryUrl(oldUrl);

        if (oldPublicId) {
          try {
            await deleteCloudinaryRawByPublicId(oldPublicId);
          } catch (e) {
            console.error(`Gagal hapus file lama (${col}) public_id=${oldPublicId}:`, e?.message || e);
          }
        }

        payload[col] = uploaded[col].url;
      }
    }

    const updated = await updateDataPesertaById(id, payload);

    return res.json({
      message: 'Data peserta berhasil diperbarui',
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
    );
  }
};

export const deleteDataPesertaHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Hapus gagal: ID tidak valid'));
    }

    const existing = await getDataPesertaById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse([`Data peserta dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan')
      );
    }

    // ✅ peserta hanya boleh delete miliknya
    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses menghapus data ini'], 'Forbidden')
      );
    }

    // hapus pdf di cloudinary
    for (const col of PDF_COLS) {
      const oldUrl = existing[col];
      const oldPublicId = extractPublicIdFromCloudinaryUrl(oldUrl);

      if (oldPublicId) {
        try {
          await deleteCloudinaryRawByPublicId(oldPublicId);
        } catch (e) {
          console.error(`Gagal hapus file (${col}) public_id=${oldPublicId}:`, e?.message || e);
        }
      }
    }

    const result = await deleteDataPesertaById(id);

    return res.json({
      message: 'Data peserta berhasil dihapus',
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
  getDataPesertas,
  getDataPesertaDetail,
  createDataPesertaHandler,
  updateDataPesertaHandler,
  deleteDataPesertaHandler,
};