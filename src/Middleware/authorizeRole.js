const authorizeRole = (...allowedRoles) => {
	return (req, res, next) => {
		try {
			const user = req.user;

			if (!user) {
				return res.status(401).json({
					message: "User tidak terautentikasi"
				});
			}

			if (!allowedRoles.includes(user.role)) {
				return res.status(403).json({
					message: "Akses ditolak"
				});
			}

			next();
		} catch (error) {
			return res.status(500).json({
				message: "Gagal memeriksa role",
				error: error.message
			});
		}
	};
};

export default authorizeRole;