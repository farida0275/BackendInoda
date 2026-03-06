import pool from '../config/db.js';

export const getAllBerita = async () => {
  const q = `SELECT id, judul, konten, image_url, author, status, created_at FROM berita ORDER BY id`;
  const { rows } = await pool.query(q);
  return rows;
};

export const getBeritaById = async (id) => {
  const q = `SELECT id, judul, konten, image_url, author, status, created_at FROM berita WHERE id=$1`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const createBerita = async ({ judul, konten, image_url = null, author = null, status = 'draft' }) => {
  const q = `INSERT INTO berita (judul, konten, image_url, author, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, judul, konten, image_url, author, status, created_at`;
  const values = [judul, konten, image_url, author, status];
  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const updateBerita = async (id, { judul, konten, image_url, author, status }) => {
  const q = `UPDATE berita SET judul=$1, konten=$2, image_url=$3, author=$4, status=$5 WHERE id=$6 RETURNING id, judul, konten, image_url, author, status, created_at`;
  const values = [judul, konten, image_url, author, status, id];
  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const deleteBerita = async (id) => {
  const q = `DELETE FROM berita WHERE id=$1 RETURNING id`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};
