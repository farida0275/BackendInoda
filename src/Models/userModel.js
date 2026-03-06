import pool from '../config/db.js';

export const getAllUsers = async () => {
	const q = `
		SELECT id, nama, email, role, avatar_url, phone, created_at, updated_at
		FROM users
		ORDER BY id
	`;
	const { rows } = await pool.query(q);
	return rows;
};

export const getUserById = async (id) => {
	const q = `
		SELECT id, nama, email, role, avatar_url, phone, created_at, updated_at
		FROM users
		WHERE id=$1
	`;
	const { rows } = await pool.query(q, [id]);
	return rows[0];
};

export const updateUserById = async (id, { nama, email, role, avatar_url, phone }) => {
	const sets = [];
	const values = [];
	let idx = 1;

	if (nama !== undefined) { sets.push(`nama=$${idx++}`); values.push(nama); }
	if (email !== undefined) { sets.push(`email=$${idx++}`); values.push(email); }
	if (role !== undefined) { sets.push(`role=$${idx++}`); values.push(role); }
	if (avatar_url !== undefined) { sets.push(`avatar_url=$${idx++}`); values.push(avatar_url); }
	if (phone !== undefined) { sets.push(`phone=$${idx++}`); values.push(phone); }

	if (sets.length === 0) {
		const q0 = `
			SELECT id, nama, email, role, avatar_url, phone, created_at, updated_at
			FROM users
			WHERE id=$1
		`;
		const { rows: r0 } = await pool.query(q0, [id]);
		return r0[0];
	}

	sets.push(`updated_at=NOW()`);

	const q = `
		UPDATE users
		SET ${sets.join(', ')}
		WHERE id=$${idx}
		RETURNING id, nama, email, role, avatar_url, phone, created_at, updated_at
	`;

	values.push(id);
	const { rows } = await pool.query(q, values);
	return rows[0];
};

export const deleteUserById = async (id) => {
	const q = `DELETE FROM users WHERE id=$1 RETURNING id`;
	const { rows } = await pool.query(q, [id]);
	return rows[0];
};