import pool from '../config/db.js';

export const getAllPenugasan = async () => {
  const q = `
    SELECT
      pj.*,
      u.nama AS nama_juri,
      u.email AS email_juri
    FROM penugasan_juri pj
    JOIN users u ON pj.juri_id = u.id
    ORDER BY pj.id DESC
  `;
  const { rows } = await pool.query(q);
  return rows;
};

export const getPenugasanByJuri = async (juriId) => {
  const q = `
    SELECT
      pj.*,
      dp.nama_inovasi,
      dp.kategori,
      dp.nama_inisiator,
      dp.inisiator_inovasi,
      dp.jenis_inovasi,
      dp.bentuk_inovasi,
      dp.tematik,
      dp.urusan_utama,
      dp.urusan_beririsan,
      dp.tahapan_inovasi,
      dp.waktu_uji_coba,
      dp.waktu_penerapan,
      dp.waktu_pengembangan,
      dp.rancangan_bangun,
      dp.tujuan_inovasi,
      dp.manfaat_diperoleh,
      dp.hasil_inovasi,
      dp.anggaran_pdf,
      dp.profil_bisnis_pdf,
      dp.dokumen_haki_pdf,
      dp.penghargaan_pdf,
      dp.proposal_pdf,
      inv.name AS nama_kategori_inovasi
    FROM penugasan_juri pj
    JOIN data_peserta dp ON pj.peserta_id = dp.id
    JOIN inovasi inv ON pj.inovasi_id = inv.id
    WHERE pj.juri_id = $1
    ORDER BY pj.id DESC
  `;
  const { rows } = await pool.query(q, [juriId]);
  return rows;
};

export const createPenugasan = async ({
  peserta_id,
  inovasi_id,
  juri_id,
  slot_penilai,
}) => {
  const q = `
    INSERT INTO penugasan_juri
    (peserta_id, inovasi_id, juri_id, slot_penilai)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const { rows } = await pool.query(q, [
    peserta_id,
    inovasi_id,
    juri_id,
    slot_penilai,
  ]);

  return rows[0];
};

export const createPenugasanByInovasi = async ({
  juri_id,
  slot_penilai,
  inovasi_id,
}) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Pastikan inovasi ada
    const inovasiQuery = `
      SELECT id, name
      FROM inovasi
      WHERE id = $1
    `;
    const { rows: inovasiRows } = await client.query(inovasiQuery, [inovasi_id]);

    if (inovasiRows.length === 0) {
      throw new Error('INOVASI_NOT_FOUND');
    }

    // 2. Cari semua peserta yang kategori-nya sama dengan inovasi_id
    //    karena data_peserta.kategori menyimpan ID inovasi
    const pesertaQuery = `
      SELECT id, nama_inovasi, kategori
      FROM data_peserta
      WHERE kategori = $1
      ORDER BY id ASC
    `;
    const { rows: pesertaRows } = await client.query(pesertaQuery, [inovasi_id]);

    if (pesertaRows.length === 0) {
      throw new Error('PESERTA_BY_INOVASI_NOT_FOUND');
    }

    const inserted = [];

    // 3. Insert penugasan untuk semua peserta dalam inovasi tersebut
    for (const peserta of pesertaRows) {
      const insertQuery = `
        INSERT INTO penugasan_juri
        (peserta_id, inovasi_id, juri_id, slot_penilai)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const { rows } = await client.query(insertQuery, [
        peserta.id,
        inovasi_id,
        juri_id,
        slot_penilai,
      ]);

      inserted.push(rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deletePenugasanById = async (id) => {
  const q = `
    DELETE FROM penugasan_juri
    WHERE id = $1
    RETURNING id
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export default {
  getAllPenugasan,
  getPenugasanByJuri,
  createPenugasan,
  createPenugasanByInovasi,
  deletePenugasanById,
};