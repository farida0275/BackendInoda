import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE_PATH = path.join(__dirname, "../config/google-drive.json");
const FOLDER_ID = "18y5mqn9vw3v9m78LdCsfVpnzk8zoIeQO";

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const uploadBufferToDrive = async (file, customName = null) => {
  if (!file?.buffer) {
    throw new Error("File buffer tidak ditemukan");
  }

  const response = await drive.files.create({
    requestBody: {
      name: customName || file.originalname,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
      body: bufferToStream(file.buffer),
    },
    fields: "id, name, mimeType, size",
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId,
    url: `https://drive.google.com/uc?id=${fileId}`,
    name: response.data.name,
    mimeType: response.data.mimeType,
    size: response.data.size,
  };
};

export const deleteFileFromDrive = async (fileId) => {
  if (!fileId) return;

  await drive.files.delete({
    fileId,
  });
};

export default drive;