import pool from '../config/db.js';

export const getAllInovasi = async () => {
  const q = `SELECT id, name, deskripsi FROM inovasi ORDER BY id`;
  const { rows } = await pool.query(q);
  return rows;
};

export const getInovasiById = async (id) => {
  const q = `SELECT id, name, deskripsi FROM inovasi WHERE id=$1`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const createInovasi = async ({ name, deskripsi }) => {
  const q = `
    INSERT INTO inovasi (name, deskripsi)
    VALUES ($1, $2)
    RETURNING id, name, deskripsi
  `;
  const { rows } = await pool.query(q, [name, deskripsi]);
  return rows[0];
};

export const updateInovasi = async (id, { name, deskripsi }) => {
  const sets = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { sets.push(`name=$${idx++}`); values.push(name); }
  if (deskripsi !== undefined) { sets.push(`deskripsi=$${idx++}`); values.push(deskripsi); }

  if (sets.length === 0) {
    const q0 = `SELECT id, name, deskripsi FROM inovasi WHERE id=$1`;
    const { rows: r0 } = await pool.query(q0, [id]);
    return r0[0];
  }

  const q = `
    UPDATE inovasi
    SET ${sets.join(', ')}
    WHERE id=$${idx}
    RETURNING id, name, deskripsi
  `;
  values.push(id);
  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const deleteInovasi = async (id) => {
  const q = `DELETE FROM inovasi WHERE id=$1 RETURNING id`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export default { getAllInovasi, getInovasiById, createInovasi, updateInovasi, deleteInovasi };
