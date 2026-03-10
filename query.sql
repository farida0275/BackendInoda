CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

create table Inovasi(
	id serial primary key,
	name varchar(255) not null,
	Deskripsi varchar(255) 
);

CREATE TABLE data_peserta (
  id SERIAL PRIMARY KEY,
  nama_inovasi VARCHAR(255) NOT NULL,
  tahapan_inovasi VARCHAR(20) NOT NULL CHECK (
    tahapan_inovasi IN ('Inisiatif','Uji Coba','Penerapan')
  ),
  inisiator_inovasi VARCHAR(30) NOT NULL CHECK (
    inisiator_inovasi IN ('Kepala Daerah','Anggota DPRD','OPD','ASN','Masyarakat')
  ),
  nama_inisiator VARCHAR(255) NOT NULL,
  jenis_inovasi VARCHAR(20) NOT NULL CHECK (
    jenis_inovasi IN ('Digital','Non Digital')
  ),
  -- increased size from 150 to 1000 or TEXT to allow longer values
  bentuk_inovasi TEXT,
  tematik TEXT,
  urusan_utama TEXT,
  urusan_beririsan VARCHAR(255),
  waktu_uji_coba DATE,
  waktu_penerapan DATE,
  waktu_pengembangan DATE,
  skor_final NUMERIC(5,2) DEFAULT 0,
  rancangan_bangun TEXT,
  tujuan_inovasi TEXT,
  manfaat_diperoleh TEXT,
  hasil_inovasi TEXT,
  anggaran_pdf VARCHAR(255),
  profil_bisnis_pdf VARCHAR(255),
  dokumen_haki_pdf VARCHAR(255),
  penghargaan_pdf VARCHAR(255),
  proposal_pdf VARCHAR(255),
  dibuat_oleh INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE data_peserta
ADD COLUMN kategori INTEGER,
ADD CONSTRAINT fk_kategori_inovasi
FOREIGN KEY (kategori)
REFERENCES inovasi(id)
ON DELETE SET NULL;

create table berita(
    id serial primary key,
    judul varchar(255) not null,
    konten text not null,
    image_url text,
    author varchar(100),
    status varchar(50) default 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE penilaian_juri (
    id SERIAL PRIMARY KEY,
    peserta_id INTEGER NOT NULL,
    juri_id INTEGER NOT NULL,
    inovasi_id INTEGER NOT NULL,
    skor NUMERIC(5,2) NOT NULL CHECK (skor >= 0 AND skor <= 100),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (peserta_id) REFERENCES data_peserta(id) ON DELETE CASCADE,
    FOREIGN KEY (juri_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inovasi_id) REFERENCES inovasi(id) ON DELETE CASCADE,
    UNIQUE (peserta_id, juri_id, inovasi_id)
);

CREATE TABLE penugasan_juri (
    id SERIAL PRIMARY KEY,
    peserta_id INT NOT NULL,
    inovasi_id INT NOT NULL,
    juri_id INT NOT NULL,
    slot_penilai INT NOT NULL, -- 1 / 2 / 3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);