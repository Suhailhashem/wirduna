const BASE='https://lqcfjirymcdewcajikmf.supabase.co/rest/v1';
const PUBLIC_KEY='sb_publishable_5kUVO-iYAkCxKqNtK65-cQ_zpX-g7xe';
const FAMILY_KEY='wirduna-family-access',ADMIN_KEY='wirduna-admin-access';
export function readLocal(key){try{return localStorage.getItem(key);}catch{return null;}}
export function writeLocal(key,value){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value);return true;}catch{return false;}}
const invite=new URLSearchParams(location.hash.slice(1));
let family=invite.get('invite')||readLocal(FAMILY_KEY)||'';
let admin=invite.get('admin')||readLocal(ADMIN_KEY)||'';
if(invite.has('invite')){writeLocal(FAMILY_KEY,family);if(invite.has('admin'))writeLocal(ADMIN_KEY,admin);history.replaceState(null,'',location.pathname+location.search+'#today');}
export const hasAccess=()=>/^[a-f0-9]{64}$/.test(family);
export const hasAdmin=()=>/^[a-f0-9]{64}$/.test(admin);
export async function api(path,options={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
  try{
    const response=await fetch(BASE+'/'+path,{...options,signal:controller.signal,headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json','x-family-token':family,'x-admin-token':admin,...options.headers},cache:'no-store'});
    const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{throw new Error('تعذر قراءة استجابة الخادم. حاول مرة أخرى.');}
    if(!response.ok){const error=new Error(data?.message||'تعذر الاتصال بالخادم');error.status=response.status;throw error;}
    return data;
  }finally{clearTimeout(timer);}
}
export async function allRows(path){const result=[];for(let offset=0;offset<100000;offset+=1000){const rows=await api(path+(path.includes('?')?'&':'?')+'limit=1000&offset='+offset);result.push(...rows);if(rows.length<1000)return result;}throw Error('السجل كبير جدًا. تواصل مع مدير الموقع.');}
export async function snapshot(){
  const [people,rows,posts]=await Promise.all([api('wirduna_members?select=*&order=position.asc,id.asc'),allRows('wirduna_readings?select=*&order=day.asc,member_id.asc'),api('wirduna_post?select=*&id=eq.1')]);
  if(!people.length||!posts.length)throw Error('ACCESS_DENIED');
  return {people:people.map(p=>({...p,entries:rows.filter(r=>r.member_id===p.id).flatMap(r=>{const out=[];let n=r.total;while(n>0){const count=Math.min(604,n);out.push({day:r.day,count,at:Date.parse(r.updated_at)});n-=count;}return out;})})),rows,post:posts[0]};
}
export async function record(request){return api('rpc/wirduna_record',{method:'POST',body:JSON.stringify(request)});}
export function friendlyError(error){
  const text=String(error?.message||'');
  if(text.includes('STALE_READING'))return 'تغيّرت القراءة من جهاز آخر. حدّث الصفحة وراجع الإجمالي قبل تصحيحه.';
  if(text.includes('DAY_CHANGED'))return 'بدأ يوم جديد. حدّث الصفحة ثم أعد تسجيل القراءة.';
  if(text.includes('INVALID_RANGE'))return 'نطاق الصفحات لا يطابق عدد الأوجه.';
  if(text.includes('DAILY_LIMIT'))return 'تجاوز الإجمالي الحد اليومي المسموح. راجع القراءات المسجّلة.';
  if(text.includes('ACCESS_DENIED')||error?.status===401||error?.status===403)return 'رابط الدخول غير صالح. افتح رابط العائلة الذي أرسله سهيل.';
  if(text.includes('INVALID_COUNT'))return 'أدخل عددًا صحيحًا بين ١ و٦٠٤.';
  return 'تعذّر تأكيد الاتصال. لا تغلق الصفحة؛ اضغط إعادة المحاولة للتأكد من الحفظ دون تكراره.';
}
