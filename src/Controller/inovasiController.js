import {
  getAllInovasi,
  getInovasiById,
  createInovasi,
  updateInovasi,
  deleteInovasi,
} from '../Models/inovasiModel.js';
import {
  validateProductName,
  validateDescription,
  validateId,
  combineErrors,
  formatErrorResponse,
} from '../utils/validator.js';

export const getInovasiList = async (req, res) => {
  try {
    const items = await getAllInovasi();
    return res.json({
      message: 'Daftar inovasi berhasil diambil',
      count: items.length,
      data: items,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error'));
  }
};

export const getInovasiDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Detail inovasi gagal: ID tidak valid'));
    }

    const item = await getInovasiById(id);
    if (!item) {
      return res.status(404).json(formatErrorResponse([`Inovasi dengan ID ${id} tidak ditemukan`], 'Inovasi tidak ditemukan'));
    }

    return res.json({ message: 'Detail inovasi berhasil diambil', data: item, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json(formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error'));
  }
};

export const createNewInovasi = async (req, res) => {
  try {
    const { name, deskripsi } = req.body;

    const nameErrors = validateProductName(name);
    const descErrors = validateDescription(deskripsi);
    const allErrors = combineErrors(nameErrors, descErrors);
    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Buat inovasi gagal: Data tidak valid'));
    }

    const item = await createInovasi({ name, deskripsi });
    return res.status(201).json({ message: 'Inovasi berhasil dibuat', data: item, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json(formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error'));
  }
};

export const updateInovasiData = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, deskripsi } = req.body;

    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Update inovasi gagal: ID tidak valid'));
    }

    const nameErrors = name !== undefined ? validateProductName(name) : [];
    const descErrors = deskripsi !== undefined ? validateDescription(deskripsi) : [];
    const allErrors = combineErrors(nameErrors, descErrors);
    if (allErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(allErrors, 'Update inovasi gagal: Data tidak valid'));
    }

    const item = await updateInovasi(id, { name, deskripsi });
    if (!item) {
      return res.status(404).json(formatErrorResponse([`Inovasi dengan ID ${id} tidak ditemukan`], 'Inovasi tidak ditemukan'));
    }

    return res.json({ message: 'Inovasi berhasil diperbarui', data: item, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json(formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error'));
  }
};

export const deleteInovasiData = async (req, res) => {
  try {
    const { id } = req.params;
    const idErrors = validateId(id);
    if (idErrors.length > 0) {
      return res.status(400).json(formatErrorResponse(idErrors, 'Hapus inovasi gagal: ID tidak valid'));
    }

    const result = await deleteInovasi(id);
    if (!result) {
      return res.status(404).json(formatErrorResponse([`Inovasi dengan ID ${id} tidak ditemukan`], 'Inovasi tidak ditemukan'));
    }

    return res.json({ message: 'Inovasi berhasil dihapus', data: { deletedId: result.id }, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json(formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error'));
  }
};

export default { getInovasiList, getInovasiDetail, createNewInovasi, updateInovasiData, deleteInovasiData };
