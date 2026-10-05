const NAME="rgt-execution-os",VERSION=5,CORE_STORES=["sprints","initiatives","checklist","evidence","deepWork","reviews","activity"],STORES=[...CORE_STORES,"learning","prefs"];
export const DB_NAME=NAME,DB_VERSION=VERSION,STORE_NAMES=STORES;
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
  /**
   * Idempotent, non-destructive schema normalisation. It never invents calendar data and
   * only writes a sprint when something actually changes. Legacy commercial fields are kept as-is.
   */
  async migrate(){
    const sprints=await this.all("sprints");
    if(!sprints.length)return;
    const initiatives=await this.all("initiatives");
    const ordered=sprints.slice().sort((a,b)=>String(a.start_date||"").localeCompare(String(b.start_date||"")));
    const hasActive=ordered.some(s=>s.status==="ACTIVE");
    for(let idx=0;idx<ordered.length;idx++){
      const s=ordered[idx];
      const u={...s};
      if(!u.status)u.status=(!hasActive&&idx===ordered.length-1)?"ACTIVE":"CLOSED";
      if(!Array.isArray(u.must_win_ids))u.must_win_ids=initiatives.filter(x=>x.is_must_win).map(x=>x.id);
      if(JSON.stringify(u)!==JSON.stringify(s))await this.put("sprints",u);
    }
  },
  async all(s){return new Promise((res,rej)=>{const r=this._db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async put(s,x){return new Promise((res,rej)=>{const t=this._db.transaction(s,"readwrite");t.objectStore(s).put(x);t.oncomplete=()=>res(x);t.onerror=()=>rej(t.error)})},
  async snapshot(){const a={};for(const s of STORES)a[s]=await this.all(s);return a},
  async replaceSnapshot(snapshot){
    if(!CORE_STORES.every(s=>Array.isArray(snapshot?.[s])))throw new Error('Snapshot incompleto.');
    snapshot={...snapshot};for(const s of STORES)if(!Array.isArray(snapshot[s]))snapshot[s]=[];
    await new Promise((res,rej)=>{
      const t=this._db.transaction(STORES,'readwrite');
      for(const s of STORES){const os=t.objectStore(s);os.clear();for(const item of snapshot[s])os.put(item)}
      t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('Importación abortada.'));
    });
    await this.migrate();
  }
};
