function adminToken(){let t=sessionStorage.getItem('cm_token');if(!t){t=prompt('Masukkan PIN admin');if(t)sessionStorage.setItem('cm_token',t)}return t||''}
function resetToken(){sessionStorage.removeItem('cm_token')}
