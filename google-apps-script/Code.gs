/**
 * UNIT Supply V2 - Google Sheets API
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
function doGet(e){
  setup();
  const action=(e && e.parameter && e.parameter.action)||'health';
  if(action==='health') return json_({ok:true,service:'UNIT Supply API',time:new Date().toISOString()});
  if(action==='products') return json_({ok:true,products:getProducts_()});
  if(action==='dashboard') return getDashboard_();
  if(action==='orders') return getOrders_(e.parameter.status||'');
  if(action==='tracking') return getTracking_(e.parameter.orderNo||'', e.parameter.wa||'');
  return json_({ok:false,error:'Unknown action'});
}
function doPost(e){
  try{
    setup();
    const data=JSON.parse((e.postData&&e.postData.contents)||'{}');
    if(data.action==='order') return saveOrder_(data);
    if(data.action==='updateStatus') return updateStatus_(data);
    return json_({ok:false,error:'Unknown action'});
  }catch(err){ return json_({ok:false,error:String(err)}); }
}
function getProducts_(){
  const sh=ss_().getSheetByName('PRODUK');
  const values=sh.getDataRange().getValues(); if(values.length<2) return [];
  const h=values.shift().map(String);
  return values.filter(r=>r[0]).map(r=>{
    const o={}; h.forEach((k,i)=>o[k]=r[i]);
    o.price=Number(o.price)||0; o.old=Number(o.old)||0; o.rating=String(o.rating||''); o.hot=String(o.hot).toLowerCase()==='true'; o.specs=String(o.specs||'').split('||').filter(Boolean); o.stok=o.stok===''?null:Number(o.stok); return o;
  });
}
function saveOrder_(d){
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const no=d.orderNo||('UNIT-AG-'+Utilities.getUuid().slice(0,8).toUpperCase());
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
    return json_({ok:true,orderNo:no});
  } finally { lock.releaseLock(); }
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
function updateStatus_(d){
  const allowed=['BARU','DIPROSES','DIKIRIM','SELESAI','DIBATALKAN'];
  const no=String(d.orderNo||'').trim(); const status=String(d.status||'').trim().toUpperCase();
  if(!no||!allowed.includes(status)) return json_({ok:false,error:'Data status tidak valid'});
  const sh=ss_().getSheetByName('PESANAN'); const values=sh.getDataRange().getValues(); const h=values[0].map(String); const noC=h.indexOf('orderNo'), stC=h.indexOf('status');
  if(noC<0||stC<0) return json_({ok:false,error:'Kolom pesanan tidak lengkap'});
  for(let i=1;i<values.length;i++){if(String(values[i][noC]).trim()===no){sh.getRange(i+1,stC+1).setValue(status);return json_({ok:true,orderNo:no,status});}}
  return json_({ok:false,error:'Pesanan tidak ditemukan'});
}
