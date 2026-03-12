import pool from '../config/db.js';

export const getAllDataPeserta = async () => {
  const q = `
    SELECT *
    FROM data_peserta
    ORDER BY created_at DESC, id DESC
  `;
  const { rows } = await pool.query(q);
  return rows;
};

export const getDataPesertaByCreator = async (userId) => {
  const q = `
    SELECT *
    FROM data_peserta
    WHERE dibuat_oleh = $1
    ORDER BY created_at DESC, id DESC
  `;
  const { rows } = await pool.query(q, [userId]);
  return rows;
};

export const getDataPesertaById = async (id) => {
  const q = `
    SELECT *
    FROM data_peserta
    WHERE id = $1
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const createDataPeserta = async (payload) => {
  const fields = Object.keys(payload);

  if (fields.length === 0) {
    throw new Error('Payload kosong, tidak ada data untuk disimpan');
  }

  const values = Object.values(payload);
  const idxs = fields.map((_, i) => `$${i + 1}`);

  const q = `
    INSERT INTO data_peserta (${fields.join(', ')})
    VALUES (${idxs.join(', ')})
    RETURNING *
  `;

  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const updateDataPesertaById = async (id, payload) => {
  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(payload)) {
    sets.push(`${key}=$${idx++}`);
    values.push(val);
  }

  if (sets.length === 0) {
    return await getDataPesertaById(id);
  }

  sets.push(`updated_at=NOW()`);

  const q = `
    UPDATE data_peserta
    SET ${sets.join(', ')}
    WHERE id=$${idx}
    RETURNING *
  `;

  values.push(id);

  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const updateSeleksiPesertaById = async (id, payload) => {
  const q = `
    UPDATE data_peserta
    SET tahap_seleksi = $1,
        status_seleksi = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const { rows } = await pool.query(q, [
    payload.tahap_seleksi,
    payload.status_seleksi,
    id,
  ]);
  return rows[0];
};

export const deleteDataPesertaById = async (id) => {
  const q = `DELETE FROM data_peserta WHERE id=$1 RETURNING id`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const resetAllDataPeserta = async () => {
  await pool.query(`DELETE FROM data_peserta`);
  await pool.query(`ALTER SEQUENCE data_peserta_id_seq RESTART WITH 1`);
  return { success: true };
};