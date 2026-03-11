import pool from '../config/db.js';

export const getAllPenilaian = async () => {
  const q = `
    SELECT
      pj.*,
      u.nama AS nama_juri,
      dp.nama_inovasi,
      dp.nama_inisiator,
      dp.urusan_utama,
      dp.tahapan_inovasi,
      dp.kategori AS kategori_id,
      pju.slot_penilai
    FROM penilaian_juri pj
    LEFT JOIN users u
      ON pj.juri_id = u.id
    LEFT JOIN data_peserta dp
      ON pj.peserta_id = dp.id
    LEFT JOIN penugasan_juri pju
      ON pju.peserta_id = pj.peserta_id
      AND pju.inovasi_id = pj.inovasi_id
      AND pju.juri_id = pj.juri_id
    ORDER BY pj.id DESC
  `;

  const { rows } = await pool.query(q);
  return rows;
};

export const getPenilaianByJuriId = async (juriId) => {
  const q = `
    SELECT
      pj.*,
      u.nama AS nama_juri,
      dp.nama_inovasi,
      dp.nama_inisiator,
      dp.urusan_utama,
      dp.tahapan_inovasi,
      dp.kategori AS kategori_id,
      pju.slot_penilai
    FROM penilaian_juri pj
    LEFT JOIN users u
      ON pj.juri_id = u.id
    LEFT JOIN data_peserta dp
      ON pj.peserta_id = dp.id
    LEFT JOIN penugasan_juri pju
      ON pju.peserta_id = pj.peserta_id
      AND pju.inovasi_id = pj.inovasi_id
      AND pju.juri_id = pj.juri_id
    WHERE pj.juri_id = $1
    ORDER BY pj.id DESC
  `;

  const { rows } = await pool.query(q, [juriId]);
  return rows;
};

export const getPenilaianById = async (id) => {
  const q = `
    SELECT
      pj.*,
      u.nama AS nama_juri,
      dp.nama_inovasi,
      dp.nama_inisiator,
      dp.urusan_utama,
      dp.tahapan_inovasi,
      dp.kategori AS kategori_id,
      pju.slot_penilai
    FROM penilaian_juri pj
    LEFT JOIN users u
      ON pj.juri_id = u.id
    LEFT JOIN data_peserta dp
      ON pj.peserta_id = dp.id
    LEFT JOIN penugasan_juri pju
      ON pju.peserta_id = pj.peserta_id
      AND pju.inovasi_id = pj.inovasi_id
      AND pju.juri_id = pj.juri_id
    WHERE pj.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const findPenugasanForJuri = async ({
  peserta_id,
  inovasi_id,
  juri_id,
}) => {
  const q = `
    SELECT *
    FROM penugasan_juri
    WHERE peserta_id = $1
      AND inovasi_id = $2
      AND juri_id = $3
    LIMIT 1
  `;

  const { rows } = await pool.query(q, [peserta_id, inovasi_id, juri_id]);
  return rows[0];
};

export const findPenugasanBySlot = async ({
  peserta_id,
  inovasi_id,
  slot_penilai,
}) => {
  const q = `
    SELECT *
    FROM penugasan_juri
    WHERE peserta_id = $1
      AND inovasi_id = $2
      AND slot_penilai = $3
    LIMIT 1
  `;

  const { rows } = await pool.query(q, [
    peserta_id,
    inovasi_id,
    slot_penilai,
  ]);
  return rows[0];
};

export const findPenilaianByUnique = async ({
  peserta_id,
  juri_id,
  inovasi_id,
}) => {
  const q = `
    SELECT *
    FROM penilaian_juri
    WHERE peserta_id = $1
      AND juri_id = $2
      AND inovasi_id = $3
    LIMIT 1
  `;

  const { rows } = await pool.query(q, [peserta_id, juri_id, inovasi_id]);
  return rows[0];
};

export const createPenilaian = async (payload) => {
  const fields = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = fields.map((_, index) => `$${index + 1}`);

  const q = `
    INSERT INTO penilaian_juri (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *
  `;

  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const updatePenilaianById = async (id, payload) => {
  const entries = Object.entries(payload);

  if (entries.length === 0) {
    return getPenilaianById(id);
  }

  const sets = [];
  const values = [];

  entries.forEach(([key, value], index) => {
    sets.push(`${key} = $${index + 1}`);
    values.push(value);
  });

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const q = `
    UPDATE penilaian_juri
    SET ${sets.join(', ')}
    WHERE id = $${values.length}
    RETURNING *
  `;

  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const deletePenilaianById = async (id) => {
  const q = `
    DELETE FROM penilaian_juri
    WHERE id = $1
    RETURNING id
  `;

  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

/* =========================
   TAMBAHAN RESET
========================= */

export const resetAllPenilaian = async () => {
  const q = `
    DELETE FROM penilaian_juri
    RETURNING id
  `;
  const { rows } = await pool.query(q);
  return rows;
};

export const resetPenilaianByJuriId = async (juriId) => {
  const q = `
    DELETE FROM penilaian_juri
    WHERE juri_id = $1
    RETURNING id
  `;
  const { rows } = await pool.query(q, [juriId]);
  return rows;
};

export const resetPenilaianByPesertaId = async (pesertaId) => {
  const q = `
    DELETE FROM penilaian_juri
    WHERE peserta_id = $1
    RETURNING id
  `;
  const { rows } = await pool.query(q, [pesertaId]);
  return rows;
};

export const resetPenilaianMilikJuri = async (juriId) => {
  const q = `
    DELETE FROM penilaian_juri
    WHERE juri_id = $1
    RETURNING id
  `;
  const { rows } = await pool.query(q, [juriId]);
  return rows;
};

export const resetSatuPenilaianMilikJuri = async (id, juriId) => {
  const q = `
    DELETE FROM penilaian_juri
    WHERE id = $1
      AND juri_id = $2
    RETURNING id
  `;
  const { rows } = await pool.query(q, [id, juriId]);
  return rows[0];
};

export default {
  getAllPenilaian,
  getPenilaianByJuriId,
  getPenilaianById,
  findPenugasanForJuri,
  findPenugasanBySlot,
  findPenilaianByUnique,
  createPenilaian,
  updatePenilaianById,
  deletePenilaianById,

  resetAllPenilaian,
  resetPenilaianByJuriId,
  resetPenilaianByPesertaId,
  resetPenilaianMilikJuri,
  resetSatuPenilaianMilikJuri,
};