import express from "express";
import submissionSettingsController from "../Controller/submissionSettingsController.js";
import { authenticate } from "../Middleware/auth.js";
import authorizeRole from "../Middleware/authorizeRole.js";

const router = express.Router();

// ambil setting
router.get("/", authenticate, authorizeRole("admin"), submissionSettingsController.getSetting);

// detail setting by id
router.get("/:id", authenticate, authorizeRole("admin"), submissionSettingsController.getSettingById);

// create setting
router.post("/", authenticate, authorizeRole("admin"), submissionSettingsController.createSetting);

// update setting
router.put("/:id", authenticate, authorizeRole("admin"), submissionSettingsController.updateSetting);

// delete setting
router.delete("/:id", authenticate, authorizeRole("admin"), submissionSettingsController.deleteSetting);

export default router;