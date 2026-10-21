# Push Notification (PWA) & Notifikasi WhatsApp

Dokumen ini menjelaskan dua jalur notifikasi Pizza Snack Play: **Push
Notification PWA** (tanpa biaya, lewat service worker) dan **Notifikasi
WhatsApp** lewat `sikuwa` — broadcast, pengingat piket, dan konfirmasi klaim.

---

## 0. Yang perlu disiapkan

| Kebutuhan | Untuk fitur | Wajib? |
|-----------|-------------|--------|
| Pasangan kunci VAPID | Push Notification | Ya |
| `VAPID_SUBJECT` (mis. `mailto:admin@sekolah.id`) | Push Notification | Ya |
| HTTPS (production) / `localhost` (dev) | Push Notification | Ya |
| `WHATSAPP_PROVIDER` (mis. `OpenWA`, `Fonnte`) | Notifikasi WhatsApp | Tidak |
| Token gateway (`WHATSAPP_TOKEN_<Provider>`) | Notifikasi WhatsApp | Tidak |
| URL gateway self-hosted (bila ada) | Notifikasi WhatsApp | Tidak |
| Nomor HP orang tua terisi & akunnya aktif | Notifikasi WhatsApp | Ya (bila fitur dipakai) |
| Migrasi `0009_notification_tables.sql` diterapkan | Keduanya | Ya |

Langkah singkat:

```bash
# 1. Terapkan tabel baru
bun run db:migrate:local     # atau: bun run db:migrate  (production)

# 2. Buat kunci VAPID
bun run vapid:generate

# 3. Simpan sebagai Worker Secret (production)
bunx wrangler secret put VAPID_PUBLIC_KEY
bunx wrangler secret put VAPID_PRIVATE_KEY
bunx wrangler secret put VAPID_SUBJECT
bunx wrangler secret put WHATSAPP_PROVIDER        # mis. OpenWA
bunx wrangler secret put WHATSAPP_TOKEN_OpenWA
bunx wrangler secret put WHATSAPP_URL             # bila gateway self-hosted
bunx wrangler secret put WHATSAPP_SESSION         # id session yang tersambung
```

Notifikasi WhatsApp **opsional**: selama `WHATSAPP_PROVIDER`/token kosong,
aplikasi berjalan normal dan tombol kirim di dashboard dimatikan dengan
keterangan alasannya.

Untuk dev lokal, nilai VAPID dan WhatsApp ditaruh di `.dev.vars` (berkas ini
tidak di-commit).

---

## 1. Push Notification (PWA)

### Apa itu?

Push notification memungkinkan aplikasi mengirim pemberitahuan langsung ke
perangkat user — bahkan saat browser sedang tidak aktif. Di iOS (16.4+) dan
Android, notifikasi ini muncul seperti notifikasi aplikasi native.

### Arsitektur

```
┌─────────────┐     subscribe      ┌─────────────┐
│   Browser   │ ─────────────────► │   Backend   │
│  (PWA)      │  (endpoint, keys)  │  (Hono/D1)  │
└──────┬──────┘                    └──────┬──────┘
       ▲                                  │
       │         kirim push               │
       └──────────────────────────────────┘
                    (VAPID + Web Push Protocol)
```

### Alur Kerja

#### A. Subscribe (Frontend → Backend)

1. **User klik "Aktifkan"** di kartu Notifikasi Push (Profil/Dashboard).
2. Browser minta izin notifikasi lewat `Notification.requestPermission()`.
3. Bila user mengizinkan (`granted`), frontend ambil **VAPID public key**
   dari endpoint `GET /api/notifications/push/vapid-key`.
4. Frontend subscribe ke push service browser (FCM untuk Chrome, autopush
   untuk Firefox, APNs untuk Safari) lewat `PushManager.subscribe()`:
   ```js
   registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: vapidPublicKey,
   });
   ```
5. Browser mengembalikan `PushSubscription` yang berisi:
   - `endpoint` — URL unik per device/browser
   - `keys.p256dh` — public key untuk enkripsi
   - `keys.auth` — shared secret 16-byte
6. Frontend kirim ketiga data tersebut ke backend:
   `POST /api/notifications/push/subscribe`
7. Backend simpan ke tabel `push_subscriptions` di D1.
   - Bila user sudah login, `user_id` dan `class_name` ikut tersimpan.
   - Bila belum login, keduanya `NULL` — nanti di-update saat user login.

#### B. Kirim Push (Backend → Browser)

1. Admin/Korlas klik "Kirim Push Notification" dari Dashboard.
2. Backend ambil semua subscription dari D1 (bisa difilter per kelas).
3. Untuk tiap subscription, backend membangun request HTTP yang sudah
   di-sign dan di-encrypt menggunakan **VAPID private key**:
   ```ts
   const { endpoint, headers, body } = await buildPushHTTPRequest({
     privateJWK: JSON.parse(env.VAPID_PRIVATE_KEY),
     subscription: { endpoint, keys: { p256dh, auth } },
     message: { payload: { title, body, icon, url }, adminContact },
   });
   ```
4. Request dikirim ke `endpoint` (push service milik Google/Mozilla/Apple).
5. Push service meneruskan ke device user.
6. **Service Worker** di browser menerima event `push` dan menampilkan
   notifikasi:
   ```js
   self.addEventListener("push", (event) => {
     const data = event.data.json();
     self.registration.showNotification(data.title, {
       body: data.body,
       icon: data.icon,
       data: { url: data.url },
     });
   });
   ```
7. Saat user klik notifikasi, service worker membuka aplikasi:
   ```js
   self.addEventListener("notificationclick", (event) => {
     const url = event.notification.data?.url || "/";
     event.waitUntil(self.clients.openWindow(url));
   });
   ```

#### C. Unsubscribe

- User klik "Nonaktifkan" di kartu Notifikasi Push.
- Frontend panggil `pushSubscription.unsubscribe()` di browser.
- Frontend juga kirim `POST /api/notifications/push/unsubscribe` dengan
  endpoint-nya, supaya backend menghapus record dari D1.

### Keamanan

- **VAPID** (Voluntary Application Server Identification) memastikan hanya
  server yang sah yang bisa kirim push ke subscriber.
- Private key VAPID disimpan sebagai **wrangler secret** — tidak pernah
  terekspos ke klien.
- Payload push di-encrypt end-to-end menggunakan ECDH P-256; push service
  (Google/Mozilla/Apple) tidak bisa membaca isi pesan.

### Konfigurasi VAPID

1. Generate pasangan key:
   ```bash
   npx @pushforge/builder vapid
   ```
2. Simpan ke wrangler secrets:
   ```bash
   wrangler secret put VAPID_PUBLIC_KEY
   wrangler secret put VAPID_PRIVATE_KEY
   wrangler secret put VAPID_SUBJECT   # mailto:admin@sekolah.id
   ```

---

## 2. Notifikasi WhatsApp (`sikuwa`)

### Apa itu?

Modul `src/api/whatsapp/` mengirim tiga jenis pesan, semuanya lewat satu
transport: **`sikuwa`**, SDK multi-gateway WhatsApp (Fonnte, OpenWA, ApiMe,
Evolution API, Wuzapi, Wwebjs, Waxum). Mengganti gateway cukup mengganti nilai
environment — kode pemanggil tidak berubah.

| Jenis | Pemicu | Penerima | Isi |
|-------|--------|----------|-----|
| **Broadcast** | admin/korlas menulis bebas | orang tua aktif, semua kelas atau satu kelas | ditulis pengirim |
| **Pengingat piket** | admin/korlas memilih tanggal (bawaan: besok) | wali murid yang jadi petugas pada tanggal itu | disusun server: tanggal, kelas, menu, catatan |
| **Konfirmasi klaim** | orang tua mengambil satu tanggal | orang tua yang mengambil | disusun server + cara membatalkan |

### Arsitektur

```
Admin/Korlas ──► POST /api/whatsapp/{broadcast,petugas}
                        │
                        ▼
                whatsappService ──► target dari D1 (parents/students/schedules)
                        │
                        ▼
              sikuwa Client ──► gateway (OpenWA/Fonnte/…) ──► WhatsApp
                        │
                        ▼
              whatsapp_broadcasts (riwayat)
```

Satu request HTTP keluar **per penerima**, bukan satu batch. Alasannya dua:
satu nomor yang salah tidak menggagalkan seluruh kelas (beberapa gateway
menolak batch utuh bila ada satu tujuan tidak sah), dan jumlah sukses/gagal
bisa dilaporkan apa adanya.

### Konfigurasi

```bash
wrangler secret put WHATSAPP_PROVIDER        # OpenWA
wrangler secret put WHATSAPP_TOKEN_OpenWA    # token gateway
wrangler secret put WHATSAPP_URL             # https://wa.sekolah.id (self-hosted)
wrangler secret put WHATSAPP_SESSION         # id session yang sudah tersambung
```

| Kunci | Wajib | Keterangan |
|-------|-------|------------|
| `WHATSAPP_PROVIDER` | ya | Nama gateway, salah satu dari daftar di atas (huruf besar-kecil bebas) |
| `WHATSAPP_TOKEN_<Provider>` | ya | Token gateway; `WHATSAPP_TOKEN` dipakai bila hanya ada satu gateway |
| `WHATSAPP_URL` / `WHATSAPP_URL_<Provider>` | self-hosted | Base URL instance |
| `WHATSAPP_SESSION` / `WHATSAPP_SESSION_<Provider>` | tergantung gateway | Id session/instance |
| `WHATSAPP_PACING_CYCLE` | tidak | Jeda antar pesan, mis. `0,30` (bawaan: mati) |
| `WHATSAPP_TYPING` | tidak | Indikator "sedang mengetik" (bawaan: mati) |
| `WHATSAPP_RETRIES` | tidak | Percobaan ulang saat 429/503 dengan `Retry-After` |
| `WHATSAPP_CHECK_NUMBERS` | tidak | `1` = saring nomor yang tidak terdaftar sebelum kirim |

**Kunci lama tidak dipakai lagi.** `WHATSAPP_GATEWAY_URL` dan
`WHATSAPP_GATEWAY_KEY` digantikan pasangan provider + token di atas; keduanya
hanya dibaca untuk memberi pesan kesalahan yang menyebutkan penggantinya.

### Alur pengiriman

1. Controller memeriksa wewenang (korlas terkunci di kelasnya sendiri) dan
   bentuk body.
2. `whatsappService` membangun `Client` `sikuwa` dari binding Worker —
   **per request**, bukan sekali di modul, supaya tidak ada konfigurasi yang
   menempel di isolate.
3. Tujuan diambil dari D1, lalu disaring `collectRecipients()`:
   nomor kosong/tidak sah dibuang, dan nomor yang sama dalam penulisan berbeda
   (`0812…` vs `+62 812…`) dihitung satu orang.
4. Baris riwayat disimpan dengan status `sending`.
5. `deliver()` mengirim satu per satu; kegagalan dicatat lalu dilanjutkan.
6. Riwayat diperbarui: `sent_count`, `status` (`completed`/`failed`), dan
   `error_message` berisi kegagalan pertama.

### Konfirmasi klaim berjalan di latar belakang

`POST /api/claims` mengembalikan jawaban lebih dulu, lalu konfirmasi WhatsApp
dikirim lewat `waitUntil`. `confirmClaimQuietly()` tidak pernah melempar:
klaim yang sudah tersimpan tidak boleh gagal hanya karena gateway mati atau
nomor wali kosong. Bila WhatsApp belum dikonfigurasi, langkah ini dilewati
tanpa request apa pun.

### Modul

| Berkas | Isi |
|--------|-----|
| `src/api/whatsapp/client.ts` | `Client` sikuwa dari binding Worker + `whatsappStatus()` |
| `src/api/whatsapp/templates.ts` | isi pesan (murni, diuji tanpa database) |
| `src/api/whatsapp/recipients.ts` | saring nomor tidak sah & duplikat |
| `src/api/whatsapp/delivery.ts` | kirim beruntun dengan kegagalan terisolasi |
| `src/api/whatsapp/repository.ts` | tujuan kirim + riwayat `whatsapp_broadcasts` |
| `src/api/whatsapp/service.ts` | orkestrasi ketiga jenis pesan |
| `src/api/whatsapp/controller.ts` | validasi body & wewenang |
| `src/api/whatsapp/route.ts` | rute `/api/whatsapp/*` |

### Pembatasan Wewenang

| Role   | Broadcast | Pengingat piket | Pesan uji |
|--------|-----------|-----------------|-----------|
| Admin  | Semua kelas atau kelas tertentu | Semua kelas atau kelas tertentu | ya |
| Korlas | Hanya kelasnya sendiri | Hanya kelasnya sendiri | tidak |
| Parent | Tidak punya akses | Tidak punya akses | tidak |

Validasi ini ditegakkan di **controller**, bukan hanya di UI.

---

## 3. Skema Database

### `push_subscriptions`

| Kolom      | Tipe    | Keterangan                          |
|------------|---------|-------------------------------------|
| `id`       | INTEGER | PK auto-increment                   |
| `endpoint` | TEXT    | URL unik push service               |
| `p256dh`   | TEXT    | Public key enkripsi                 |
| `auth`     | TEXT    | Shared secret                       |
| `user_id`  | INTEGER | FK ke `users` (nullable)            |
| `class_name`| TEXT   | Kelas user (nullable)               |
| `created_at`| TEXT   | Waktu subscribe                      |

### `whatsapp_broadcasts`

| Kolom          | Tipe    | Keterangan                          |
|----------------|---------|-------------------------------------|
| `id`           | INTEGER | PK auto-increment                   |
| `sender_id`    | INTEGER | FK ke `users` (yang mengirim)       |
| `message`      | TEXT    | Isi pesan                           |
| `target_scope` | TEXT    | `all`, nama kelas, atau `petugas:<tanggal>[:<kelas>]` |
| `target_count` | INTEGER | Jumlah penerima                     |
| `sent_count`   | INTEGER | Jumlah yang berhasil terkirim       |
| `status`       | TEXT    | `pending`/`sending`/`completed`/`failed` |
| `error_message`| TEXT    | Error log (bila ada)                |
| `created_at`   | TEXT    | Waktu broadcast                     |

---

## 4. Endpoint API

| Method | Endpoint                                | Akses        | Keterangan                     |
|--------|-----------------------------------------|--------------|--------------------------------|
| POST   | `/api/notifications/push/subscribe`     | Terbuka      | Simpan push subscription       |
| POST   | `/api/notifications/push/unsubscribe`   | Terbuka      | Hapus push subscription        |
| GET    | `/api/notifications/push/vapid-key`     | Terbuka      | Ambil VAPID public key         |
| POST   | `/api/notifications/push/link`          | Login        | Kaitkan subscription ke akun   |
| POST   | `/api/notifications/push/send`          | Admin/Korlas | Kirim push ke subscriber       |
| GET    | `/api/whatsapp/status`                  | Admin/Korlas | Kesiapan gateway (tanpa token) |
| POST   | `/api/whatsapp/test`                    | Admin        | Kirim satu pesan uji           |
| POST   | `/api/whatsapp/broadcast`               | Admin/Korlas | Broadcast ke orang tua         |
| POST   | `/api/whatsapp/petugas`                 | Admin/Korlas | Pengingat piket satu tanggal   |
| GET    | `/api/whatsapp/history`                 | Admin/Korlas | Riwayat pengiriman (50 terakhir)|

---

## 5. Frontend

### Komponen

| Komponen                | Lokasi                                              | Fungsi                          |
|-------------------------|-----------------------------------------------------|---------------------------------|
| `PushNotificationCard`  | `src/components/notifications/PushNotificationCard.tsx` | Toggle subscribe/unsubscribe    |
| `WhatsAppBroadcastCard` | `src/components/notifications/WhatsAppBroadcastCard.tsx`| Broadcast, pengingat piket, status gateway, riwayat |
| `SendPushModal`         | `src/components/notifications/SendPushModal.tsx`        | Modal kirim push (bila dipakai) |
| `usePushNotification`   | `src/hooks/usePushNotification.ts`                      | Hook manajemen subscription     |

### Penempatan UI

- **Dashboard** (`/dashboard`): `PushNotificationCard` + `WhatsAppBroadcastCard`
  — untuk admin & korlas.
- **Profil** (`/profil`): `PushNotificationCard` — untuk semua user termasuk
  orang tua, agar mereka juga bisa aktifkan notifikasi.

---

## 6. Catatan Operasional

- **Push subscription bisa expired** — bila user tidak membuka aplikasi dalam
  waktu lama, push service (terutama FCM) bisa menolak. Service worker sudah
  menangani status `410 Gone` dan `404` dengan menghapus subscription dari D1.
- **WhatsApp bergantung konfigurasi gateway** — bila `WHATSAPP_PROVIDER` atau
  tokennya belum diisi, `/api/whatsapp/status` menjawab `configured: false`
  beserta alasannya, dan UI mematikan tombol kirim. Endpoint kirim menjawab
  `500` dengan pesan "Gateway WhatsApp belum dikonfigurasi".
- **Kegagalan per nomor tidak membatalkan sisanya** — pengiriman berjalan satu
  per satu, jadi satu nomor yang ditolak gateway hanya menggagalkan dirinya
  sendiri. Kegagalan pertama disimpan di `error_message`.
- **Nomor HP harus valid** — gateway umumnya menerima format `628xx...`.
  Validasi format di frontend (menu Profil) direkomendasikan.
- **Batch size** — push dan WhatsApp sama-sama dikirim berurutan. Untuk
  ribuan penerima, pertimbangkan Cloudflare Queues; mengirim WhatsApp secara
  paralel justru memperbesar risiko diblokir gateway.
