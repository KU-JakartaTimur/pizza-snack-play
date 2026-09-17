-- Seed Pizza Snack Play (dibuat otomatis oleh scripts/seed.ts)

DELETE FROM schedules;

DELETE FROM menu_items;

DELETE FROM menu_categories;

DELETE FROM menus;

DELETE FROM weeks;

DELETE FROM parents;

DELETE FROM users;

DELETE FROM categories;

DELETE FROM holidays;

DELETE FROM settings;

INSERT INTO categories (id, name, slug, color) VALUES
  (1, 'Gorengan', 'gorengan', '#FF8C00'),
  (2, 'Kukusan', 'kukusan', '#4169E1'),
  (3, 'Rebusan', 'rebusan', '#20B2AA'),
  (4, 'Panggangan', 'panggangan', '#CD853F'),
  (5, 'Buah Segar', 'buah-segar', '#32CD32'),
  (6, 'Roti/Bakery', 'roti-bakery', '#DAA520'),
  (7, 'Kue Tradisional', 'kue-tradisional', '#FF69B4'),
  (8, 'Lainnya', 'lainnya', '#A9A9A9');

INSERT INTO weeks (id, week_start_date, week_end_date, month, year, label) VALUES
  (1, '2026-09-01', '2026-09-04', 9, 2026, 'Minggu 1 September 2026'),
  (2, '2026-09-07', '2026-09-11', 9, 2026, 'Minggu 2 September 2026'),
  (3, '2026-09-14', '2026-09-18', 9, 2026, 'Minggu 3 September 2026'),
  (4, '2026-09-21', '2026-09-25', 9, 2026, 'Minggu 4 September 2026'),
  (5, '2026-09-28', '2026-09-30', 9, 2026, 'Minggu 5 September 2026'),
  (6, '2026-08-03', '2026-08-07', 8, 2026, 'Minggu 1 Agustus 2026'),
  (7, '2026-08-10', '2026-08-14', 8, 2026, 'Minggu 2 Agustus 2026'),
  (8, '2026-08-17', '2026-08-21', 8, 2026, 'Minggu 3 Agustus 2026'),
  (9, '2026-08-24', '2026-08-28', 8, 2026, 'Minggu 4 Agustus 2026'),
  (10, '2026-08-31', '2026-08-31', 8, 2026, 'Minggu 5 Agustus 2026');

INSERT INTO menus (id, name, description) VALUES
  (1, 'Roti isi coklat + jeruk', 'outing'),
  (2, 'Tahu isi sayur + melon', NULL),
  (3, 'Pisang panggang coklat keju + nanas madu', NULL),
  (4, 'Urap jagung + semangka', NULL),
  (5, 'Ubi cilembu + Jambu air', NULL),
  (6, 'Bihun goreng sayur + pisang', NULL),
  (7, 'Sawut singkong + melon', NULL),
  (8, 'Nagasari + pisang', NULL),
  (9, 'Risol ayam + pepaya', NULL),
  (10, 'Edamame rebus + jeruk', NULL),
  (11, 'Donat kentang + Pepaya', NULL),
  (12, 'Kukus ubi ungu + strawberry', NULL),
  (13, 'Telor sayur gulung + salak', NULL),
  (14, 'Puding labu kuning + pisang', NULL),
  (15, 'Pastel sayur + jambu kristal', NULL),
  (16, 'Jagung rebus + pisang', NULL),
  (17, 'lemet + salak', NULL),
  (18, 'Bola bola ubi + melon', NULL),
  (19, 'Kroket kentang sayur + semangka', NULL),
  (20, 'pisang goreng + bengkoang', NULL),
  (21, 'Lontong isi ayam + strawberry', NULL),
  (22, 'Telur puyuh rebus + buah naga', NULL),
  (23, 'Sandwich telur + Pepaya', NULL),
  (24, 'Bihun sayur + semangka', NULL),
  (25, 'Pastel + jeruk', NULL),
  (26, 'Bolen + strawberry', NULL),
  (27, 'Ubi cilembu + Klengkeng', NULL),
  (28, 'Risol sayur + Melon', NULL),
  (29, 'Misro + pisang', NULL),
  (30, 'Pisang kukus + nanas madu', NULL),
  (31, 'Klepon + salak', NULL),
  (32, 'Onde onde + jambu kristal', NULL),
  (33, 'Roti bakar + Pepaya', NULL),
  (34, 'Gabin tape + pir', NULL),
  (35, 'Telor rebus + jeruk', NULL),
  (36, 'kue sus + strawberry', NULL),
  (37, 'Bakwan sayur + melon', NULL),
  (38, 'Biji salak + pisang', NULL),
  (39, 'tahu bakso + sawo', NULL),
  (40, 'Serabi + jambu air', NULL),
  (41, 'kue lumpur + nanas madu', NULL),
  (42, 'sosis solo + bengkoang', NULL);

INSERT INTO menu_items (id, menu_id, name, item_type, category_id) VALUES
  (1, 1, 'Roti isi coklat', 'main', 6),
  (2, 1, 'jeruk', 'fruit', 5),
  (3, 2, 'Tahu isi sayur', 'main', 1),
  (4, 2, 'melon', 'fruit', 5),
  (5, 3, 'Pisang panggang coklat keju', 'main', 4),
  (6, 3, 'nanas madu', 'fruit', 5),
  (7, 4, 'Urap jagung', 'main', 8),
  (8, 4, 'semangka', 'fruit', 5),
  (9, 5, 'Ubi cilembu', 'main', 1),
  (10, 5, 'Jambu air', 'fruit', 5),
  (11, 6, 'Bihun goreng sayur', 'main', 8),
  (12, 6, 'pisang', 'fruit', 5),
  (13, 7, 'Sawut singkong', 'main', 7),
  (14, 7, 'melon', 'fruit', 5),
  (15, 8, 'Nagasari', 'main', 7),
  (16, 8, 'pisang', 'fruit', 5),
  (17, 9, 'Risol ayam', 'main', 1),
  (18, 9, 'pepaya', 'fruit', 5),
  (19, 10, 'Edamame rebus', 'main', 3),
  (20, 10, 'jeruk', 'fruit', 5),
  (21, 11, 'Donat kentang', 'main', 6),
  (22, 11, 'Pepaya', 'fruit', 5),
  (23, 12, 'Kukus ubi ungu', 'main', 3),
  (24, 12, 'strawberry', 'fruit', 5),
  (25, 13, 'Telor sayur gulung', 'main', 8),
  (26, 13, 'salak', 'fruit', 5),
  (27, 14, 'Puding labu kuning', 'main', 7),
  (28, 14, 'pisang', 'fruit', 5),
  (29, 15, 'Pastel sayur', 'main', 1),
  (30, 15, 'jambu kristal', 'fruit', 5),
  (31, 16, 'Jagung rebus', 'main', 3),
  (32, 16, 'pisang', 'fruit', 5),
  (33, 17, 'lemet', 'main', 7),
  (34, 17, 'salak', 'fruit', 5),
  (35, 18, 'Bola bola ubi', 'main', 1),
  (36, 18, 'melon', 'fruit', 5),
  (37, 19, 'Kroket kentang sayur', 'main', 1),
  (38, 19, 'semangka', 'fruit', 5),
  (39, 20, 'pisang goreng', 'main', 1),
  (40, 20, 'bengkoang', 'fruit', 5),
  (41, 21, 'Lontong isi ayam', 'main', 8),
  (42, 21, 'strawberry', 'fruit', 5),
  (43, 22, 'Telur puyuh rebus', 'main', 3),
  (44, 22, 'buah naga', 'fruit', 5),
  (45, 23, 'Sandwich telur', 'main', 6),
  (46, 23, 'Pepaya', 'fruit', 5),
  (47, 24, 'Bihun sayur', 'main', 8),
  (48, 24, 'semangka', 'fruit', 5),
  (49, 25, 'Pastel', 'main', 1),
  (50, 25, 'jeruk', 'fruit', 5),
  (51, 26, 'Bolen', 'main', 6),
  (52, 26, 'strawberry', 'fruit', 5),
  (53, 27, 'Ubi cilembu', 'main', 1),
  (54, 27, 'Klengkeng', 'fruit', 5),
  (55, 28, 'Risol sayur', 'main', 1),
  (56, 28, 'Melon', 'fruit', 5),
  (57, 29, 'Misro', 'main', 1),
  (58, 29, 'pisang', 'fruit', 5),
  (59, 30, 'Pisang kukus', 'main', 3),
  (60, 30, 'nanas madu', 'fruit', 5),
  (61, 31, 'Klepon', 'main', 7),
  (62, 31, 'salak', 'fruit', 5),
  (63, 32, 'Onde onde', 'main', 1),
  (64, 32, 'jambu kristal', 'fruit', 5),
  (65, 33, 'Roti bakar', 'main', 6),
  (66, 33, 'Pepaya', 'fruit', 5),
  (67, 34, 'Gabin tape', 'main', 6),
  (68, 34, 'pir', 'fruit', 5),
  (69, 35, 'Telor rebus', 'main', 3),
  (70, 35, 'jeruk', 'fruit', 5),
  (71, 36, 'kue sus', 'main', 6),
  (72, 36, 'strawberry', 'fruit', 5),
  (73, 37, 'Bakwan sayur', 'main', 1),
  (74, 37, 'melon', 'fruit', 5),
  (75, 38, 'Biji salak', 'main', 8),
  (76, 38, 'pisang', 'fruit', 5),
  (77, 39, 'tahu bakso', 'main', 1),
  (78, 39, 'sawo', 'fruit', 5),
  (79, 40, 'Serabi', 'main', 7),
  (80, 40, 'jambu air', 'fruit', 5),
  (81, 41, 'kue lumpur', 'main', 6),
  (82, 41, 'nanas madu', 'fruit', 5),
  (83, 42, 'sosis solo', 'main', 1),
  (84, 42, 'bengkoang', 'fruit', 5);

INSERT INTO schedules (week_id, schedule_date, day_of_week, menu_id, is_holiday, notes) VALUES
  (1, '2026-09-01', 2, 1, 0, 'outing'),
  (1, '2026-09-02', 3, 2, 0, NULL),
  (1, '2026-09-03', 4, 3, 0, NULL),
  (1, '2026-09-04', 5, 4, 0, NULL),
  (2, '2026-09-07', 1, 5, 0, NULL),
  (2, '2026-09-08', 2, 6, 0, NULL),
  (2, '2026-09-09', 3, 7, 0, NULL),
  (2, '2026-09-10', 4, 8, 0, NULL),
  (2, '2026-09-11', 5, 9, 0, NULL),
  (3, '2026-09-14', 1, 10, 0, NULL),
  (3, '2026-09-15', 2, 11, 0, NULL),
  (3, '2026-09-16', 3, 12, 0, NULL),
  (3, '2026-09-17', 4, 13, 0, NULL),
  (3, '2026-09-18', 5, 14, 0, NULL),
  (4, '2026-09-21', 1, 15, 0, NULL),
  (4, '2026-09-22', 2, 16, 0, NULL),
  (4, '2026-09-23', 3, 17, 0, NULL),
  (4, '2026-09-24', 4, 18, 0, NULL),
  (4, '2026-09-25', 5, 19, 0, NULL),
  (5, '2026-09-28', 1, 20, 0, NULL),
  (5, '2026-09-29', 2, 21, 0, NULL),
  (5, '2026-09-30', 3, 22, 0, NULL),
  (6, '2026-08-03', 1, 23, 0, NULL),
  (6, '2026-08-04', 2, 24, 0, NULL),
  (6, '2026-08-05', 3, 25, 0, NULL),
  (6, '2026-08-06', 4, 26, 0, NULL),
  (6, '2026-08-07', 5, 27, 0, NULL),
  (7, '2026-08-10', 1, 28, 0, NULL),
  (7, '2026-08-11', 2, 29, 0, NULL),
  (7, '2026-08-12', 3, 30, 0, NULL),
  (7, '2026-08-13', 4, 31, 0, NULL),
  (7, '2026-08-14', 5, 32, 0, NULL),
  (8, '2026-08-17', 1, NULL, 1, 'Libur'),
  (8, '2026-08-18', 2, 33, 0, NULL),
  (8, '2026-08-19', 3, 34, 0, NULL),
  (8, '2026-08-20', 4, 35, 0, NULL),
  (8, '2026-08-21', 5, 36, 0, NULL),
  (9, '2026-08-24', 1, 37, 0, NULL),
  (9, '2026-08-25', 2, 38, 0, NULL),
  (9, '2026-08-26', 3, 39, 0, NULL),
  (9, '2026-08-27', 4, 40, 0, NULL),
  (9, '2026-08-28', 5, 41, 0, NULL),
  (10, '2026-08-31', 1, 42, 0, NULL);

INSERT INTO holidays (date, name, description) VALUES
  ('2026-08-17', 'Hari Kemerdekaan RI', 'Libur nasional');

INSERT INTO settings (key, value) VALUES
  ('school_name', 'SD Contoh Jakarta'),
  ('academic_year', '2026/2027'),
  ('active_month', '2026-09');

INSERT INTO users (id, username, password_hash, full_name, role, is_active) VALUES
  (1, 'admin', 'pbkdf2$100000$MVnBBic0zWCMkOe91S3WsQ$NgveLR995dhg27y2pZK_JZaQ83pyMLF-q-GRWbL5FlE', 'Bu Guru Sari', 'admin', 1),
  (2, 'sari', 'pbkdf2$100000$nmJxUcpcdmjZSfSPzDh0Eg$Z7l_IR5ZHWefPrWeoU5c5mQeEneTFaBuSDTeVJVorc4', 'Ibu Sari', 'parent', 1),
  (3, 'budi', 'pbkdf2$100000$nmJxUcpcdmjZSfSPzDh0Eg$Z7l_IR5ZHWefPrWeoU5c5mQeEneTFaBuSDTeVJVorc4', 'Pak Budi', 'parent', 1),
  (4, 'dewi', 'pbkdf2$100000$nmJxUcpcdmjZSfSPzDh0Eg$Z7l_IR5ZHWefPrWeoU5c5mQeEneTFaBuSDTeVJVorc4', 'Ibu Dewi', 'parent', 1);

INSERT INTO parents (user_id, parent_name, student_name, student_class, relationship, phone) VALUES
  (2, 'Sari Wulandari', 'Aisyah Sari', '1A', 'ibu', '081234567890'),
  (3, 'Budi Santoso', 'Bagas Budi', '1A', 'ayah', '081234567891'),
  (4, 'Dewi Lestari', 'Citra Dewi', '1B', 'ibu', '081234567892');
