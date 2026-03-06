import pool from '../config/db.js';

export const getAllPenilaian = async () => {
    const q = `
        SELECT *
        FROM penilaian_juri
        ORDER BY id
    `;
    const { rows } = await pool.query(q);
    return rows;
};

export const getPenilaianById = async (id) => {
    const q = `
        SELECT *
        FROM penilaian_juri
        WHERE id = $1
    `;
    const { rows } = await pool.query(q, [id]);
    return rows[0];
};

export const createPenilaian = async (payload) => {
    const fields = Object.keys(payload);
    const values = Object.values(payload);
    const idxs = fields.map((_, i) => `$${i + 1}`);

    const q = `
        INSERT INTO penilaian_juri (${fields.join(', ')})
        VALUES (${idxs.join(', ')})
        RETURNING *
    `;
    const { rows } = await pool.query(q, values);
    return rows[0];
};

export const updatePenilaianById = async (id, payload) => {
    const sets = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(payload)) {
        sets.push(`${key}=$${idx++}`);
        values.push(val);
    }
    if (sets.length === 0) {
        return await getPenilaianById(id);
    }
    sets.push(`updated_at=NOW()`);
    const q = `
        UPDATE penilaian_juri
        SET ${sets.join(', ')}
        WHERE id=$${idx}
        RETURNING *
    `;
    values.push(id);
    const { rows } = await pool.query(q, values);
    return rows[0];
};

export const deletePenilaianById = async (id) => {
    const q = `DELETE FROM penilaian_juri WHERE id=$1 RETURNING id`;
    const { rows } = await pool.query(q, [id]);
    return rows[0];
};