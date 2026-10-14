/* =========================================================
   KONFIGURASI SIPAUD — isi bagian ini, tidak perlu ubah kode lain
   ========================================================= */
const SIPAUD_CONFIG = {
  waNumber: '6285174360195',
  waText: 'Halo SiPaud, saya ingin bertanya tentang penggunaan SiPaud untuk sekolah PAUD.',

  // Tempel link Google Form / Google Sheets / PDF di sini (kosongkan = tombol nonaktif)
  links: {
    formAbsenGuru: 'absen.html',    // Halaman absen guru (foto + GPS)
    formAbsenMurid: 'absen.html?tab=murid',   // Halaman absen murid
    rekapPdfBulanan: 'absen.html?tab=rekap'   // Rekap bulanan (admin)
  },

  // Data grafik per bulan (12 angka Jan–Des, persen 0–100). null = belum ada data.
  // Contoh jika sudah ada data nyata: [90, 92, null, ...]
  chartData: {
    absensi: [
      { name: 'Kehadiran Guru',  values: [] },
      { name: 'Kehadiran Murid', values: [] }
    ],
    progres: [
      { name: 'Progres Perkembangan Anak', values: [] }
    ]
  }
};

(function(){
  /* ---------- Menu mobile ---------- */
  const menu=document.querySelector('.menu-btn');
  const nav=document.querySelector('.nav-links');
  if(menu&&nav) menu.addEventListener('click',()=>nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav&&nav.classList.remove('open')));

  /* ---------- WhatsApp ---------- */
  const waUrl='https://wa.me/'+SIPAUD_CONFIG.waNumber+'?text='+encodeURIComponent(SIPAUD_CONFIG.waText);
  document.querySelectorAll('[data-wa]').forEach(a=>{a.href=waUrl;a.target='_blank';a.rel='noopener';});
  const fab=document.createElement('a');
  fab.className='wa-float';fab.href=waUrl;fab.target='_blank';fab.rel='noopener';
  fab.setAttribute('aria-label','Hubungi SiPaud via WhatsApp');
  fab.innerHTML='<span class="wa-ico">💬</span><span class="wa-text">WhatsApp</span>';
  document.body.appendChild(fab);

  /* ---------- Tombol link (Google Form / PDF) ---------- */
  document.querySelectorAll('[data-link]').forEach(el=>{
    const url=SIPAUD_CONFIG.links[el.dataset.link];
    if(url){el.href=url;el.target='_blank';el.rel='noopener';}
    else{el.classList.add('disabled');el.removeAttribute('href');el.setAttribute('aria-disabled','true');el.title='Link belum diisi di script.js';}
  });

  /* ---------- Grafik per bulan (SVG, tanpa library) ---------- */
  const MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const COLORS=['#4DA8FF','#27AE60'];
  const NS='http://www.w3.org/2000/svg';

  function renderChart(box,series){
    const W=640,H=300,L=44,R=16,T=20,B=34,iw=W-L-R,ih=H-T-B;
    const hasData=series.some(s=>(s.values||[]).some(v=>typeof v==='number'));
    const x=i=>L+iw*i/11, y=v=>T+ih*(1-v/100);
    let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Grafik per bulan">';
    svg+='<defs>'+COLORS.map((c,i)=>'<linearGradient id="g'+box.dataset.chart+i+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c+'" stop-opacity=".28"/><stop offset="1" stop-color="'+c+'" stop-opacity="0"/></linearGradient>').join('')+'</defs>';
    [0,25,50,75,100].forEach(g=>{
      svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="#e3edf5" '+(g?'stroke-dasharray="4 5"':'')+'/>';
      svg+='<text x="'+(L-8)+'" y="'+(y(g)+4)+'" text-anchor="end" font-size="11" fill="#90a4ae">'+g+'%</text>';
    });
    MONTHS.forEach((m,i)=>{svg+='<text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="#90a4ae">'+m+'</text>';});
    series.forEach((s,si)=>{
      const pts=(s.values||[]).map((v,i)=>typeof v==='number'?[x(i),y(Math.max(0,Math.min(100,v)))]:null);
      const valid=pts.filter(Boolean); if(!valid.length) return;
      const line=valid.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
      svg+='<path d="'+line+' L'+valid[valid.length-1][0]+' '+y(0)+' L'+valid[0][0]+' '+y(0)+' Z" fill="url(#g'+box.dataset.chart+(si%2)+')"/>';
      svg+='<path d="'+line+'" fill="none" stroke="'+COLORS[si%2]+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      valid.forEach(p=>{svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="#fff" stroke="'+COLORS[si%2]+'" stroke-width="2.5"/>';});
    });
    if(!hasData) svg+='<text x="'+(W/2)+'" y="'+(T+ih/2)+'" text-anchor="middle" font-size="14" fill="#90a4ae">Belum ada data bulanan</text>';
    svg+='</svg>';
    const legend='<div class="legend">'+series.map((s,i)=>'<span><i style="background:'+COLORS[i%2]+'"></i>'+s.name+'</span>').join('')+'</div>';
    box.innerHTML=svg+legend+(hasData?'':'<p class="chart-note">Grafik akan tampil otomatis setelah rekap bulanan dari Google Form diisi di <code>script.js</code>.</p>');
  }
  document.querySelectorAll('[data-chart]').forEach(box=>{
    const s=SIPAUD_CONFIG.chartData[box.dataset.chart]; if(s) renderChart(box,s);
  });
})();
