import { FIREBASE_CONFIG, RADIUS_DEFAULT } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---------- util ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const tgl = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const jam = ts => ts && ts.toDate ? ts.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
const urut = (a, b) => String(a).localeCompare(String(b), 'id');
const normKelas = s => String(s || '').trim().toUpperCase();
function toast(t) {
  $('#toastBox').innerHTML = '';
  const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.textContent = t;
  $('#toastBox').appendChild(e); setTimeout(() => e.remove(), 2800);
}
function haversine(a, b, c, d) {
  const R = 6371000, t = x => x * Math.PI / 180, dLat = t(c - a), dLng = t(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function getPos() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('Perangkat ini tidak mendukung GPS.'));
    navigator.geolocation.getCurrentPosition(res, err => rej(new Error(
      err.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk browser ini.' :
      err.code === 2 ? 'Lokasi tidak ditemukan. Nyalakan GPS lalu coba lagi.' :
      'Waktu habis saat mencari lokasi. Coba lagi di tempat terbuka.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}
function pesanAuth(code) {
  return ({
    'auth/invalid-credential': 'Email atau kata sandi salah.',
    'auth/wrong-password': 'Email atau kata sandi salah.',
    'auth/user-not-found': 'Email atau kata sandi salah.',
    'auth/invalid-email': 'Format email tidak benar.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    'auth/network-request-failed': 'Tidak ada koneksi internet.'
  })[code] || 'Gagal masuk. Coba lagi.';
}

/* ---------- firebase ---------- */
const BELUM = Object.values(FIREBASE_CONFIG).some(v => String(v).startsWith('ISI'));
if (BELUM) {
  $('#setupWarn').classList.remove('hide');
  $('#vLogin').classList.add('hide');
}
const app = BELUM ? null : initializeApp(FIREBASE_CONFIG);
const auth = app && getAuth(app);
const db = app && getFirestore(app);

let me = null, sekolah = null, murid = [], gurus = [];

/* ---------- login / keluar ---------- */
$('#fLogin').addEventListener('submit', async e => {
  e.preventDefault();
  if (BELUM) return;
  const b = $('#btnLogin'); b.disabled = true; b.textContent = 'Masuk…'; $('#lErr').textContent = '';
  try { await signInWithEmailAndPassword(auth, $('#lEmail').value.trim(), $('#lPass').value); }
  catch (err) { $('#lErr').textContent = pesanAuth(err.code); }
  b.disabled = false; b.textContent = 'Masuk';
});
document.querySelectorAll('[data-keluar]').forEach(b => b.addEventListener('click', () => auth && signOut(auth)));

function tampil(v) {
  ['vLogin', 'vNoReg', 'vApp'].forEach(id => $('#' + id).classList.toggle('hide', id !== v));
}

if (auth) onAuthStateChanged(auth, async user => {
  if (!user) { me = null; tampil('vLogin'); return; }
  const email = (user.email || '').toLowerCase();
  try {
    const s = await getDoc(doc(db, 'guru', email));
    if (!s.exists()) throw { code: 'permission-denied' };
    me = { ...s.data(), email, uid: user.uid, kelas: s.data().kelas || [] };
    const sk = await getDoc(doc(db, 'sekolah', 'utama'));
    sekolah = sk.exists() ? sk.data() : null;
    bangunApp();
  } catch (err) {
    me = null;
    $('#noRegMsg').textContent = err.code === 'permission-denied'
      ? 'Akun ini belum didaftarkan oleh admin sekolah, atau aturan keamanan belum dipasang. Hubungi admin.'
      : 'Gagal memuat data (' + (err.code || err.message) + '). Periksa koneksi internet lalu muat ulang.';
    tampil('vNoReg');
  }
});

/* ---------- kerangka + tab ---------- */
const IKON = {
  guru: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  murid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 14.5c3 0 5 1.8 5 4.5"/></svg>',
  rekap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  atur: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
};
const TAB_GURU = [['guru', 'Absen Guru'], ['murid', 'Absen Murid']];
const TAB_ADMIN = [['rekap', 'Rekap'], ['atur', 'Atur']];
let tabAktif = '';
function bangunApp() {
  tampil('vApp');
  $('#hNama').textContent = me.nama || me.email;
  $('#hInfo').textContent = (sekolah && sekolah.nama ? sekolah.nama + ' · ' : '') + (me.role === 'admin' ? 'Admin' : 'Guru' + (me.kelas.length ? ' · Kelas ' + me.kelas.join(', ') : ''));
  const tabs = me.role === 'admin' ? TAB_ADMIN : TAB_GURU;
  $('#tabs').innerHTML = tabs.map(([k, n]) => `<button role="tab" data-t="${k}" aria-selected="false">${IKON[k]}<span>${n}</span></button>`).join('');
  const minta = new URLSearchParams(location.search).get('tab');
  bukaTab(tabs.some(t => t[0] === minta) ? minta : tabs[0][0]);
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) bukaTab(b.dataset.t); });
async function bukaTab(k) {
  tabAktif = k;
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === k));
  ['Guru', 'Murid', 'Rekap', 'Atur'].forEach(n => $('#p' + n).classList.toggle('hide', n.toLowerCase() !== k));
  try {
    if (k === 'guru') await muatGuru();
    if (k === 'murid') await muatMurid();
    if (k === 'rekap') await muatRekap();
    if (k === 'atur') await muatAtur();
  } catch (err) { toast('Gagal memuat: ' + (err.code || err.message)); }
}

/* =========================================================
   ABSEN GURU
   ========================================================= */
let foto = null, pos = null, jarak = null, logsHariIni = [];
const radius = () => (sekolah && sekolah.radius) || RADIUS_DEFAULT;

async function muatGuru() {
  $('#gTgl').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const s = await getDocs(query(collection(db, 'absenGuru'), where('email', '==', me.email), where('tanggal', '==', tgl())));
  logsHariIni = s.docs.map(d => d.data());
  const m = logsHariIni.find(l => l.tipe === 'masuk'), p = logsHariIni.find(l => l.tipe === 'pulang');
  $('#gStatus').innerHTML = `<div class="mini"><span>Masuk</span><b>${m ? jam(m.waktu) : 'Belum'}</b></div><div class="mini"><span>Pulang</span><b>${p ? jam(p.waktu) : 'Belum'}</b></div>`;
  tampilLokasi(); updateTombolGuru();
}
function tampilLokasi() {
  const b = $('#locBox');
  if (!sekolah || sekolah.lat == null) { b.className = 'notice warn'; b.innerHTML = '<div>Titik sekolah belum diatur<small>Minta admin mengisi lokasi sekolah di menu Atur.</small></div>'; return; }
  if (!pos) { b.className = 'notice idle'; b.innerHTML = '<div>Lokasi belum dicek<small>Ketuk "Cek lokasi saya".</small></div>'; return; }
  const d = Math.round(jarak), acc = Math.round(pos.coords.accuracy);
  if (d <= radius()) { b.className = 'notice ok'; b.innerHTML = `<div>Di dalam area sekolah<small>Jarak ${d} m (batas ${radius()} m). Akurasi GPS ±${acc} m.</small></div>`; }
  else { b.className = 'notice bad'; b.innerHTML = `<div>Di luar area sekolah<small>Jarak ${d} m, batas ${radius()} m. Mendekatlah ke sekolah lalu cek ulang.</small></div>`; }
}
function updateTombolGuru() {
  const ok = foto && pos && sekolah && sekolah.lat != null && jarak <= radius();
  const m = logsHariIni.some(l => l.tipe === 'masuk'), p = logsHariIni.some(l => l.tipe === 'pulang');
  $('#btnMasuk').disabled = !ok || m;
  $('#btnPulang').disabled = !ok || !m || p;
  $('#gHint').textContent = p ? 'Anda sudah absen masuk dan pulang hari ini.' :
    m ? 'Sudah absen masuk. Untuk absen pulang, ambil foto dan cek lokasi lagi.' :
    'Tombol aktif setelah foto diambil dan lokasi berada dalam radius sekolah.';
}
$('#gFoto').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const M = 320, sc = Math.min(1, M / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    const cap = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const h = Math.round(c.width / 10);
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, c.height - h, c.width, h);
    x.fillStyle = '#fff'; x.font = 'bold ' + Math.max(12, Math.round(c.width / 22)) + 'px sans-serif'; x.fillText(cap, 8, c.height - Math.round(h / 3));
    foto = c.toDataURL('image/jpeg', 0.6); URL.revokeObjectURL(url);
    const b = $('#photoBox'); b.classList.add('has'); b.innerHTML = `<img src="${foto}" alt="Foto selfie">`;
    updateTombolGuru();
  };
  img.onerror = () => toast('Foto tidak bisa dibaca. Coba ambil ulang.');
  img.src = url; e.target.value = '';
});
$('#btnLoc').addEventListener('click', async () => {
  const b = $('#btnLoc'); b.disabled = true; b.textContent = 'Mencari lokasi…';
  try {
    pos = await getPos();
    jarak = sekolah && sekolah.lat != null ? haversine(pos.coords.latitude, pos.coords.longitude, sekolah.lat, sekolah.lng) : null;
  } catch (err) {
    pos = null; jarak = null;
    const bx = $('#locBox'); bx.className = 'notice bad'; bx.innerHTML = `<div>Lokasi gagal<small>${esc(err.message)}</small></div>`;
    b.disabled = false; b.textContent = 'Cek lokasi saya'; updateTombolGuru(); return;
  }
  b.disabled = false; b.textContent = 'Cek ulang lokasi'; tampilLokasi(); updateTombolGuru();
});
async function kirimAbsen(tipe) {
  if (!foto || !pos) return;
  $('#btnMasuk').disabled = $('#btnPulang').disabled = true;
  const tanggal = tgl(), id = `${tanggal}_${me.email}_${tipe}`;
  try {
    const b = writeBatch(db);
    b.set(doc(db, 'absenGuru', id), {
      tanggal, tipe, guruId: me.uid, email: me.email, nama: me.nama || me.email,
      waktu: serverTimestamp(), lat: pos.coords.latitude, lng: pos.coords.longitude,
      jarak: Math.round(jarak), akurasi: Math.round(pos.coords.accuracy)
    });
    b.set(doc(db, 'foto', id), { email: me.email, tanggal, data: foto });
    await b.commit();
    toast(tipe === 'masuk' ? 'Absen masuk tersimpan' : 'Absen pulang tersimpan');
    foto = null; pos = null; jarak = null;
    $('#photoBox').classList.remove('has'); $('#photoBox').innerHTML = '<span>Ketuk untuk<br>ambil foto</span>';
    await muatGuru();
  } catch (err) {
    toast(err.code === 'permission-denied' ? 'Absen ditolak: di luar area sekolah atau sudah absen.' : 'Gagal menyimpan: ' + (err.code || err.message));
    updateTombolGuru();
  }
}
$('#btnMasuk').addEventListener('click', () => kirimAbsen('masuk'));
$('#btnPulang').addEventListener('click', () => kirimAbsen('pulang'));

/* =========================================================
   ABSEN MURID
   ========================================================= */
let statusMap = {}, muridKelas = [];
async function muatDataMurid() {
  const s = await getDocs(collection(db, 'murid'));
  murid = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => urut(a.nama, b.nama));
}
const daftarKelas = () => [...new Set(murid.map(m => m.kelas))].sort(urut);

async function muatMurid() {
  await muatDataMurid();
  const boleh = me.role === 'admin' ? daftarKelas() : me.kelas.slice().sort(urut);
  const sel = $('#mKelas'), lama = sel.value;
  sel.innerHTML = boleh.length ? boleh.map(k => `<option ${k === lama ? 'selected' : ''}>${esc(k)}</option>`).join('') : '<option value="">Belum ada kelas</option>';
  if (!$('#mTgl').value) $('#mTgl').value = tgl();
  await muatKelas();
}
async function muatKelas() {
  const kelas = $('#mKelas').value, tanggal = $('#mTgl').value;
  muridKelas = murid.filter(m => m.kelas === kelas);
  statusMap = {};
  if (kelas && tanggal) {
    const s = await getDoc(doc(db, 'absenMurid', `${tanggal}_${kelas}`));
    if (s.exists()) statusMap = { ...(s.data().status || {}) };
  }
  gambarMurid();
}
function gambarMurid() {
  const cari = $('#mCari').value.trim().toLowerCase();
  const list = muridKelas.filter(m => !cari || m.nama.toLowerCase().includes(cari));
  $('#mList').innerHTML = list.length ? list.map(m => `<div class="row-item murid"><div class="grow"><b>${esc(m.nama)}</b></div>
    <div class="seg" data-id="${m.id}">${['H', 'I', 'S', 'A'].map(c => `<button type="button" data-s="${c}" class="${statusMap[m.id] === c ? 'on' : ''}" aria-label="${{ H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpa' }[c]}">${c}</button>`).join('')}</div></div>`).join('')
    : '<p class="muted" style="text-align:center;padding:16px">Tidak ada murid di kelas ini.</p>';
  const belum = muridKelas.filter(m => !statusMap[m.id]).length;
  $('#mInfo').textContent = muridKelas.length ? (belum ? `${belum} dari ${muridKelas.length} murid belum ditandai.` : `Semua ${muridKelas.length} murid sudah ditandai.`) : '';
}
$('#mList').addEventListener('click', e => {
  const b = e.target.closest('.seg button'); if (!b) return;
  statusMap[b.parentElement.dataset.id] = b.dataset.s; gambarMurid();
});
$('#mSemua').addEventListener('click', () => {
  muridKelas.forEach(m => { if (!statusMap[m.id]) statusMap[m.id] = 'H'; });
  gambarMurid(); toast('Yang belum ditandai jadi Hadir. Ubah yang tidak masuk, lalu simpan.');
});
$('#mKelas').addEventListener('change', () => muatKelas().catch(e => toast('Gagal memuat: ' + (e.code || e.message))));
$('#mTgl').addEventListener('change', () => muatKelas().catch(e => toast('Gagal memuat: ' + (e.code || e.message))));
$('#mCari').addEventListener('input', gambarMurid);
$('#mSimpan').addEventListener('click', async () => {
  const kelas = $('#mKelas').value, tanggal = $('#mTgl').value;
  if (!kelas || !tanggal) return toast('Pilih kelas dan tanggal');
  const b = $('#mSimpan'); b.disabled = true;
  try {
    await setDoc(doc(db, 'absenMurid', `${tanggal}_${kelas}`), { tanggal, kelas, status: statusMap, oleh: me.email, diubah: serverTimestamp() });
    toast('Absen murid tersimpan');
  } catch (err) { toast(err.code === 'permission-denied' ? 'Ditolak: kelas ini bukan kelas Anda.' : 'Gagal menyimpan: ' + (err.code || err.message)); }
  b.disabled = false;
});

/* =========================================================
   REKAP (ADMIN)
   ========================================================= */
let bulanData = null;
async function muatGuruList() {
  const s = await getDocs(collection(db, 'guru'));
  gurus = s.docs.map(d => ({ email: d.id, ...d.data() })).filter(g => g.role === 'guru').sort((a, b) => urut(a.nama, b.nama));
}
async function muatRekap() {
  await Promise.all([muatGuruList(), muatDataMurid()]);
  if (!$('#rTgl').value) $('#rTgl').value = tgl();
  if (!$('#rBln').value) $('#rBln').value = tgl().slice(0, 7);
  await rekapHarian();
}
$('#rTgl').addEventListener('change', () => rekapHarian().catch(e => toast('Gagal memuat: ' + (e.code || e.message))));

async function rekapHarian() {
  const tanggal = $('#rTgl').value; if (!tanggal) return;
  const [lg, lm] = await Promise.all([
    getDocs(query(collection(db, 'absenGuru'), where('tanggal', '==', tanggal))),
    getDocs(query(collection(db, 'absenMurid'), where('tanggal', '==', tanggal)))
  ]);
  const logs = lg.docs.map(d => ({ id: d.id, ...d.data() }));
  $('#rGuru').innerHTML = gurus.length ? gurus.map(g => {
    const m = logs.find(l => l.email === g.email && l.tipe === 'masuk'), p = logs.find(l => l.email === g.email && l.tipe === 'pulang');
    const th = l => l ? `<img class="thumb" data-foto="${esc(l.id)}" alt="Foto ${esc(g.nama)}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">` : '<div class="thumb"></div>';
    return `<div class="row-item">${th(m)}<div class="grow"><b>${esc(g.nama)}</b><span>${m ? 'Masuk ' + jam(m.waktu) + ' (' + m.jarak + ' m)' : 'Belum absen'}${p ? ' · Pulang ' + jam(p.waktu) : ''}</span></div><span class="pill ${m ? 'ok' : 'bad'}">${m ? 'Hadir' : 'Belum'}</span></div>`;
  }).join('') : '<p class="muted">Belum ada guru terdaftar.</p>';
  document.querySelectorAll('#rGuru img[data-foto]').forEach(img => {
    getDoc(doc(db, 'foto', img.dataset.foto)).then(s => { if (s.exists()) img.src = s.data().data; }).catch(() => { });
  });
  const mapKelas = {}; lm.docs.forEach(d => { mapKelas[d.data().kelas] = d.data().status || {}; });
  const kls = daftarKelas();
  $('#rMurid').innerHTML = kls.length ? `<div class="tbl-wrap"><table class="rk"><tr><th>Kelas</th><th class="n">H</th><th class="n">I</th><th class="n">S</th><th class="n">A</th><th>Keterangan</th></tr>${kls.map(k => {
    const ms = murid.filter(m => m.kelas === k), st = mapKelas[k];
    if (!st) return `<tr><td>${esc(k)}</td><td colspan="4" class="n">-</td><td><span class="pill bad">Belum diisi</span></td></tr>`;
    const c = { H: 0, I: 0, S: 0, A: 0 }; ms.forEach(m => { if (c[st[m.id]] !== undefined) c[st[m.id]]++; });
    const belum = ms.filter(m => !st[m.id]).length;
    return `<tr><td>${esc(k)}</td><td class="n">${c.H}</td><td class="n">${c.I}</td><td class="n">${c.S}</td><td class="n">${c.A}</td><td>${belum ? belum + ' belum ditandai' : 'Lengkap'} dari ${ms.length}</td></tr>`;
  }).join('')}</table></div>` : '<p class="muted">Belum ada murid.</p>';
}

$('#btnBln').addEventListener('click', async () => {
  const bln = $('#rBln').value; if (!bln) return toast('Pilih bulan');
  const b = $('#btnBln'); b.disabled = true; b.textContent = 'Memuat…';
  try {
    const a = bln + '-01', z = bln + '-31';
    const [lg, lm] = await Promise.all([
      getDocs(query(collection(db, 'absenGuru'), where('tanggal', '>=', a), where('tanggal', '<=', z))),
      getDocs(query(collection(db, 'absenMurid'), where('tanggal', '>=', a), where('tanggal', '<=', z)))
    ]);
    const logs = lg.docs.map(d => d.data());
    const rowsG = gurus.map(g => {
      const mk = new Set(logs.filter(l => l.email === g.email && l.tipe === 'masuk').map(l => l.tanggal));
      const pl = new Set(logs.filter(l => l.email === g.email && l.tipe === 'pulang').map(l => l.tanggal));
      return [g.nama, mk.size, pl.size];
    });
    const hitung = {}; murid.forEach(m => { hitung[m.id] = { H: 0, I: 0, S: 0, A: 0 }; });
    lm.docs.forEach(d => { const st = d.data().status || {}; Object.entries(st).forEach(([id, s]) => { if (hitung[id] && hitung[id][s] !== undefined) hitung[id][s]++; }); });
    const rowsM = murid.slice().sort((x, y) => urut(x.kelas, y.kelas) || urut(x.nama, y.nama)).map(m => {
      const c = hitung[m.id], tot = c.H + c.I + c.S + c.A;
      return [m.kelas, m.nama, c.H, c.I, c.S, c.A, tot ? Math.round(c.H * 100 / tot) + '%' : '-'];
    });
    bulanData = { bln, rowsG, rowsM };
    const nama = new Date(bln + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    let h = `<h3 class="sub">Rekap ${esc(nama)}</h3><h3 class="sub">Kehadiran guru (jumlah hari)</h3><div class="tbl-wrap"><table class="rk"><tr><th>Guru</th><th class="n">Hari masuk</th><th class="n">Hari pulang tercatat</th></tr>${rowsG.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('') || '<tr><td colspan="3">Belum ada guru.</td></tr>'}</table></div>`;
    h += '<h3 class="sub">Kehadiran murid</h3>';
    let kls = null;
    if (!rowsM.length) h += '<p class="muted">Belum ada murid.</p>';
    rowsM.forEach(r => {
      if (r[0] !== kls) { if (kls !== null) h += '</table></div>'; kls = r[0]; h += `<div class="kelas-h">Kelas ${esc(kls)}</div><div class="tbl-wrap"><table class="rk"><tr><th>Nama</th><th class="n">H</th><th class="n">I</th><th class="n">S</th><th class="n">A</th><th class="n">% hadir</th></tr>`; }
      h += `<tr><td>${esc(r[1])}</td><td class="n">${r[2]}</td><td class="n">${r[3]}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td class="n">${r[6]}</td></tr>`;
    });
    if (kls !== null) h += '</table></div>';
    $('#rBulan').innerHTML = h;
    $('#btnCsv').disabled = $('#btnCetak').disabled = false;
  } catch (err) { toast('Gagal memuat rekap: ' + (err.code || err.message)); }
  b.disabled = false; b.textContent = 'Tampilkan';
});
$('#btnCsv').addEventListener('click', () => {
  if (!bulanData) return;
  const baris = [['REKAP GURU ' + bulanData.bln], ['Guru', 'Hari masuk', 'Hari pulang tercatat'], ...bulanData.rowsG, [], ['REKAP MURID ' + bulanData.bln], ['Kelas', 'Nama', 'H', 'I', 'S', 'A', '% hadir'], ...bulanData.rowsM];
  const csv = baris.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = 'rekap-' + bulanData.bln + '.csv'; a.click();
});
$('#btnCetak').addEventListener('click', () => window.print());

/* lightbox foto */
document.addEventListener('click', e => {
  const img = e.target.closest('img.thumb');
  if (img && img.dataset.foto && img.src.startsWith('data:image/jpeg')) { $('#lightbox img').src = img.src; $('#lightbox').classList.remove('hide'); }
  else if (e.target.closest('#lightbox')) $('#lightbox').classList.add('hide');
});

/* =========================================================
   ATUR (ADMIN)
   ========================================================= */
async function muatAtur() {
  await Promise.all([muatGuruList(), muatDataMurid()]);
  $('#sNama').value = (sekolah && sekolah.nama) || '';
  $('#sLat').value = sekolah && sekolah.lat != null ? sekolah.lat : '';
  $('#sLng').value = sekolah && sekolah.lng != null ? sekolah.lng : '';
  $('#sRad').value = radius();
  gambarGuru(); gambarMuridAtur();
}
$('#btnHere').addEventListener('click', async () => {
  const b = $('#btnHere'); b.disabled = true;
  try { const p = await getPos(); $('#sLat').value = p.coords.latitude.toFixed(6); $('#sLng').value = p.coords.longitude.toFixed(6); toast('Titik terisi (akurasi ±' + Math.round(p.coords.accuracy) + ' m). Tekan Simpan.'); }
  catch (e) { toast(e.message); }
  b.disabled = false;
});
$('#btnSimpanS').addEventListener('click', async () => {
  const lat = parseFloat($('#sLat').value.replace(',', '.')), lng = parseFloat($('#sLng').value.replace(',', '.')), r = parseInt($('#sRad').value, 10);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return toast('Isi latitude dan longitude yang valid');
  if (isNaN(r) || r < 5) return toast('Radius minimal 5 meter');
  const data = { nama: $('#sNama').value.trim(), lat, lng, radius: r, cosLat: Math.cos(lat * Math.PI / 180) };
  try { await setDoc(doc(db, 'sekolah', 'utama'), data); sekolah = data; $('#hInfo').textContent = (data.nama ? data.nama + ' · ' : '') + 'Admin'; toast('Lokasi sekolah tersimpan'); }
  catch (e) { toast('Gagal menyimpan: ' + (e.code || e.message)); }
});

function gambarGuru() {
  $('#tList').innerHTML = gurus.length ? gurus.map(g => `<div class="row-item"><div class="grow"><b>${esc(g.nama)}</b><span>${esc(g.email)} · Kelas ${esc((g.kelas || []).join(', ') || '-')}</span></div>
    <button class="mini-btn edit" data-edit="${esc(g.email)}">Ubah</button><button class="mini-btn" data-hapus-g="${esc(g.email)}">Hapus</button></div>`).join('') : '<p class="muted">Belum ada guru.</p>';
}
$('#tList').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]'), hp = e.target.closest('[data-hapus-g]');
  if (ed) { const g = gurus.find(x => x.email === ed.dataset.edit); $('#tEmail').value = g.email; $('#tNama').value = g.nama; $('#tKelas').value = (g.kelas || []).join(', '); $('#tEmail').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (hp && confirm('Hapus guru ini dari daftar? Akun loginnya di Firebase tidak ikut terhapus.')) {
    try { await deleteDoc(doc(db, 'guru', hp.dataset.hapusG)); await muatGuruList(); gambarGuru(); } catch (err) { toast('Gagal menghapus: ' + (err.code || err.message)); }
  }
});
$('#tSimpan').addEventListener('click', async () => {
  const email = $('#tEmail').value.trim().toLowerCase(), nama = $('#tNama').value.trim();
  const kelas = [...new Set($('#tKelas').value.split(',').map(normKelas).filter(Boolean))];
  if (!email || !nama) return toast('Isi email dan nama guru');
  if (email === me.email) return toast('Itu akun admin. Isi email guru.');
  try { await setDoc(doc(db, 'guru', email), { nama, role: 'guru', kelas }); toast('Guru tersimpan'); $('#tEmail').value = $('#tNama').value = $('#tKelas').value = ''; await muatGuruList(); gambarGuru(); }
  catch (e) { toast('Gagal menyimpan: ' + (e.code || e.message)); }
});

function gambarMuridAtur() {
  const kls = daftarKelas();
  $('#sList').innerHTML = kls.length ? kls.map(k => `<div class="kelas-h">Kelas ${esc(k)} (${murid.filter(m => m.kelas === k).length} murid)</div>` +
    murid.filter(m => m.kelas === k).map(m => `<div class="row-item"><div class="grow"><b>${esc(m.nama)}</b></div><button class="mini-btn" data-hapus-m="${m.id}">Hapus</button></div>`).join('')).join('') + `<p class="muted small">Total ${murid.length} murid.</p>` : '<p class="muted">Belum ada murid.</p>';
}
$('#sList').addEventListener('click', async e => {
  const hp = e.target.closest('[data-hapus-m]');
  if (hp && confirm('Hapus murid ini?')) {
    try { await deleteDoc(doc(db, 'murid', hp.dataset.hapusM)); await muatDataMurid(); gambarMuridAtur(); } catch (err) { toast('Gagal menghapus: ' + (err.code || err.message)); }
  }
});
$('#mTambah').addEventListener('click', async () => {
  const nama = $('#mNama').value.trim(), kelas = normKelas($('#mKls').value);
  if (!nama || !kelas) return toast('Isi nama dan kelas murid');
  try { await setDoc(doc(collection(db, 'murid')), { nama, kelas }); $('#mNama').value = ''; await muatDataMurid(); gambarMuridAtur(); toast('Murid ditambahkan'); }
  catch (e) { toast('Gagal menambah: ' + (e.code || e.message)); }
});
$('#mImporBtn').addEventListener('click', async () => {
  const baris = $('#mImpor').value.split('\n').map(l => l.split(/\t|;|,/).map(x => x.trim())).filter(r => r[0] && r[1]);
  if (!baris.length) return toast('Tidak ada baris yang valid. Format: Nama, Kelas');
  if (!confirm(`Impor ${baris.length} murid?`)) return;
  const b = $('#mImporBtn'); b.disabled = true;
  try {
    for (let i = 0; i < baris.length; i += 400) {
      const wb = writeBatch(db);
      baris.slice(i, i + 400).forEach(r => wb.set(doc(collection(db, 'murid')), { nama: r[0], kelas: normKelas(r[1]) }));
      await wb.commit();
    }
    $('#mImpor').value = ''; await muatDataMurid(); gambarMuridAtur(); toast(baris.length + ' murid diimpor');
  } catch (e) { toast('Gagal impor: ' + (e.code || e.message)); }
  b.disabled = false;
});
