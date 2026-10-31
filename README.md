# Portfolio Safta Sabrina

Website portfolio statis (HTML + CSS + JavaScript biasa, tanpa framework dan tanpa build).

## Cara membuka
- Cepat: klik dua kali `index.html` (terbuka di browser).
- Disarankan di VS Code: pasang ekstensi **Live Server**, klik kanan `index.html`, lalu **Open with Live Server**. Halaman akan refresh otomatis setiap kamu simpan perubahan.
- Font dimuat dari Google Fonts, jadi perlu internet agar huruf tampil benar.

## Struktur
```
index.html          isi halaman: teks, section, link, alt gambar
css/style.css       semua tampilan dan animasi
js/main.js          semua perilaku: tema, scroll reveal, mode swipe, filter, lightbox
assets/images/      foto profil dan screenshot project/sertifikat
```

## Yang paling sering diubah
| Mau ubah | Buka | Cari |
|---|---|---|
| Teks, nama, deskripsi project | `index.html` | teks yang ingin diganti |
| Email, WhatsApp, LinkedIn | `index.html` | bagian `id="contact"` |
| Ganti foto atau screenshot | `assets/images/` | timpa file dengan nama yang sama (format JPG) |
| Warna | `css/style.css` | blok `:root` paling atas (variabel `--yellow`, `--pink`, `--band-red`, dst.). Mode malam ada di bawahnya |
| Kecepatan atau gaya animasi | `css/style.css` | bagian `MOTION LAYER` dan `Round 4: swipe mode` |
| Urutan section di mode swipe | `js/main.js` | array `slideIds` dan `slideNames` |
| Kapan elemen muncul saat scroll | `js/main.js` | daftar `R('.selector', ...)` di bagian "scroll reveal" |
| Matikan marquee kuning | `index.html` | hapus `<div class="marquee" ...>` |

## Tips
- Semua animasi otomatis mati untuk pengunjung yang mengaktifkan "reduce motion" di perangkatnya.
- Ukuran gambar sebaiknya dijaga di bawah sekitar 100 KB per file agar halaman tetap cepat.
- Mau online gratis? Unggah seluruh folder ini ke GitHub Pages, Netlify, atau Vercel. Tidak perlu pengaturan khusus.
