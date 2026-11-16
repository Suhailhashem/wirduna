export const TOTAL = 604;
export function streak(person, now = new Date()) {
  const days=new Set(person.entries.filter(e=>e.count>0).map(e=>e.day));
  const cursor=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  if(!days.has(localDay(cursor))) cursor.setDate(cursor.getDate()-1);
  let count=0;
  while(days.has(localDay(cursor))){count++;cursor.setDate(cursor.getDate()-1);}
  return count;
}
export function weekStats(person, now = new Date()) {
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  start.setDate(start.getDate()-((start.getDay()+1)%7));
  const from=localDay(start),to=localDay(now);
  const entries=person.entries.filter(e=>e.day>=from&&e.day<=to&&e.count>0);
  return {count:entries.reduce((sum,e)=>sum+e.count,0),days:new Set(entries.map(e=>e.day)).size};
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function totalRead(person) { return person.entries.reduce((n,e) => n+e.count,0); }
export function progress(person) {
  const total=totalRead(person), completed=Math.floor(total/TOTAL), current=total%TOTAL;
  return { total, completed, current, remaining:TOTAL-current, percent:Math.floor(current/TOTAL*100) };
}
export function todayRead(person, day=localDay()) { return person.entries.filter(e=>e.day===day).reduce((n,e)=>n+e.count,0); }
export function validateCount(value) { const n=Number(value); return Number.isInteger(n)&&n>=1&&n<=TOTAL; }
export function finishedDates(person) {
  let total=0; const dates=[];
  for(const entry of [...person.entries].sort((a,b)=>a.day.localeCompare(b.day)||a.at-b.at)) {
    const before=Math.floor(total/TOTAL); total+=entry.count;
    for(let n=before;n<Math.floor(total/TOTAL);n++) dates.push(entry.day);
  }
  return dates;
}
