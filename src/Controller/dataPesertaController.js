import {
  getAllDataPeserta,
  getDataPesertaById,
  getDataPesertaByCreator,
  createDataPeserta,
  updateDataPesertaById,
  updateSeleksiPesertaById,
  deleteDataPesertaById,
  resetAllDataPeserta,
} from '../Models/dataPesertaModel.js';

import { getAllInovasi } from '../Models/inovasiModel.js';

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

const getKategoriOptions = async () => {
  const inovasi = await getAllInovasi();
  return inovasi.map((i) => String(i.id));
};

const tahapSeleksiOptions = ['all', 'administratif', 'semifinal', 'final'];

const regularStatusSeleksiOptions = ['Diproses', 'Lolos', 'Tidak Lolos'];

const finalStatusSeleksiOptions = [
  'Diproses',
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Harapan 1',
  'Harapan 2',
  'Harapan 3',
  'Finalis',
];

const PDF_COLS = ['anggaran_pdf', 'profil_bisnis_pdf', 'dokumen_haki_pdf', 'penghargaan_pdf', 'proposal_pdf'];

const isAdmin = (user) => user?.role === 'admin';
const isJuri = (user) => user?.role === 'juri';

const isOwnerOrAdmin = (req, record) => {
  if (!record) return false;
  if (isAdmin(req.user)) return true;
  return Number(record.dibuat_oleh) === Number(req.user?.id);
};

const canViewDetail = (req, record) => {
  if (!record) return false;
  if (isAdmin(req.user)) return true;
  if (isJuri(req.user)) return true;
  return Number(record.dibuat_oleh) === Number(req.user?.id);
};

const extractPublicIdFromCloudinaryUrl = (url) => {
  if (!url) return null;

  const afterUpload = url.split('/upload/')[1];
  if (!afterUpload) return null;

  let path = afterUpload.split('?')[0];
  path = path.replace(/^v\d+\//, '');
  path = path.replace(/\.[^/.]+$/, '');

  return path;
};

// untuk dashboard participant: semua data, tapi kolom dibatasi
const filterColumnsForParticipant = (record) => {
  const allowedCols = [
    'id',
    'nama_inovasi',
    'kategori',
    'tahapan_inovasi',
    'urusan_utama',
    'urusan_beririsan',
    'waktu_uji_coba',
    'waktu_penerapan',
    'waktu_pengembangan',
    'link_video',
    'created_at',
    'tahap_seleksi',
    'status_seleksi',
  ];

  const filtered = {};
  allowedCols.forEach((col) => {
    if (col in record) filtered[col] = record[col];
  });

  return filtered;
};

// ENDPOINT DASHBOARD
// admin/juri: semua data lengkap
// participant: semua data, tapi hanya beberapa kolom
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

// ENDPOINT KHUSUS SUBMISI SAYA
// hanya data milik user login
export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(
        formatErrorResponse(['User tidak terautentikasi'], 'Unauthorized')
      );
    }

    const list = await getDataPesertaByCreator(userId);

    return res.json({
      message: 'Daftar submission saya berhasil diambil',
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

    if (!canViewDetail(req, record)) {
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

    const errors = [];
    if (!uploaded.proposal_pdf) {
      errors.push('File proposal_pdf wajib diupload');
    }
    if (!uploaded.profil_bisnis_pdf) {
      errors.push('File profil_bisnis_pdf (ppt) wajib diupload');
    }

    const {
      nama_inovasi,
      kategori,
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
      link_video,
    } = req.body;

    const kategoriValue = String(kategori ?? '');

    const kategoriOptions = await getKategoriOptions();
    errors.push(...validateNama(nama_inovasi));
    errors.push(...validateEnum(kategoriValue, 'kategori', kategoriOptions));
    errors.push(...validateEnum(tahapan_inovasi, 'tahapan_inovasi', tahapanOptions));
    errors.push(...validateEnum(inisiator_inovasi, 'inisiator_inovasi', inisiatorOptions));
    errors.push(...validateNama(nama_inisiator));
    errors.push(...validateEnum(jenis_inovasi, 'jenis_inovasi', jenisOptions));

    errors.push(...validateOptionalString(bentuk_inovasi, 'bentuk_inovasi'));
    errors.push(...validateOptionalString(tematik, 'tematik'));
    errors.push(...validateOptionalString(urusan_utama, 'urusan_utama'));
    errors.push(...validateOptionalString(urusan_beririsan, 'urusan_beririsan', 255));
    errors.push(...validateOptionalString(link_video, 'link_video', 1000));

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
      nama_inovasi,
      kategori: kategoriValue ? Number(kategoriValue) : null,
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
      link_video: link_video || null,

      anggaran_pdf: uploaded.anggaran_pdf?.url || null,
      profil_bisnis_pdf: uploaded.profil_bisnis_pdf?.url || null,
      dokumen_haki_pdf: uploaded.dokumen_haki_pdf?.url || null,
      penghargaan_pdf: uploaded.penghargaan_pdf?.url || null,
      proposal_pdf: uploaded.proposal_pdf?.url || null,

      dibuat_oleh: req.user?.id || null,
      tahap_seleksi: 'all',
      status_seleksi: 'Diproses',
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

    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses mengubah data ini'], 'Forbidden')
      );
    }

    const {
      nama_inovasi,
      kategori,
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
      link_video,
    } = req.body;

    const normalizeEmptyToNull = (value) => {
      if (value === '') return null;
      return value;
    };

    const kategoriValue =
      kategori !== undefined && kategori !== null && kategori !== ''
        ? Number(kategori)
        : undefined;

    const normalizedWaktuUjiCoba = normalizeEmptyToNull(waktu_uji_coba);
    const normalizedWaktuPenerapan = normalizeEmptyToNull(waktu_penerapan);
    const normalizedWaktuPengembangan = normalizeEmptyToNull(waktu_pengembangan);
    const normalizedLinkVideo = normalizeEmptyToNull(link_video);

    const errors = [];
    const kategoriOptions = await getKategoriOptions();

    if (nama_inovasi !== undefined) {
      errors.push(...validateNama(nama_inovasi));
    }

    if (kategori !== undefined) {
      errors.push(...validateEnum(String(kategori), 'kategori', kategoriOptions));
    }

    if (tahapan_inovasi !== undefined) {
      errors.push(...validateEnum(tahapan_inovasi, 'tahapan_inovasi', tahapanOptions));
    }

    if (inisiator_inovasi !== undefined) {
      errors.push(...validateEnum(inisiator_inovasi, 'inisiator_inovasi', inisiatorOptions));
    }

    if (nama_inisiator !== undefined) {
      errors.push(...validateNama(nama_inisiator));
    }

    if (jenis_inovasi !== undefined) {
      errors.push(...validateEnum(jenis_inovasi, 'jenis_inovasi', jenisOptions));
    }

    if (bentuk_inovasi !== undefined) {
      errors.push(...validateOptionalString(bentuk_inovasi, 'bentuk_inovasi'));
    }

    if (tematik !== undefined) {
      errors.push(...validateOptionalString(tematik, 'tematik'));
    }

    if (urusan_utama !== undefined) {
      errors.push(...validateOptionalString(urusan_utama, 'urusan_utama'));
    }

    if (urusan_beririsan !== undefined) {
      errors.push(...validateOptionalString(urusan_beririsan, 'urusan_beririsan', 255));
    }

    if (link_video !== undefined) {
      errors.push(...validateOptionalString(normalizedLinkVideo, 'link_video', 1000));
    }

    if (waktu_uji_coba !== undefined) {
      errors.push(...validateOptionalDate(normalizedWaktuUjiCoba, 'waktu_uji_coba'));
    }

    if (waktu_penerapan !== undefined) {
      errors.push(...validateOptionalDate(normalizedWaktuPenerapan, 'waktu_penerapan'));
    }

    if (waktu_pengembangan !== undefined) {
      errors.push(...validateOptionalDate(normalizedWaktuPengembangan, 'waktu_pengembangan'));
    }

    if (skor_final !== undefined) {
      errors.push(...validateOptionalNumber(skor_final, 'skor_final', { min: 0, max: 100 }));
    }

    if (rancangan_bangun !== undefined) {
      errors.push(...validateOptionalString(rancangan_bangun, 'rancangan_bangun', 10000));
    }

    if (tujuan_inovasi !== undefined) {
      errors.push(...validateOptionalString(tujuan_inovasi, 'tujuan_inovasi', 10000));
    }

    if (manfaat_diperoleh !== undefined) {
      errors.push(...validateOptionalString(manfaat_diperoleh, 'manfaat_diperoleh', 10000));
    }

    if (hasil_inovasi !== undefined) {
      errors.push(...validateOptionalString(hasil_inovasi, 'hasil_inovasi', 10000));
    }

    if (errors.length > 0) {
      return res.status(400).json(formatErrorResponse(errors, 'Validasi data peserta gagal'));
    }

    const payload = {};
    const assignIfDefined = (key, value) => {
      if (value !== undefined) payload[key] = value;
    };

    assignIfDefined('nama_inovasi', nama_inovasi);
    assignIfDefined('kategori', kategoriValue);
    assignIfDefined('tahapan_inovasi', tahapan_inovasi);
    assignIfDefined('inisiator_inovasi', inisiator_inovasi);
    assignIfDefined('nama_inisiator', nama_inisiator);
    assignIfDefined('jenis_inovasi', jenis_inovasi);
    assignIfDefined('bentuk_inovasi', bentuk_inovasi);
    assignIfDefined('tematik', tematik);
    assignIfDefined('urusan_utama', urusan_utama);
    assignIfDefined('urusan_beririsan', urusan_beririsan);
    assignIfDefined('link_video', normalizedLinkVideo);
    assignIfDefined('waktu_uji_coba', normalizedWaktuUjiCoba);
    assignIfDefined('waktu_penerapan', normalizedWaktuPenerapan);
    assignIfDefined('waktu_pengembangan', normalizedWaktuPengembangan);
    assignIfDefined('skor_final', skor_final);
    assignIfDefined('rancangan_bangun', rancangan_bangun);
    assignIfDefined('tujuan_inovasi', tujuan_inovasi);
    assignIfDefined('manfaat_diperoleh', manfaat_diperoleh);
    assignIfDefined('hasil_inovasi', hasil_inovasi);

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

export const updateSeleksiPesertaHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahap_seleksi, status_seleksi } = req.body;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(idErrors, 'Update seleksi gagal: ID tidak valid')
      );
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(['Hanya admin yang dapat mengubah seleksi peserta'], 'Forbidden')
      );
    }

    const existing = await getDataPesertaById(id);
    if (!existing) {
      return res.status(404).json(
        formatErrorResponse([`Data peserta dengan ID ${id} tidak ditemukan`], 'Data tidak ditemukan')
      );
    }

    const errors = [];

    errors.push(...validateEnum(tahap_seleksi, 'tahap_seleksi', tahapSeleksiOptions));

    if (tahap_seleksi === 'final') {
      errors.push(...validateEnum(status_seleksi, 'status_seleksi', finalStatusSeleksiOptions));
    } else {
      errors.push(...validateEnum(status_seleksi, 'status_seleksi', regularStatusSeleksiOptions));
    }

    // validasi tambahan agar status juara/harapan tidak dipakai di tahap selain final
    if (tahap_seleksi !== 'final' && finalStatusSeleksiOptions.includes(status_seleksi) && status_seleksi !== 'Diproses') {
      errors.push('Status juara/finalis hanya boleh digunakan pada tahap final');
    }

    // validasi tambahan agar tahap final tidak pakai status Lolos / Tidak Lolos
    if (tahap_seleksi === 'final' && ['Lolos', 'Tidak Lolos'].includes(status_seleksi)) {
      errors.push('Pada tahap final gunakan status Juara, Harapan, atau Finalis');
    }

    if (errors.length > 0) {
      return res.status(400).json(
        formatErrorResponse(errors, 'Validasi seleksi peserta gagal')
      );
    }

    const updated = await updateSeleksiPesertaById(id, {
      tahap_seleksi,
      status_seleksi,
    });

    return res.json({
      message: 'Seleksi peserta berhasil diperbarui',
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

    if (!isOwnerOrAdmin(req, existing)) {
      return res.status(403).json(
        formatErrorResponse(['Kamu tidak punya akses menghapus data ini'], 'Forbidden')
      );
    }

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

export const resetAllDataPesertaHandler = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json(
        formatErrorResponse(['Hanya admin yang dapat mereset semua data peserta'], 'Forbidden')
      );
    }

    const allData = await getAllDataPeserta();

    for (const record of allData) {
      for (const col of PDF_COLS) {
        const oldUrl = record[col];
        const oldPublicId = extractPublicIdFromCloudinaryUrl(oldUrl);

        if (oldPublicId) {
          try {
            await deleteCloudinaryRawByPublicId(oldPublicId);
          } catch (e) {
            console.error(
              `Gagal hapus file reset all (${col}) public_id=${oldPublicId}:`,
              e?.message || e
            );
          }
        }
      }
    }

    await resetAllDataPeserta();

    return res.json({
      message: 'Semua data peserta berhasil direset',
      data: {
        total_deleted: allData.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      formatErrorResponse(['Terjadi kesalahan saat reset semua data peserta'], 'Server error')
    );
  }
};

export default {
  getDataPesertas,
  getMySubmissions,
  getDataPesertaDetail,
  createDataPesertaHandler,
  updateDataPesertaHandler,
  updateSeleksiPesertaHandler,
  deleteDataPesertaHandler,
  resetAllDataPesertaHandler,
};