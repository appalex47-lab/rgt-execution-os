const NAME="rgt-execution-os",VERSION=4,STORES=["sprints","initiatives","checklist","evidence","deepWork","reviews","activity"];
export const db={
  _db:null,
  async open(){
    this._db=await new Promise((res,rej)=>{
      const r=indexedDB.open(NAME,VERSION);
      r.onupgradeneeded=()=>STORES.forEach(s=>{if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:"id"})});
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)
    })
    await this.migrate()
  },
  async migrate(){
    const sprints=await this.all("sprints");
    if(sprints.length){
      const ordered=sprints.slice().sort((a,b)=>String(a.start_date||"").localeCompare(String(b.start_date||"")));
      for(let idx=0;idx<ordered.length;idx++){
        const s=ordered[idx];
        const u={...s,status:s.status|| (idx===ordered.length-1?"ACTIVE":"CLOSED"),
          start_date:s.start_date||"2026-09-28",end_date:s.end_date||"2026-10-04",
          month_start:s.month_start||"2026-10-01",month_end:s.month_end||"2026-10-31",
          monthly_target_revenue:Number(s.monthly_target_revenue||s.target_revenue||0),
          must_win_ids:Array.isArray(s.must_win_ids)?s.must_win_ids:[]};
        if(!u.must_win_ids.length){
          const initiatives=await this.all("initiatives");
          u.must_win_ids=initiatives.filter(x=>x.is_must_win).map(x=>x.id);
        }
        await this.put("sprints",u);
      }
    }
  },
  async all(s){return new Promise((res,rej)=>{const r=this._db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async put(s,x){return new Promise((res,rej)=>{const t=this._db.transaction(s,"readwrite");t.objectStore(s).put(x);t.oncomplete=()=>res(x);t.onerror=()=>rej(t.error)})},
  async snapshot(){const a={};for(const s of STORES)a[s]=await this.all(s);return a},
  async replaceSnapshot(snapshot){
    const valid=STORES.every(s=>Array.isArray(snapshot?.[s]));
    if(!valid)throw new Error('Snapshot incompleto.');
    await new Promise((res,rej)=>{
      const t=this._db.transaction(STORES,'readwrite');
      for(const s of STORES){const os=t.objectStore(s);os.clear();for(const item of snapshot[s])os.put(item)}
      t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('Importación abortada.'));
    });
    await this.migrate();
  }
};
