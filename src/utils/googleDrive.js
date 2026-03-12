import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!FOLDER_ID) {
  throw new Error('GOOGLE_DRIVE_FOLDER_ID belum diset');
}

if (!clientEmail) {
  throw new Error('GOOGLE_CLIENT_EMAIL belum diset');
}

if (!privateKey) {
  throw new Error('GOOGLE_PRIVATE_KEY belum diset');
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
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
  await drive.files.delete({ fileId });
};

export default drive;