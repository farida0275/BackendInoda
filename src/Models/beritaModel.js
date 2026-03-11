import pool from '../config/db.js';

export const getAllBerita = async () => {
  const q = `
    SELECT 
      id,
      judul,
      konten,
      image_url,
      author,
      status,
      source_name,
      source_url,
      created_at
    FROM berita
    ORDER BY id
  `;
  const { rows } = await pool.query(q);
  return rows;
};

export const getBeritaById = async (id) => {
  const q = `
    SELECT 
      id,
      judul,
      konten,
      image_url,
      author,
      status,
      source_name,
      source_url,
      created_at
    FROM berita
    WHERE id = $1
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

export const createBerita = async ({
  judul,
  konten,
  image_url = null,
  author = null,
  status = 'draft',
  source_name = null,
  source_url = null,
}) => {
  const q = `
    INSERT INTO berita (
      judul,
      konten,
      image_url,
      author,
      status,
      source_name,
      source_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      judul,
      konten,
      image_url,
      author,
      status,
      source_name,
      source_url,
      created_at
  `;
  const values = [judul, konten, image_url, author, status, source_name, source_url];
  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const updateBerita = async (
  id,
  { judul, konten, image_url, author, status, source_name, source_url }
) => {
  const q = `
    UPDATE berita
    SET
      judul = COALESCE($1, judul),
      konten = COALESCE($2, konten),
      image_url = COALESCE($3, image_url),
      author = COALESCE($4, author),
      status = COALESCE($5, status),
      source_name = COALESCE($6, source_name),
      source_url = COALESCE($7, source_url)
    WHERE id = $8
    RETURNING
      id,
      judul,
      konten,
      image_url,
      author,
      status,
      source_name,
      source_url,
      created_at
  `;
  const values = [judul, konten, image_url, author, status, source_name, source_url, id];
  const { rows } = await pool.query(q, values);
  return rows[0];
};

export const deleteBerita = async (id) => {
  const q = `DELETE FROM berita WHERE id = $1 RETURNING id`;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};