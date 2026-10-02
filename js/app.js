const byId=id=>PRODUCTS.find(p=>p.id===id);
const idr=n=>'Rp '+n.toLocaleString('id-ID');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const icons=()=>window.lucide&&lucide.createIcons();

/* foto + fallback svg */
const art=p=>`<svg viewBox="0 0 240 240" aria-hidden="true"><use href="#${p.art}"/></svg><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">`;

/* ================= TOAST ================= */
function toast(msg,ok=true){
  const t=document.createElement('div');
  t.className='toast'+(ok?'':' err');
  t.innerHTML=`<i data-lucide="${ok?'check-circle':'x-circle'}" class="ic"></i><span>${msg}</span>`;
  $('#toasts').appendChild(t); icons();
  setTimeout(()=>t.classList.add('out'),2600);
  setTimeout(()=>t.remove(),3100);
}

/* ================= KERANJANG ================= */
let cart=new Map(JSON.parse(localStorage.getItem('coffemur_cart')||'[]'));
const save=()=>localStorage.setItem('coffemur_cart',JSON.stringify([...cart]));
const cartQty=()=>{let n=0;cart.forEach(q=>n+=q);return n};

function updateBadge(bump){
  const n=cartQty();
  $('#cartCount').textContent=n;
  $('#dCount').textContent=`(${n})`;
  if(bump){const b=$('#cartBtn');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');}
}
function addToCart(id,qty=1){
  cart.set(id,(cart.get(id)||0)+qty);
  save(); renderCart(); updateBadge(true);
  toast(`${byId(id).name} masuk keranjang`);
}
function renderCart(){
  const box=$('#cartItems');
  if(!cart.size){
    box.innerHTML=`<div class="cempty"><i data-lucide="shopping-cart" class="ic"></i><p>Keranjang masih kosong</p><span>Yuk pilih produk di katalog</span></div>`;
  }else{
    box.innerHTML=[...cart].map(([id,q])=>{const p=byId(id);return `
    <div class="citem">
      <div class="cthumb">${art(p)}</div>
      <div class="cinfo2">
        <p class="pcat">${p.cat} /${p.no}</p>
        <h4>${p.name}</h4>
        <div class="stepper">
          <button data-act="dec" data-id="${id}" aria-label="Kurangi"><i data-lucide="minus" class="ic"></i></button>
          <span>${q}</span>
          <button data-act="inc" data-id="${id}" aria-label="Tambah"><i data-lucide="plus" class="ic"></i></button>
        </div>
      </div>
      <div class="cright">
        <p class="pprice"><b>${idr(p.price*q)}</b></p>
        <button class="rm" data-act="rm" data-id="${id}" aria-label="Hapus"><i data-lucide="trash-2" class="ic"></i></button>
      </div>
    </div>`}).join('');
  }
  let sub=0; cart.forEach((q,id)=>sub+=byId(id).price*q);
  $('#sumSub').textContent=idr(sub);
  $('#sumShip').textContent='Darat / Laut / Udara';
  $('#sumTotal').textContent=idr(sub);
  $('#shipFill').style.width=Math.min(sub/FREE_MIN*100,100)+'%';
  $('#shipLabel').innerHTML= sub>=FREE_MIN ? '<b>Gratis ongkir DARAT aktif</b> — pilih saat checkout'
    : sub===0 ? 'Subtotal ≥ <b>Rp 300.000</b> → gratis ongkir via darat'
    : `Kurang <b>${idr(FREE_MIN-sub)}</b> lagi → gratis ongkir via darat`;
  icons();
}
 $('#cartItems').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'); if(!b)return;
  const id=b.dataset.id, q=cart.get(id)||0;
  if(b.dataset.act==='inc')cart.set(id,q+1);
  if(b.dataset.act==='dec'){q<=1?cart.delete(id):cart.set(id,q-1)}
  if(b.dataset.act==='rm'){cart.delete(id);toast(`${byId(id).name} dihapus`,false)}
  save(); renderCart(); updateBadge(); if(view==='checkout')renderCheckout();
});

/* ================= VIEW DRAWER ================= */
let view='cart';
function showView(v){
  view=v;
  $('#cartView').hidden = v!=='cart';
  $('#cartFoot').hidden = v!=='cart';
  $('#coBody').hidden   = v!=='checkout';
  $('#cartDone').hidden = v!=='done';
  $('#dTitle').textContent = v==='cart'?'Keranjang':v==='checkout'?'Checkout':'Selesai';
  const idx=v==='cart'?1:v==='checkout'?2:3;
  $('#coRail').innerHTML=['Keranjang','Checkout','Selesai']
    .map((s,j)=>`<span class="${j+1===idx?'on':''}"><b>${j+1}</b>${s}</span>`).join('<i>—</i>');
  icons();
}

/* ================= KONFIG ORDER AGEN ================= */
const FREE_MIN=(typeof STORE_CONFIG!=='undefined'&&STORE_CONFIG.freeShippingMinimum)||300000;
const SHIP={
  darat:{label:'Via Darat',cost:15000, eta:'2–5 hari kerja'},
  laut :{label:'Via Laut / Cargo',cost:25000, eta:'7–14 hari kerja'},
  udara:{label:'Via Udara',cost:40000, eta:'1–3 hari kerja'},
};
const PAY={
  transfer:{label:'Transfer Penuh', flow:'Pesan → Bayar → Kirim', limit:Infinity,  limitTxt:'TANPA LIMIT', icon:'wallet'},
  cod     :{label:'COD — Bayar di Tempat', flow:'Pesan → Kirim → Bayar', limit:1000000, limitTxt:'LIMIT 1 JT', icon:'banknote'},
  dp      :{label:'DP + Cicilan', flow:'Pesan → DP → Kirim → Cicil', limit:2000000, limitTxt:'LIMIT 2 JT', icon:'hand-coins'},
};
let co={ship:'darat',pay:'transfer',tenor:3};

function totals(){
  let sub=0; cart.forEach((q,id)=>sub+=byId(id).price*q);
  const ship= sub===0 ? 0 : (co.ship==='darat' ? (sub>=FREE_MIN?0:SHIP.darat.cost) : SHIP[co.ship].cost);
  const total=sub+ship;
  const dp  = co.pay==='dp' ? Math.round(total*0.3) : 0;
  const sisa= total-dp;
  const per = co.pay==='dp' ? Math.round(sisa/co.tenor) : 0;
  return{sub,ship,total,dp,sisa,per};
}

function renderCheckout(){
  const t=totals();
  if(t.total>PAY[co.pay].limit) co.pay='transfer';
  $$('.shipcard').forEach(c=>c.classList.toggle('on',c.dataset.ship===co.ship));
  const cd=$('#costDarat'); if(cd) cd.textContent = t.sub>=FREE_MIN ? 'GRATIS' : idr(SHIP.darat.cost);
  $('#payCards').innerHTML=Object.entries(PAY).map(([k,m])=>{
    const over=t.total>m.limit;
    return `<button type="button" class="paycard${co.pay===k?' on':''}${over?' off':''}" data-pay="${k}" ${over?'disabled':''}>
      <span class="pc-name"><i data-lucide="${m.icon}" class="ic"></i>${m.label}</span>
      <span class="pc-lim${over?' bad':''}">${over?'MELEBIHI LIMIT':m.limitTxt}</span>
      <span class="pc-flow">${m.flow}</span>
    </button>`}).join('');
  $('#dpBox').hidden = co.pay!=='dp';
  if(co.pay==='dp'){
    $('#dpAmt').textContent=idr(t.dp);
    $$('#tenors [data-tenor]').forEach(b=>b.classList.toggle('on',+b.dataset.tenor===co.tenor));
    $('#perAmt').textContent=`${idr(t.per)}/bln`;
  }
  $('#coSum').innerHTML=`
    <div class="srow"><span>Subtotal</span><span>${idr(t.sub)}</span></div>
    <div class="srow"><span>Ongkir — ${SHIP[co.ship].label}</span><span>${t.ship===0?'GRATIS':idr(t.ship)}</span></div>
    ${co.pay==='dp'?`
    <div class="srow"><span>DP 30% (sekarang)</span><span>${idr(t.dp)}</span></div>
    <div class="srow"><span>Sisa — ${co.tenor}× cicilan</span><span>${idr(t.sisa)}</span></div>`:''}
    <div class="srow total"><span>Total Pesanan</span><span>${idr(t.total)}</span></div>`;
  icons();
}

 $('#coBody').addEventListener('click',e=>{
  const s=e.target.closest('[data-ship]');
  if(s){co.ship=s.dataset.ship;renderCheckout();return}
  const p=e.target.closest('[data-pay]');
  if(p&&!p.classList.contains('off')){co.pay=p.dataset.pay;renderCheckout();return}
  const t=e.target.closest('[data-tenor]');
  if(t){co.tenor=+t.dataset.tenor;renderCheckout()}
});
 $('#backCart').onclick=()=>showView('cart');

 $('#coForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!cart.size){toast('Keranjang masih kosong',false);showView('cart');return}
  let ok=true;
  [['agName',v=>v.length>=3],['agWa',v=>/^[0-9+\-\s]{9,16}$/.test(v)],['agCity',v=>v.length>=3],['agAddr',v=>v.length>=8]]
  .forEach(([id,test])=>{
    const f=$('#'+id), good=test(f.value.trim());
    f.closest('.field').classList.toggle('err',!good); if(!good)ok=false;
  });
  if(!ok){toast('Periksa kembali data agen',false);return}
  const t=totals(), M=PAY[co.pay], S=SHIP[co.ship];
  const orderNo='COFFEMUR-AG-'+new Date().getTime().toString().slice(-8);
  const items=[...cart].map(([id,qty])=>{const p=byId(id);return {id:p.id,name:p.name,qty,price:p.price}});
  const payload={action:'order',orderNo,customer:{name:$('#agName').value.trim(),wa:$('#agWa').value.trim(),city:$('#agCity').value.trim(),addr:$('#agAddr').value.trim()},shipping:{key:co.ship,label:S.label,eta:S.eta},payment:{key:co.pay,label:M.label,flow:M.flow},tenor:co.tenor,totals:t,items};
  const btn=e.submitter||$('#coForm button[type="submit"]'); if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Menyimpan...'}
  try{
    const res=await fetch(STORE_CONFIG.apiUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const data=await res.json(); if(!data.ok) throw new Error(data.error||'Gagal menyimpan order');
    const finalOrder=data.orderNo||orderNo; $('#orderNo').textContent=finalOrder; $('#waNote').textContent = data.wa&&data.wa.sent ? 'Invoice PDF sudah dikirim ke WhatsApp '+$('#agWa').value.trim() : 'Invoice PDF akan dikirim tim kami ke WhatsApp kamu';
    localStorage.setItem('coffemur_agent',JSON.stringify(payload.customer));
    $('#orderRecap').innerHTML=`<div class="srow"><span>Metode</span><span>${M.label}</span></div><div class="srow"><span>Alur</span><span>${M.flow}</span></div><div class="srow"><span>Pengiriman</span><span>${S.label} · ${S.eta}</span></div>${co.pay==='dp'?`<div class="srow"><span>DP 30% — sekarang</span><span>${idr(t.dp)}</span></div><div class="srow"><span>Cicilan ${co.tenor}×</span><span>${idr(t.per)} / bulan</span></div>`:''}<div class="srow total"><span>Total</span><span>${idr(t.total)}</span></div><div class="srow"><span>Tujuan</span><span>${$('#agCity').value}</span></div>`;
    cart.clear(); save(); renderCart(); updateBadge(); showView('done'); toast('Pesanan tersimpan di Google Sheets');
  }catch(err){ console.error(err); toast('Order belum tersimpan. Cek URL Apps Script dan koneksi.',false); }
  finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||'Kirim Pesanan'}}
});

// Sinkronisasi produk dari Google Sheets. Jika API belum berisi produk, katalog lokal tetap dipakai.
async function loadProductsFromSheet(){
  if(!STORE_CONFIG.apiUrl) return;
  try{
    const r=await fetch(STORE_CONFIG.apiUrl+'?action=products',{cache:'no-store'}); const d=await r.json();
    if(!d.ok || !Array.isArray(d.products) || !d.products.length) return;
    d.products.forEach(x=>{ if(x.specs && !Array.isArray(x.specs)) x.specs=String(x.specs).split('||').filter(Boolean); });
    PRODUCTS.splice(0,PRODUCTS.length,...d.products);
    [...cart.keys()].forEach(id=>{ if(!byId(id)) cart.delete(id); }); save(); renderCart(); updateBadge();
    renderCats(); renderGrid();
    toast('Produk tersinkron dari Google Sheets');
  }catch(err){ console.warn('Produk Google Sheets belum tersedia; memakai data lokal.',err); }
}


/* drawer buka/tutup */
function openCart(){$('#drawer').classList.add('open');$('#scrim').classList.add('on');document.documentElement.classList.add('lock')}
function closeCart(){
  $('#drawer').classList.remove('open');$('#scrim').classList.remove('on');document.documentElement.classList.remove('lock');
  setTimeout(()=>showView('cart'),420);
}
 $('#cartBtn').onclick=openCart;
 $('#closeCart').onclick=closeCart;
 $('#checkoutBtn').onclick=()=>{
  if(!cart.size){toast('Keranjang masih kosong',false);return}
  try{const a=JSON.parse(localStorage.getItem('coffemur_agent')||'null');
    if(a){$('#agName').value=a.name||'';$('#agWa').value=a.wa||'';$('#agCity').value=a.city||'';$('#agAddr').value=a.addr||''}
  }catch(_){}
  renderCheckout(); showView('checkout');
};
 $('#doneBtn').onclick=closeCart;

/* ================= KATALOG ================= */
let curFilter='SEMUA', curQ='';
const CATS=['SEMUA','KEYBOARD','MOUSE','AUDIO','DAYA','PENUNJANG','CCTV'];
function renderCats(){
  $('#cats').innerHTML=CATS.map(c=>{
    const n=c==='SEMUA'?PRODUCTS.length:PRODUCTS.filter(p=>p.cat===c).length;
    return `<button class="fbtn${c===curFilter?' on':''}" data-cat="${c}">${c}<span class="cnt">${n}</span></button>`;
  }).join('');
}
 $('#cats').addEventListener('click',e=>{
  const b=e.target.closest('.fbtn'); if(!b)return;
  curFilter=b.dataset.cat; renderCats(); renderGrid();
});
function setQuery(q){
  curQ=q.trim().toLowerCase();
  $('#search').value=q; $('#hInput').value=q;
  renderGrid();
}
 $('#search').addEventListener('input',e=>{curQ=e.target.value.trim().toLowerCase();renderGrid()});
 $('#hInput').addEventListener('input',e=>{curQ=e.target.value.trim().toLowerCase();$('#search').value=e.target.value;renderGrid()});
 $('#hSearch').addEventListener('submit',e=>{
  e.preventDefault();
  setQuery($('#hInput').value);
  document.getElementById('katalog').scrollIntoView({behavior:'smooth'});
});

const badgeCls=b=>b==='LARIS'?'b-hot':b==='BARU'?'b-new':'b-disc';
const cellHTML=(p,i)=>`
<article class="pcard" data-id="${p.id}" style="animation-delay:${i*30}ms">
  <div class="pimg">
    ${p.badge?`<span class="badge ${badgeCls(p.badge)}">${p.badge}</span>`:''}
    ${art(p)}
    <button class="qadd" data-add="${p.id}" aria-label="Tambah ${p.name} ke keranjang"><i data-lucide="plus" class="ic"></i></button>
  </div>
  <div class="pbody">
    <p class="pcat">${p.cat}</p>
    <h3>${p.name}</h3>
    <div class="pprice">${p.old?`<s>${idr(p.old)}</s>`:''}<b>${idr(p.price)}</b></div>
    <div class="pmeta"><i data-lucide="star" class="ic star"></i><b>${p.rating}</b><span>· ${p.sold} terjual</span></div>
    <p class="ploc"><i data-lucide="map-pin" class="ic"></i>Jakarta Selatan</p>
  </div>
</article>`;

function renderGrid(){
  const list=PRODUCTS.filter(p=>(curFilter==='SEMUA'||p.cat===curFilter)&&(!curQ||(p.name+' '+p.cat).toLowerCase().includes(curQ)));
  $('#grid').innerHTML=list.length
    ? list.map(cellHTML).join('')
    : `<div class="gempty"><i data-lucide="search-x" class="ic"></i><p><b>Produk tidak ditemukan</b></p><span>Coba kata kunci lain</span></div>`;
  $('#gridCount').textContent=`Menampilkan ${list.length} dari ${PRODUCTS.length} produk`;
  icons();
}
 $('#grid').addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');
  if(add){addToCart(add.dataset.add);add.classList.remove('bump');void add.offsetWidth;add.classList.add('bump');return}
  const card=e.target.closest('.pcard');
  if(card)openQV(card.dataset.id);
});

/* ================= QUICK VIEW ================= */
let qvId=null,qvQty=1;
function openQV(id){
  const p=byId(id); qvId=id; qvQty=1;
  $('#qvArt').innerHTML=art(p);
  $('#qvNo').textContent='/'+p.no;
  $('#qvCat').textContent=p.cat+' /'+p.no;
  $('#qvName').textContent=p.name;
  $('#qvPrice').innerHTML=(p.old?`<s>${idr(p.old)}</s>`:'')+idr(p.price);
  $('#qvRate').textContent=p.rating;
  $('#qvSold').textContent=`· ${p.sold} terjual`;
  $('#qvTag').textContent=p.tag;
  $('#qvSpecs').innerHTML=p.specs.map((s,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b>${s}</li>`).join('');
  $('#qvQty').textContent=1;
  $('#qv').classList.add('open');$('#scrim').classList.add('on');
  document.documentElement.classList.add('lock'); icons();
}
function closeQV(){$('#qv').classList.remove('open');$('#scrim').classList.remove('on');document.documentElement.classList.remove('lock')}
 $('#qvClose').onclick=closeQV;
 $('#qvInc').onclick=()=>{$('#qvQty').textContent=++qvQty};
 $('#qvDec').onclick=()=>{if(qvQty>1)$('#qvQty').textContent=--qvQty};
 $('#qvAdd').onclick=()=>{addToCart(qvId,qvQty);closeQV();openCart()};
 $('#spotAdd').onclick=()=>{addToCart('p1');openCart()};
 $('#spotMore').onclick=()=>openQV('p1');

 $('#scrim').onclick=()=>{closeCart();closeQV()};
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeCart();closeQV();$('#mnav').classList.remove('open');document.documentElement.classList.remove('lock')}
});

/* varian warna spotlight */
 $$('.swatch').forEach(s=>s.onclick=()=>{
  $$('.swatch').forEach(x=>x.classList.remove('on')); s.classList.add('on');
  $('#tiltCard').style.setProperty('--acc',s.dataset.c);
  $('#varName').textContent=s.dataset.n;
});

/* FAQ */
 $$('.qa-h').forEach(h=>h.onclick=()=>{
  const qa=h.parentElement, open=qa.classList.contains('open');
  $$('.qa').forEach(x=>x.classList.remove('open'));
  if(!open)qa.classList.add('open');
});

/* newsletter + link demo */
 $('#nlForm').addEventListener('submit',e=>{
  e.preventDefault();
  const v=$('#nlEmail').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){toast('Alamat email tidak valid',false);return}
  toast(`Berhasil — notifikasi dikirim ke ${v}`);
  $('#nlEmail').value='';
});
 $$('[data-soon]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault(); toast(`${a.dataset.soon} — segera hadir`);
}));

/* menu mobile */
 $('#menuBtn').onclick=()=>{$('#mnav').classList.add('open');document.documentElement.classList.add('lock')};
const closeMenu=()=>{$('#mnav').classList.remove('open');document.documentElement.classList.remove('lock')};
 $('#menuClose').onclick=closeMenu;
 $$('#mnav a.big').forEach(a=>a.addEventListener('click',closeMenu));

/* ================= MARQUEE ================= */
(function(){
  const items=['GRATIS ONGKIR VIA DARAT MIN. RP 300.000','GARANSI RESMI 12 BULAN','ORDER AGEN: COD & CICILAN SD 3×','KIRIM VIA DARAT / LAUT / UDARA','PESAN SEBELUM 15.00 — DIKIRIM HARI INI'];
  const unit=items.map(t=>`<span>${t}</span><span class="mdot"></span>`).join('');
  $('#marqTrack').innerHTML=unit.repeat(6);
})();

/* ================= JAM ================= */
const fmt=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
loadProductsFromSheet();

function tick(){$$('.jsClock').forEach(c=>c.textContent=fmt.format(new Date())+' WIB')}
tick(); setInterval(tick,1000);

/* ================= REVEAL ================= */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
}),{threshold:.1});
 $$('[data-reveal]').forEach(el=>io.observe(el));

/* ================= FOTO HERO ================= */
(function(){
  const put=(sel,p)=>{const el=$(sel); if(el)el.innerHTML=
    `${art(p)}<div class="htag"><b>${p.name}</b><span>${idr(p.price)}</span></div>`;
    const im=el&&el.querySelector('img'); if(im)im.onerror=()=>{el.style.display='none'};
  };
  put('#hf1',byId('p1')); put('#hf2',byId('p13')); put('#hf3',byId('p16'));
})();

/* ================= INIT ================= */
renderCats(); renderGrid(); renderCart(); updateBadge(); showView('cart'); icons();
