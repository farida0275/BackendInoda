import submissionSettingsModel from "../Models/submissionSettingsModel.js";

const getSetting = async (req, res) => {
  try {
    const setting = await submissionSettingsModel.getSubmissionSetting();

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Pengaturan periode belum dibuat",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil pengaturan periode",
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil pengaturan periode",
      error: error.message,
    });
  }
};

const getSettingById = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await submissionSettingsModel.getSubmissionSettingById(id);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Pengaturan periode tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mengambil detail pengaturan periode",
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pengaturan periode",
      error: error.message,
    });
  }
};

const createSetting = async (req, res) => {
  try {
    const {
      registration_start,
      registration_end,
      edit_start,
      edit_end,
    } = req.body;

    if (
      !registration_start ||
      !registration_end ||
      !edit_start ||
      !edit_end
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field periode wajib diisi",
      });
    }

    if (new Date(registration_start) > new Date(registration_end)) {
      return res.status(400).json({
        success: false,
        message: "registration_start tidak boleh lebih besar dari registration_end",
      });
    }

    if (new Date(edit_start) > new Date(edit_end)) {
      return res.status(400).json({
        success: false,
        message: "edit_start tidak boleh lebih besar dari edit_end",
      });
    }

    const existingSetting = await submissionSettingsModel.getSubmissionSetting();

    if (existingSetting) {
      return res.status(400).json({
        success: false,
        message: "Pengaturan periode sudah ada. Gunakan update.",
      });
    }

    const newSetting = await submissionSettingsModel.createSubmissionSetting({
      registration_start,
      registration_end,
      edit_start,
      edit_end,
    });

    return res.status(201).json({
      success: true,
      message: "Pengaturan periode berhasil dibuat",
      data: newSetting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal membuat pengaturan periode",
      error: error.message,
    });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      registration_start,
      registration_end,
      edit_start,
      edit_end,
    } = req.body;

    if (
      !registration_start ||
      !registration_end ||
      !edit_start ||
      !edit_end
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field periode wajib diisi",
      });
    }

    if (new Date(registration_start) > new Date(registration_end)) {
      return res.status(400).json({
        success: false,
        message: "registration_start tidak boleh lebih besar dari registration_end",
      });
    }

    if (new Date(edit_start) > new Date(edit_end)) {
      return res.status(400).json({
        success: false,
        message: "edit_start tidak boleh lebih besar dari edit_end",
      });
    }

    const existingSetting = await submissionSettingsModel.getSubmissionSettingById(id);

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: "Pengaturan periode tidak ditemukan",
      });
    }

    const updatedSetting = await submissionSettingsModel.updateSubmissionSetting(id, {
      registration_start,
      registration_end,
      edit_start,
      edit_end,
    });

    return res.status(200).json({
      success: true,
      message: "Pengaturan periode berhasil diupdate",
      data: updatedSetting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengupdate pengaturan periode",
      error: error.message,
    });
  }
};

const deleteSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSetting = await submissionSettingsModel.getSubmissionSettingById(id);

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: "Pengaturan periode tidak ditemukan",
      });
    }

    const deletedSetting = await submissionSettingsModel.deleteSubmissionSetting(id);

    return res.status(200).json({
      success: true,
      message: "Pengaturan periode berhasil dihapus",
      data: deletedSetting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus pengaturan periode",
      error: error.message,
    });
  }
};

export default {
  getSetting,
  getSettingById,
  createSetting,
  updateSetting,
  deleteSetting,
};