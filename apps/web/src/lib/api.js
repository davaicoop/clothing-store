export async function api(path, options={}) {
  let response;
  try {
    response=await fetch(`/api${path}`,{
      credentials:'same-origin',...options,
      headers:{'Content-Type':'application/json','X-Requested-With':'clothing-store',...options.headers},
      ...(options.body?{body:JSON.stringify(options.body)}:{}),
    });
  } catch {throw new Error('Could not reach the shop. Check your connection and try again.');}
  const data=await response.json().catch(()=>({error:'The shop is temporarily unavailable. Please try again.'}));
  if(!response.ok) {const error=new Error(data.error||'The request could not be completed.');error.status=response.status;throw error;}
  return data;
}
export function readStorage(key,fallback) {try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function writeStorage(key,value) {try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Browsing still works with restricted storage. */}}
export function whatsappLink(phone,message) {
  if(!phone)return null;
  return `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
}
export const formatDate=(value,includeTime=false)=>value?new Intl.DateTimeFormat('en-KE',{timeZone:'Africa/Nairobi',day:'numeric',month:'short',year:'numeric',...(includeTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(value)):'—';
export const colorValue=color=>({Black:'#252525',White:'#fff',Blue:'#7496b8',Navy:'#29374e',Olive:'#7c846a',Cream:'#eee8da',Rose:'#c8929e',Grey:'#b0b0b0'}[color]||'#9e8c7a');
