/**
 * Coffemur V2 - Google Sheets API
 *
 * 1. Buka Extensions > Apps Script dari Google Sheet.
 * 2. Ganti kode dengan isi file ini.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Salin URL /exec ke js/config.js.
 *
 * Sheet yang dibuat otomatis:
 * - PRODUK
 * - PESANAN
 * - DETAIL_PESANAN
 *
 * Kolom PRODUK:
 * id | no | name | cat | price | old | rating | sold | tag | badge | hot | img | specs | status | stok
 */
const SPREADSHEET_ID = '1-t04oImAo1x4fmhPI5zqrbQ4aKLVwugkwP73ExC6nM4';

function ss_(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function json_(data){
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function sheet_(name, headers){
  const ss=ss_(); let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}
function setup(){
  sheet_('PRODUK',['id','no','name','cat','price','old','rating','sold','tag','badge','hot','img','specs','status','stok']);
  sheet_('PESANAN',['orderNo','tanggal','nama','whatsapp','kota','alamat','pengiriman','pembayaran','tenor','subtotal','ongkir','dp','sisa','total','status']);
  sheet_('DETAIL_PESANAN',['orderNo','productId','productName','qty','harga','subtotal']);
  return 'OK';
}
// PIN admin. Ganti sesuai keinginan, lalu Save dan Deploy versi baru.
const ADMIN_PIN = 'admin5858';
function auth_(t){ return String(t||'').trim()===ADMIN_PIN; }

/* ================= WHATSAPP OTOMATIS (Fonnte) =================
 * Setiap order masuk, invoice PDF otomatis dikirim dari WA toko ke WA pemesan.
 * 1. Daftar di fonnte.com, hubungkan nomor WA toko (scan QR), salin TOKEN device.
 * 2. Tempel token di FONNTE_TOKEN di bawah. Save.
 * 3. Jalankan fungsi testKirimWa sekali (izinkan akses), lalu Deploy > New version.
 * Jika token kosong / gagal kirim, order TETAP tersimpan; hasilnya tercatat di sheet LOG_WA.
 */
const FONNTE_TOKEN = 'REvq1pL9JYDyJzyZhU2P';                       // <-- tempel token Fonnte di sini
const WA_STORE_NAME = 'Coffemur';
const WA_SITE_URL = 'https://cofemurdigital-jpg.github.io/Coffemur/';                        // opsional, cth. https://namamu.github.io/toko (untuk link lacak pesanan)

function rp_(n){ return 'Rp '+String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function esc_(v){ return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function waNumber_(raw){
  let n=String(raw||'').replace(/[^0-9]/g,'');
  if(n.startsWith('0')) n='62'+n.slice(1);
  else if(n.startsWith('8')) n='62'+n;
  return n;
}
function invoiceBlob_(no,d){
  const t=d.totals||{}, c=d.customer||{};
  const tgl=Utilities.formatDate(new Date(),'Asia/Jakarta','dd MMM yyyy, HH:mm')+' WIB';
  const rows=(d.items||[]).map(it=>'<tr><td style="border-bottom:1px solid #E5E7EB">'+esc_(it.name)+'</td><td align="center" style="border-bottom:1px solid #E5E7EB">'+Number(it.qty)+'</td><td align="right" style="border-bottom:1px solid #E5E7EB">'+rp_(it.price)+'</td><td align="right" style="border-bottom:1px solid #E5E7EB">'+rp_(it.qty*it.price)+'</td></tr>').join('');
  const line=(a,b,bold)=>'<tr><td style="padding:3px 0;'+(bold?'font-weight:bold;font-size:14px':'color:#6F7278')+'">'+a+'</td><td align="right" style="padding:3px 0;'+(bold?'font-weight:bold;font-size:14px;color:#03AC0E':'')+'">'+b+'</td></tr>';
  const html='<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1B2229;padding:28px">'
   +'<table width="100%"><tr><td><div style="font-size:24px;font-weight:bold;color:#03AC0E">'+esc_(WA_STORE_NAME).toUpperCase()+'</div><div style="color:#6F7278">Indonesia</div></td>'
   +'<td align="right"><div style="font-size:20px;font-weight:bold">INVOICE</div><div style="font-weight:bold">'+esc_(no)+'</div><div style="color:#6F7278">'+tgl+'</div></td></tr></table>'
   +'<hr style="border:0;border-top:1px solid #E5E7EB;margin:14px 0">'
   +'<div style="color:#6F7278;font-size:10px">DITAGIHKAN KEPADA</div>'
   +'<div style="font-weight:bold;font-size:14px">'+esc_(c.name)+'</div>'
   +'<div>'+esc_(c.wa)+'</div><div>'+esc_(c.addr)+', '+esc_(c.city)+'</div><br>'
   +'<table width="100%" cellspacing="0" cellpadding="7" style="border-collapse:collapse"><thead><tr style="background:#E8F8EB">'
   +'<th align="left">Produk</th><th align="center">Qty</th><th align="right">Harga</th><th align="right">Subtotal</th></tr></thead><tbody>'+rows+'</tbody></table><br>'
   +'<table width="55%" align="right" cellspacing="0">'
   +line('Subtotal',rp_(t.sub))+line('Ongkir ('+esc_(d.shipping&&d.shipping.label)+')',t.ship?rp_(t.ship):'Gratis')
   +(t.dp?line('DP 30% (dibayar saat pesan)',rp_(t.dp)):'')
   +line('Total',rp_(t.total),true)
   +(t.dp?line('Sisa'+(d.tenor?' (cicil '+d.tenor+'x)':''),rp_(t.sisa)):'')
   +'</table><div style="clear:both"></div><br><br>'
   +'<div style="color:#6F7278">Metode pembayaran: <b style="color:#1B2229">'+esc_(d.payment&&d.payment.label)+'</b><br>Pengiriman: <b style="color:#1B2229">'+esc_(d.shipping&&d.shipping.label)+(d.shipping&&d.shipping.eta?' · '+esc_(d.shipping.eta):'')+'</b></div>'
   +'<p style="margin-top:28px;color:#6F7278;font-size:10px">Terima kasih telah berbelanja di '+esc_(WA_STORE_NAME)+'. Dokumen ini dibuat otomatis.</p>'
   +'</body></html>';
  return Utilities.newBlob(html,'text/html',no+'.html').getAs('application/pdf').setName('Invoice-'+no+'.pdf');
}
function waLog_(no,target,ok,info){
  try{ sheet_('LOG_WA',['waktu','orderNo','tujuan','status','keterangan']).appendRow([new Date(),no,target,ok?'TERKIRIM':'GAGAL',String(info||'').slice(0,300)]); }catch(_){}
}
function sendOrderWa_(no,d){
  const target=waNumber_(d.customer&&d.customer.wa);
  try{
    if(!FONNTE_TOKEN) throw new Error('FONNTE_TOKEN belum diisi');
    if(target.length<10) throw new Error('Nomor WA tidak valid');
    const t=d.totals||{};
    const msg='Halo *'+(d.customer&&d.customer.name||'')+'*, terima kasih sudah order di *'+WA_STORE_NAME+'* 🙏\n\n'
      +'Pesanan Agen kamu sudah kami terima.\n'
      +'No. Order: *'+no+'*\n'
      +'Total: *'+rp_(t.total)+'*'+(t.dp?'\nDP 30% sekarang: '+rp_(t.dp):'')+'\n'
      +'Pengiriman: '+(d.shipping&&d.shipping.label||'-')+'\n\n'
      +'Invoice PDF terlampir. Instruksi pembayaran akan dikirim tim kami di chat ini maksimal 1×24 jam.'
      +(WA_SITE_URL?'\n\nLacak pesanan: '+WA_SITE_URL.replace(/\/$/,'')+'/tracking.html':'');
    const pdf=invoiceBlob_(no,d);
    const res=UrlFetchApp.fetch('https://api.fonnte.com/send',{
      method:'post',
      headers:{Authorization:FONNTE_TOKEN},
      payload:{target:target,message:msg,file:pdf,filename:'Invoice-'+no+'.pdf',countryCode:'62'},
      muteHttpExceptions:true
    });
    const body=res.getContentText(); let j={}; try{j=JSON.parse(body)}catch(_){}
    if(res.getResponseCode()!==200 || j.status===false) throw new Error(j.reason||body||('HTTP '+res.getResponseCode()));
    waLog_(no,target,true,body);
    return {sent:true};
  }catch(err){
    waLog_(no,target,false,err&&err.message||err);
    return {sent:false,reason:String(err&&err.message||err)};
  }
}
// Jalankan sekali dari editor: mengizinkan akses & mengirim invoice contoh ke WA toko.
function testKirimWa(){
  const wa=(typeof STORE_WA_TEST!=='undefined'?STORE_WA_TEST:'628980222087');
  const r=sendOrderWa_('COFFEMUR-AG-TEST',{customer:{name:'Tes Coffemur',wa:wa,city:'Makassar',addr:'Jl. Contoh No. 1'},shipping:{label:'Via Darat',eta:'2–5 hari kerja'},payment:{label:'Transfer'},tenor:'',
    totals:{sub:100000,ship:15000,dp:0,sisa:115000,total:115000},items:[{name:'Produk Contoh',qty:2,price:50000}]});
  Logger.log(JSON.stringify(r)); return r;
}
function doGet(e){
  setup();
  const action=(e && e.parameter && e.parameter.action)||'health';
  if(['dashboard','report','orders','adminProducts'].includes(action) && !auth_(e.parameter.token)) return json_({ok:false,error:'Unauthorized'});
  if(action==='adminProducts') return json_({ok:true,products:getProducts_(true)});
  if(action==='health') return json_({ok:true,service:'Coffemur API',time:new Date().toISOString()});
  if(action==='products') return json_({ok:true,products:getProducts_()});
  if(action==='dashboard') return getDashboard_();
  if(action==='report') return getReport_(e.parameter.month||'');
  if(action==='invoice') return getInvoice_(e.parameter.orderNo||'', e.parameter.wa||'');
  if(action==='orders') return getOrders_(e.parameter.status||'');
  if(action==='tracking') return getTracking_(e.parameter.orderNo||'', e.parameter.wa||'');
  return json_({ok:false,error:'Unknown action'});
}
function doPost(e){
  try{
    setup();
    const data=JSON.parse((e.postData&&e.postData.contents)||'{}');
    if(['updateStatus','saveProduct','deleteProduct'].includes(data.action) && !auth_(data.token)) return json_({ok:false,error:'Unauthorized'});
    if(data.action==='saveProduct') return saveProduct_(data);
    if(data.action==='deleteProduct') return deleteProduct_(data);
    if(data.action==='order') return saveOrder_(data);
    if(data.action==='updateStatus') return updateStatus_(data);
    return json_({ok:false,error:'Unknown action'});
  }catch(err){ return json_({ok:false,error:String(err)}); }
}
function getProducts_(all){
  const sh=ss_().getSheetByName('PRODUK');
  const values=sh.getDataRange().getValues(); if(values.length<2) return [];
  const h=values.shift().map(String);
  return values.filter(r=>r[0]).filter(r=>all||String(r[h.indexOf('status')]||'').toUpperCase()!=='NONAKTIF').map(r=>{
    const o={}; h.forEach((k,i)=>o[k]=r[i]);
    o.price=Number(o.price)||0; o.old=Number(o.old)||0; o.rating=String(o.rating||''); o.hot=String(o.hot).toLowerCase()==='true'; o.specs=String(o.specs||'').split('||').filter(Boolean); o.stok=o.stok===''?null:Number(o.stok); return o;
  });
}
function saveOrderRows_(d){
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const no=d.orderNo||('COFFEMUR-AG-'+Utilities.getUuid().slice(0,8).toUpperCase());
    const sh=ss_().getSheetByName('PESANAN');
    sh.appendRow([no,new Date(),d.customer?.name||'',d.customer?.wa||'',d.customer?.city||'',d.customer?.addr||'',d.shipping?.label||'',d.payment?.label||'',d.tenor||'',d.totals?.sub||0,d.totals?.ship||0,d.totals?.dp||0,d.totals?.sisa||0,d.totals?.total||0,'BARU']);
    const ds=ss_().getSheetByName('DETAIL_PESANAN');
    (d.items||[]).forEach(it=>ds.appendRow([no,it.id,it.name,it.qty,it.price,it.qty*it.price]));
    // Kurangi stok bila kolom stok diisi angka.
    const ps=ss_().getSheetByName('PRODUK'); const vals=ps.getDataRange().getValues(); const head=vals[0].map(String); const idc=head.indexOf('id'), stc=head.indexOf('stok');
    if(stc>=0){
      const rowById={}; for(let i=1;i<vals.length;i++) rowById[String(vals[i][idc])]=i+1;
      (d.items||[]).forEach(it=>{ const row=rowById[String(it.id)]; if(row){ const cell=ps.getRange(row,stc+1); const cur=cell.getValue(); if(cur!=='' && !isNaN(cur)) cell.setValue(Math.max(0,Number(cur)-Number(it.qty||0))); }});
    }
    return no;
  } finally { lock.releaseLock(); }
}
function saveOrder_(d){
  const no=saveOrderRows_(d);
  const wa=sendOrderWa_(no,d); // di luar lock; gagal kirim WA tidak membatalkan order
  return json_({ok:true,orderNo:no,wa:{sent:!!wa.sent}});
}


function rows_(name){
  const sh=ss_().getSheetByName(name); if(!sh) return [];
  const values=sh.getDataRange().getValues(); if(values.length<2) return [];
  const h=values.shift().map(String);
  return values.filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o;});
}
function getOrders_(status){
  let orders=rows_('PESANAN');
  if(status) orders=orders.filter(o=>String(o.status||'')===status);
  orders.reverse();
  return json_({ok:true,orders:orders.slice(0,500).map(orderPublic_) });
}
function orderPublic_(o){
  const copy={...o};
  if(copy.tanggal instanceof Date) copy.tanggal=copy.tanggal.toISOString();
  copy.subtotal=Number(copy.subtotal)||0; copy.ongkir=Number(copy.ongkir)||0; copy.dp=Number(copy.dp)||0; copy.sisa=Number(copy.sisa)||0; copy.total=Number(copy.total)||0;
  return copy;
}
function getTracking_(orderNo,wa){
  orderNo=String(orderNo||'').trim(); wa=String(wa||'').replace(/[^0-9]/g,'');
  if(!orderNo) return json_({ok:false,error:'Nomor order wajib diisi'});
  const order=rows_('PESANAN').find(o=>String(o.orderNo).trim().toUpperCase()===orderNo.toUpperCase());
  if(!order) return json_({ok:false,error:'Pesanan tidak ditemukan'});
  const stored=String(order.whatsapp||'').replace(/[^0-9]/g,'');
  if(wa && stored!==wa) return json_({ok:false,error:'Nomor WhatsApp tidak cocok'});
  if(!wa) return json_({ok:false,error:'Nomor WhatsApp wajib diisi'});
  const items=rows_('DETAIL_PESANAN').filter(x=>String(x.orderNo)===String(order.orderNo)).map(x=>({name:x.productName,qty:Number(x.qty)||0,price:Number(x.harga)||0,subtotal:Number(x.subtotal)||0}));
  return json_({ok:true,order:orderPublic_(order),items});
}
function getDashboard_(){
  const orders=rows_('PESANAN');
  const detail=rows_('DETAIL_PESANAN');
  const products=getProducts_();
  const countStatus=s=>orders.filter(o=>String(o.status||'BARU')===s).length;
  const omzet=orders.filter(o=>String(o.status||'')!=='DIBATALKAN').reduce((n,o)=>n+(Number(o.total)||0),0);
  const todayKey=Utilities.formatDate(new Date(), Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd');
  const today=orders.filter(o=>o.tanggal && Utilities.formatDate(new Date(o.tanggal),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd')===todayKey);
  const sold={}; detail.forEach(x=>{const k=String(x.productName||'Tanpa Nama');sold[k]=(sold[k]||0)+(Number(x.qty)||0)});
  const best=Object.entries(sold).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,qty])=>({name,qty}));
  const low=products.filter(p=>p.stok!==null && Number(p.stok)<=5).map(p=>({id:p.id,name:p.name,stok:Number(p.stok)}));
  return json_({ok:true,stats:{orders:orders.length,new:countStatus('BARU'),processing:countStatus('DIPROSES'),shipped:countStatus('DIKIRIM'),done:countStatus('SELESAI'),cancelled:countStatus('DIBATALKAN'),omzet,todayOrders:today.length,todayOmzet:today.reduce((n,o)=>n+(Number(o.total)||0),0)},best,low,orders:orders.slice(-10).reverse().map(orderPublic_)});
}

function getReport_(month){
  const tz=Session.getScriptTimeZone()||'Asia/Jakarta';
  month=String(month||Utilities.formatDate(new Date(),tz,'yyyy-MM'));
  const orders=rows_('PESANAN').filter(o=>{
    if(!o.tanggal) return false;
    return Utilities.formatDate(new Date(o.tanggal),tz,'yyyy-MM')===month;
  });
  const valid=orders.filter(o=>String(o.status||'')!=='DIBATALKAN');
  const omzet=valid.reduce((n,o)=>n+(Number(o.total)||0),0);
  const byStatus={}; valid.forEach(o=>{const s=String(o.status||'BARU');byStatus[s]=(byStatus[s]||0)+1;});
  const byDay={}; valid.forEach(o=>{const d=Utilities.formatDate(new Date(o.tanggal),tz,'dd');byDay[d]=(byDay[d]||0)+(Number(o.total)||0);});
  const byPayment={}; valid.forEach(o=>{const k=String(o.pembayaran||'Lainnya');byPayment[k]=(byPayment[k]||0)+(Number(o.total)||0);});
  return json_({ok:true,month,stats:{orders:orders.length,validOrders:valid.length,cancelled:orders.length-valid.length,omzet,average:valid.length?omzet/valid.length:0},byStatus,byDay,byPayment});
}
function getInvoice_(orderNo,wa){
  orderNo=String(orderNo||'').trim(); wa=String(wa||'').replace(/[^0-9]/g,'');
  const order=rows_('PESANAN').find(o=>String(o.orderNo).trim().toUpperCase()===orderNo.toUpperCase());
  if(!order) return json_({ok:false,error:'Pesanan tidak ditemukan'});
  const stored=String(order.whatsapp||'').replace(/[^0-9]/g,'');
  if(!wa || stored!==wa) return json_({ok:false,error:'Nomor WhatsApp tidak cocok'});
  const items=rows_('DETAIL_PESANAN').filter(x=>String(x.orderNo)===String(order.orderNo)).map(x=>({name:x.productName,qty:Number(x.qty)||0,price:Number(x.harga)||0,subtotal:Number(x.subtotal)||0}));
  return json_({ok:true,order:orderPublic_(order),items,store:{name:'Coffemur',city:'Indonesia'}});
}

function updateStatus_(d){
  const allowed=['BARU','DIPROSES','DIKIRIM','SELESAI','DIBATALKAN'];
  const no=String(d.orderNo||'').trim(); const status=String(d.status||'').trim().toUpperCase();
  if(!no||!allowed.includes(status)) return json_({ok:false,error:'Data status tidak valid'});
  const sh=ss_().getSheetByName('PESANAN'); const values=sh.getDataRange().getValues(); const h=values[0].map(String); const noC=h.indexOf('orderNo'), stC=h.indexOf('status');
  if(noC<0||stC<0) return json_({ok:false,error:'Kolom pesanan tidak lengkap'});
  for(let i=1;i<values.length;i++){if(String(values[i][noC]).trim()===no){sh.getRange(i+1,stC+1).setValue(status);return json_({ok:true,orderNo:no,status});}}
  return json_({ok:false,error:'Pesanan tidak ditemukan'});
}

function saveProduct_(d){
  const p=d.product||{};
  if(!p.name||!p.cat||!(Number(p.price)>0)) return json_({ok:false,error:'Nama, kategori, dan harga wajib diisi'});
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const sh=ss_().getSheetByName('PRODUK'); const v=sh.getDataRange().getValues(); const h=v[0].map(String);
    let row=0; if(p.id){ for(let i=1;i<v.length;i++) if(String(v[i][0])===String(p.id)){row=i+1;break;} }
    if(!row){ p.id='p'+Date.now().toString(36); p.no=String(v.length).padStart(3,'0'); if(p.rating===undefined)p.rating='5.0'; if(p.sold===undefined)p.sold='0'; }
    if(Array.isArray(p.specs)) p.specs=p.specs.join('||');
    p.price=Number(p.price); p.old=Number(p.old)||''; p.stok=(p.stok===''||p.stok==null)?'':Number(p.stok);
    const out=h.map((k,i)=>p[k]===undefined?(row?v[row-1][i]:''):p[k]);
    if(row) sh.getRange(row,1,1,h.length).setValues([out]); else sh.appendRow(out);
    return json_({ok:true,id:p.id});
  } finally { lock.releaseLock(); }
}
function deleteProduct_(d){
  const sh=ss_().getSheetByName('PRODUK'); const v=sh.getDataRange().getValues();
  for(let i=1;i<v.length;i++) if(String(v[i][0])===String(d.id)){ sh.deleteRow(i+1); return json_({ok:true}); }
  return json_({ok:false,error:'Produk tidak ditemukan'});
}
