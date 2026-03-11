// Validasi User, Auth, dan Profile
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password harus diisi');
    return errors;
  }

  if (typeof password !== 'string') {
    errors.push('Password harus berupa teks');
    return errors;
  }

  password = password.trim();

  if (password.length < 8) {
    errors.push(`Password minimal 8 karakter (saat ini: ${password.length} karakter)`);
  }

  if (password.length > 50) {
    errors.push(`Password maksimal 50 karakter (saat ini: ${password.length} karakter)`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf BESAR (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter spesial (!@#$%^&* dll)');
  }

  return errors;
};

export const validateEmail = (email) => {
  const errors = [];

  if (!email) {
    errors.push('Email harus diisi');
    return errors;
  }

  if (typeof email !== 'string') {
    errors.push('Email harus berupa teks');
    return errors;
  }

  email = email.trim().toLowerCase();

  if (email.length > 50) {
    errors.push(`Email terlalu panjang (maksimal 50 karakter, saat ini: ${email.length})`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Format email tidak valid (contoh: user@email.com)');
  }

  if (email.startsWith('.') || email.endsWith('.')) {
    errors.push('Email tidak boleh dimulai atau diakhiri dengan titik');
  }

  if (email.includes('..')) {
    errors.push('Email tidak boleh mengandung titik berturut-turut');
  }

  const [localPart] = email.split('@');
  if (localPart.length > 64) {
    errors.push('Bagian email sebelum @ terlalu panjang (maksimal 64 karakter)');
  }

  return errors;
};

// validateNama digunakan di controller untuk nama lengkap
export const validateNama = (nama) => {
  const errors = [];

  if (!nama) {
    errors.push('Nama harus diisi');
    return errors;
  }

  if (typeof nama !== 'string') {
    errors.push('Nama harus berupa teks');
    return errors;
  }

  nama = nama.trim();
  if (nama.length < 3) {
    errors.push('Nama minimal 3 karakter');
  }
  if (nama.length > 100) {
    errors.push('Nama maksimal 100 karakter');
  }

  return errors;
};

// Username validation is separate (for login handles etc.)
export const validateUsername = (username) => {
  const errors = [];

  if (!username) {
    errors.push('Username harus diisi');
    return errors;
  }

  if (typeof username !== 'string') {
    errors.push('Username harus berupa teks');
    return errors;
  }

  username = username.trim();

  if (username.length > 50) {
    errors.push(`Username maksimal 50 karakter (saat ini: ${username.length} karakter)`);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username hanya boleh mengandung huruf (a-z, A-Z), angka (0-9), underscore (_), dan dash (-)');
  }

  if (username.includes('__') || username.includes('--')) {
    errors.push('Username tidak boleh mengandung underscore atau dash berturut-turut');
  }

  const reservedUsernames = ['admin', 'root', 'system', 'user', 'test', 'guest'];
  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push(`Username '${username}' tidak tersedia (username terreservasi)`);
  }

  return errors;
};

export const validatePhone = (phone) => {
  const errors = [];

  if (!phone) {
    return errors; 
  }

  if (typeof phone !== 'string') {
    errors.push('Nomor telepon harus berupa teks');
    return errors;
  }

  phone = phone.trim();

  if (phone.length < 10) {
    errors.push(`Nomor telepon minimal 10 digit (saat ini: ${phone.length} karakter)`);
  }

  if (phone.length > 15) {
    errors.push(`Nomor telepon maksimal 15 digit (saat ini: ${phone.length} karakter)`);
  }

  if (!/^[0-9+\-\s()]+$/.test(phone)) {
    errors.push('Nomor telepon hanya boleh mengandung angka, +, -, spasi, dan kurung');
  }

  const digitCount = (phone.match(/[0-9]/g) || []).length;
  if (digitCount < 10) {
    errors.push(`Nomor telepon harus memiliki minimal 10 digit (saat ini: ${digitCount} digit)`);
  }

  return errors;
};

export const validateAddress = (address) => {
  const errors = [];

  if (!address) {
    return errors; 
  }

  if (typeof address !== 'string') {
    errors.push('Alamat harus berupa teks');
    return errors;
  }

  address = address.trim();

  return errors;
};


// Validasi Produk 
export const validateProductName = (nama_produk) => {
  const errors = [];

  if (!nama_produk) {
    errors.push('Nama produk harus diisi');
    return errors;
  }

  if (typeof nama_produk !== 'string') {
    errors.push('Nama produk harus berupa teks');
    return errors;
  }

  nama_produk = nama_produk.trim();

  if (nama_produk.length > 50) {
    errors.push(`Nama produk maksimal 50 karakter (saat ini: ${nama_produk.length} karakter)`);
  }

  if (/^[\s]+$/.test(nama_produk)) {
    errors.push('Nama produk tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validatePrice = (harga) => {
  const errors = [];

  if (harga === null || harga === undefined || harga === '') {
    errors.push('Harga harus diisi');
    return errors;
  }

  const priceNum = Number(harga);

  if (isNaN(priceNum)) {
    errors.push(`Harga harus berupa angka (Anda memasukkan: ${harga})`);
    return errors;
  }

  if (priceNum < 0) {
    errors.push(`Harga tidak boleh negatif (Anda memasukkan: ${priceNum})`);
  }

  if (!Number.isInteger(priceNum)) {
    errors.push(`Harga harus berupa angka bulat tanpa desimal (Anda memasukkan: ${harga})`);
  }

  if (priceNum === 0) {
    errors.push('Harga tidak boleh 0');
  }

  return errors;
};

export const validateDescription = (deskripsi) => {
  const errors = [];

  if (!deskripsi) {
    return errors; 
  }

  if (typeof deskripsi !== 'string') {
    errors.push('Deskripsi harus berupa teks');
    return errors;
  }

  deskripsi = deskripsi.trim();

  if (deskripsi.length > 1000) {
    errors.push(`Deskripsi maksimal 1000 karakter (saat ini: ${deskripsi.length} karakter)`);
  }

  if (/^[\s]+$/.test(deskripsi)) {
    errors.push('Deskripsi tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validateTitle = (judul) => {
  const errors = [];

  if (!judul) {
    errors.push('Judul harus diisi');
    return errors;
  }

  if (typeof judul !== 'string') {
    errors.push('Judul harus berupa teks');
    return errors;
  }

  judul = judul.trim();

  if (judul.length < 5) {
    errors.push(`Judul minimal 5 karakter (saat ini: ${judul.length} karakter)`);
  }

  if (judul.length > 200) {
    errors.push(`Judul maksimal 200 karakter (saat ini: ${judul.length} karakter)`);
  }

  if (/^[\s]+$/.test(judul)) {
    errors.push('Judul tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validateContent = (konten) => {
  const errors = [];

  if (!konten) {
    errors.push('Konten harus diisi');
    return errors;
  }

  if (typeof konten !== 'string') {
    errors.push('Konten harus berupa teks');
    return errors;
  }

  konten = konten.trim();

  if (konten.length < 20) {
    errors.push(`Konten minimal 20 karakter (saat ini: ${konten.length} karakter)`);
  }

  if (konten.length > 5000) {
    errors.push(`Konten maksimal 5000 karakter (saat ini: ${konten.length} karakter)`);
  }

  if (/^[\s]+$/.test(konten)) {
    errors.push('Konten tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validateCategoryName = (name) => {
  const errors = [];

  if (!name) {
    errors.push('Nama kategori harus diisi');
    return errors;
  }

  if (typeof name !== 'string') {
    errors.push('Nama kategori harus berupa teks');
    return errors;
  }

  name = name.trim();

  if (name.length < 3) {
    errors.push(`Nama kategori minimal 3 karakter (saat ini: ${name.length} karakter)`);
  }

  if (name.length > 50) {
    errors.push(`Nama kategori maksimal 50 karakter (saat ini: ${name.length} karakter)`);
  }

  if (/^[\s]+$/.test(name)) {
    errors.push('Nama kategori tidak boleh hanya berisi spasi');
  }

  return errors;
};

// helper validator for fields with a set of allowed values
export const validateEnum = (value, fieldName, validOptions) => {
  const errors = [];
  if (!value) {
    errors.push(`${fieldName} harus diisi`);
    return errors;
  }
  if (typeof value !== 'string') {
    errors.push(`${fieldName} harus berupa teks`);
    return errors;
  }
  if (!validOptions.includes(value)) {
    errors.push(`${fieldName} harus salah satu dari: ${validOptions.join(', ')}`);
  }
  return errors;
};

export const validateOptionalString = (value, fieldName, maxLen = 255) => {
  const errors = [];
  if (value === undefined || value === null || value === '') {
    return errors;
  }
  if (typeof value !== 'string') {
    errors.push(`${fieldName} harus berupa teks`);
    return errors;
  }
  if (value.trim().length > maxLen) {
    errors.push(`${fieldName} maksimal ${maxLen} karakter`);
  }
  return errors;
};

export const validateOptionalDate = (value, fieldName) => {
  const errors = [];
  if (!value) return errors;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    errors.push(`${fieldName} bukan tanggal yang valid`);
  }
  return errors;
};

export const validateOptionalNumber = (value, fieldName, { min, max } = {}) => {
  const errors = [];
  if (value === undefined || value === null || value === '') return errors;
  const num = Number(value);
  if (isNaN(num)) {
    errors.push(`${fieldName} harus berupa angka`);
  } else {
    if (min !== undefined && num < min) errors.push(`${fieldName} minimal ${min}`);
    if (max !== undefined && num > max) errors.push(`${fieldName} maksimal ${max}`);
  }
  return errors;
};

export const validateStatus = (status, validStatuses = ['draft', 'published', 'archived']) => {
  const errors = [];

  if (!status) {
    errors.push('Status harus diisi');
    return errors;
  }

  if (typeof status !== 'string') {
    errors.push('Status harus berupa teks');
    return errors;
  }

  status = status.toLowerCase().trim();

  if (!validStatuses.includes(status)) {
    errors.push(`Status harus salah satu dari: ${validStatuses.join(', ')} (Anda memasukkan: ${status})`);
  }

  return errors;
};

export const validateRole = (role, validRoles = ['user', 'admin', 'juri']) => {
  const errors = [];

  if (!role) {
    errors.push('Role harus diisi');
    return errors;
  }

  if (typeof role !== 'string') {
    errors.push('Role harus berupa teks');
    return errors;
  }

  role = role.toLowerCase().trim();

  if (!validRoles.includes(role)) {
    errors.push(`Role harus salah satu dari: ${validRoles.join(', ')} (Anda memasukkan: ${role})`);
  }

  return errors;
};

export const validateId = (id) => {
  const errors = [];

  if (!id) {
    errors.push('ID harus diisi');
    return errors;
  }

  const idNum = Number(id);
  if (isNaN(idNum)) {
    errors.push(`ID harus berupa angka (Anda memasukkan: ${id})`);
    return errors;
  }

  if (!Number.isInteger(idNum)) {
    errors.push('ID harus berupa angka bulat');
  }

  if (idNum <= 0) {
    errors.push(`ID harus lebih besar dari 0 (Anda memasukkan: ${idNum})`);
  }

  return errors;
};


export const combineErrors = (...errorArrays) => {
  return errorArrays.flat().filter(error => error && error.length > 0);
};

export const formatErrorResponse = (errors, customMessage = 'Validasi gagal') => {
  return {
    message: customMessage,
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString(),
  };
};

export const formatSuccessResponse = (data, message = 'Sukses', code = 200) => {
  return {
    message,
    data,
    code,
    timestamp: new Date().toISOString(),
  };
};

export const validateAuthorName = (author) => {
  const errors = [];

  if (!author) {
    errors.push('Author harus diisi');
    return errors;
  }

  if (typeof author !== 'string') {
    errors.push('Author harus berupa teks');
    return errors;
  }

  author = author.trim();

  if (author.length < 3) {
    errors.push(`Author minimal 3 karakter (saat ini: ${author.length} karakter)`);
  }

  if (author.length > 150) {
    errors.push(`Author maksimal 150 karakter (saat ini: ${author.length} karakter)`);
  }

  if (/^[\s]+$/.test(author)) {
    errors.push('Author tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validateSourceName = (source_name) => {
  const errors = [];

  if (source_name === undefined || source_name === null || source_name === '') {
    return errors;
  }

  if (typeof source_name !== 'string') {
    errors.push('Nama sumber harus berupa teks');
    return errors;
  }

  source_name = source_name.trim();

  if (source_name.length < 2) {
    errors.push(`Nama sumber minimal 2 karakter (saat ini: ${source_name.length} karakter)`);
  }

  if (source_name.length > 150) {
    errors.push(`Nama sumber maksimal 150 karakter (saat ini: ${source_name.length} karakter)`);
  }

  if (/^[\s]+$/.test(source_name)) {
    errors.push('Nama sumber tidak boleh hanya berisi spasi');
  }

  return errors;
};

export const validateSourceUrl = (source_url) => {
  const errors = [];

  if (source_url === undefined || source_url === null || source_url === '') {
    return errors;
  }

  if (typeof source_url !== 'string') {
    errors.push('Link sumber harus berupa teks');
    return errors;
  }

  source_url = source_url.trim();

  try {
    const parsedUrl = new URL(source_url);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('Link sumber harus menggunakan http:// atau https://');
    }
  } catch {
    errors.push('Link sumber harus berupa URL yang valid');
  }

  if (source_url.length > 1000) {
    errors.push(`Link sumber terlalu panjang (maksimal 1000 karakter, saat ini: ${source_url.length})`);
  }

  return errors;
};
