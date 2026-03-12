import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  : null;

if (!serviceAccount) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON belum diset');
}

if (!FOLDER_ID) {
  throw new Error('GOOGLE_DRIVE_FOLDER_ID belum diset');
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({
  version: 'v3',
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
    throw new Error('File buffer tidak ditemukan');
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
    fields: 'id, name, mimeType, size',
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
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