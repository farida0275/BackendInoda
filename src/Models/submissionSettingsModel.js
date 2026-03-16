import db from "../config/db.js";

const getSubmissionSetting = async () => {
  const query = `
    SELECT 
      id,
      registration_start,
      registration_end,
      edit_start,
      edit_end,
      created_at,
      updated_at
    FROM submission_settings
    ORDER BY id ASC
    LIMIT 1
  `;

  const result = await db.query(query);
  return result.rows[0];
};

const getSubmissionSettingById = async (id) => {
  const query = `
    SELECT 
      id,
      registration_start,
      registration_end,
      edit_start,
      edit_end,
      created_at,
      updated_at
    FROM submission_settings
    WHERE id = $1
    LIMIT 1
  `;

  const result = await db.query(query, [id]);
  return result.rows[0];
};

const createSubmissionSetting = async ({
  registration_start,
  registration_end,
  edit_start,
  edit_end,
}) => {
  const query = `
    INSERT INTO submission_settings (
      registration_start,
      registration_end,
      edit_start,
      edit_end
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    registration_start,
    registration_end,
    edit_start,
    edit_end,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

const updateSubmissionSetting = async (
  id,
  {
    registration_start,
    registration_end,
    edit_start,
    edit_end,
  }
) => {
  const query = `
    UPDATE submission_settings
    SET
      registration_start = $1,
      registration_end = $2,
      edit_start = $3,
      edit_end = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
  `;

  const values = [
    registration_start,
    registration_end,
    edit_start,
    edit_end,
    id,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteSubmissionSetting = async (id) => {
  const query = `
    DELETE FROM submission_settings
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [id]);
  return result.rows[0];
};

export default {
  getSubmissionSetting,
  getSubmissionSettingById,
  createSubmissionSetting,
  updateSubmissionSetting,
  deleteSubmissionSetting,
};