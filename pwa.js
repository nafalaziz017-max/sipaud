/* Pendaftaran service worker + ajakan "Pasang di layar utama" */
(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const box = document.getElementById('instalBox');
  if (!box) return;
  const msg = box.querySelector('[data-msg]'), pasang = box.querySelector('[data-pasang]'), tutup = box.querySelector('[data-tutup]');
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let ditutup = false;
  try { ditutup = localStorage.getItem('sipaud-instal-tutup') === '1'; } catch (e) { }
  if (standalone || ditutup) return;
  let evt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); evt = e;
    msg.textContent = 'Pasang aplikasi ini di layar utama HP agar lebih cepat dibuka.';
    pasang.classList.remove('hide'); box.classList.remove('hide');
  });
  pasang.addEventListener('click', async () => {
    if (!evt) return; evt.prompt(); await evt.userChoice.catch(() => { }); evt = null; box.classList.add('hide');
  });
  tutup.addEventListener('click', () => {
    box.classList.add('hide'); try { localStorage.setItem('sipaud-instal-tutup', '1'); } catch (e) { }
  });
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    msg.textContent = 'Untuk memasang di iPhone: ketuk tombol Bagikan di Safari, lalu pilih "Tambah ke Layar Utama".';
    pasang.classList.add('hide'); box.classList.remove('hide');
  }
})();
