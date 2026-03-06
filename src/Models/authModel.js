import pool from '../config/db.js';

export const createUser = async ({
	nama,
	email,
	password,
	role = 'user',
	avatar_url = null,
	phone = null,
}) => {
	const q = `
		INSERT INTO users (nama, email, password, role, avatar_url, phone)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, nama, email, role, avatar_url, phone, created_at, updated_at
	`;

	const values = [nama, email, password, role, avatar_url, phone];
	const { rows } = await pool.query(q, values);
	return rows[0];
};

export const findUserByEmail = async (email) => {
	const q = `SELECT * FROM users WHERE email=$1`;
	const { rows } = await pool.query(q, [email]);
	return rows[0];
};

export const findUserById = async (id) => {
	const q = `
		SELECT id, nama, email, role, avatar_url, phone, created_at, updated_at
		FROM users
		WHERE id=$1
	`;
	const { rows } = await pool.query(q, [id]);
	return rows[0];
};

export const findUserByNama = async (nama) => {
	const q = `SELECT * FROM users WHERE nama=$1`;
	const { rows } = await pool.query(q, [nama]);
	return rows[0];
};