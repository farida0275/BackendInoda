import express from "express";
import submissionSettingsController from "../Controller/submissionSettingsController.js";
import { authenticate } from "../Middleware/auth.js";
import authorizeRole from "../Middleware/authorizeRole.js";

const router = express.Router();

// GET boleh untuk semua user yang sudah login
router.get("/", authenticate, submissionSettingsController.getSetting);
router.get("/:id", authenticate, submissionSettingsController.getSettingById);

// POST/PUT/DELETE tetap khusus admin
router.post(
  "/",
  authenticate,
  authorizeRole("admin"),
  submissionSettingsController.createSetting
);

router.put(
  "/:id",
  authenticate,
  authorizeRole("admin"),
  submissionSettingsController.updateSetting
);

router.delete(
  "/:id",
  authenticate,
  authorizeRole("admin"),
  submissionSettingsController.deleteSetting
);

export default router;