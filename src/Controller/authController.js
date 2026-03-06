import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createUser, findUserByEmail, findUserById, findUserByNama } from '../Models/authModel.js';
import { updateUserById } from '../Models/userModel.js';
import {
  validatePassword,
  validateEmail,
  validateNama,
  validatePhone,
  combineErrors,
  formatErrorResponse,
} from '../utils/validator.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'secret';

export const register = async (req, res) => {
	try {
		const { nama, email, password, phone = null } = req.body;

		const namaErrors = validateNama(nama);
		const emailErrors = validateEmail(email);
		const passwordErrors = validatePassword(password);
		const phoneErrors = validatePhone(phone);

		const allErrors = combineErrors(namaErrors, emailErrors, passwordErrors, phoneErrors);

		if (allErrors.length > 0) {
			return res.status(400).json(formatErrorResponse(allErrors, 'Registrasi gagal: Data tidak valid'));
		}

		const existing = await findUserByEmail(email);
		if (existing) {
			return res.status(409).json(
				formatErrorResponse([`Email '${email}' sudah terdaftar di sistem`], 'Email sudah digunakan')
			);
		}

		const namaExists = await findUserByNama(nama);
		if (namaExists) {
			return res.status(409).json(
				formatErrorResponse([`Nama '${nama}' sudah digunakan oleh pengguna lain`], 'Nama sudah terdaftar')
			);
		}

		const hashed = await bcrypt.hash(password, 10);
		const user = await createUser({ nama, email, password: hashed, phone });

		return res.status(201).json({
			message: 'Registrasi berhasil',
			data: {
				id: user.id,
				nama: user.nama,
				email: user.email,
				role: user.role,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json(
			formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
		);
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const emailErrors = validateEmail(email);
		if (emailErrors.length > 0) {
			return res.status(400).json(formatErrorResponse(emailErrors, 'Login gagal: Email tidak valid'));
		}

		if (!password) {
			return res.status(400).json(
				formatErrorResponse(['Password harus diisi'], 'Login gagal: Password diperlukan')
			);
		}

		const user = await findUserByEmail(email);
		if (!user) {
			return res.status(401).json(
				formatErrorResponse(['Email tidak terdaftar di sistem'], 'Kredensial tidak valid')
			);
		}

		const ok = await bcrypt.compare(password, user.password);
		if (!ok) {
			return res.status(401).json(
				formatErrorResponse(['Password yang Anda masukkan salah'], 'Kredensial tidak valid')
			);
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email, role: user.role },
			jwtSecret,
			{ expiresIn: '7d' }
		);

		return res.json({
			message: 'Login berhasil',
			data: {
				token,
				user: {
					id: user.id,
					nama: user.nama,
					email: user.email,
					role: user.role,
				},
			},
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json(
			formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
		);
	}
};

export const getProfile = async (req, res) => {
	try {
		const user = await findUserById(req.user.id);
		if (!user) {
			return res.status(404).json(
				formatErrorResponse([`User dengan ID ${req.user.id} tidak ditemukan`], 'User tidak ditemukan')
			);
		}

		return res.json({
			message: 'Profile berhasil diambil',
			data: user,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json(
			formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
		);
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { nama, email, role, phone } = req.body;
		const avatar_url =
			req.fileUrl ?? (req.body.avatar_url !== undefined ? req.body.avatar_url : undefined);

		const currentUser = await findUserById(req.user.id);
		if (!currentUser) {
			return res.status(404).json(
				formatErrorResponse([`User dengan ID ${req.user.id} tidak ditemukan`], 'User tidak ditemukan')
			);
		}

		const errors = [];

		if (nama !== undefined && nama !== null) {
			const namaErrors = validateNama(nama);
			errors.push(...namaErrors);

			if (nama !== currentUser.nama) {
				const namaExists = await findUserByNama(nama);
				if (namaExists) {
					errors.push(`Nama '${nama}' sudah digunakan oleh pengguna lain`);
				}
			}
		}

		if (email !== undefined && email !== null) {
			const emailErrors = validateEmail(email);
			errors.push(...emailErrors);

			if (email !== currentUser.email) {
				const emailExists = await findUserByEmail(email);
				if (emailExists) {
					errors.push(`Email '${email}' sudah digunakan oleh pengguna lain`);
				}
			}
		}

		if (phone !== undefined && phone !== null) {
			const phoneErrors = validatePhone(phone);
			errors.push(...phoneErrors);
		}

		if (errors.length > 0) {
			return res.status(400).json(
				formatErrorResponse(errors, 'Update profil gagal: Data tidak valid')
			);
		}

		const updatePayload = {};
		if (nama !== undefined) updatePayload.nama = nama;
		if (email !== undefined) updatePayload.email = email;
		if (role !== undefined) updatePayload.role = role;
		if (phone !== undefined) updatePayload.phone = phone;
		if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;

		if (Object.keys(updatePayload).length === 0) {
			return res.status(400).json(
				formatErrorResponse(['Tidak ada data yang diubah'], 'Tidak ada perubahan data')
			);
		}

		const user = await updateUserById(req.user.id, updatePayload);

		return res.json({
			message: 'Profile berhasil diperbarui',
			data: user,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json(
			formatErrorResponse(['Terjadi kesalahan pada server, silakan coba lagi'], 'Server error')
		);
	}
};

export default { register, login, getProfile, updateProfile };