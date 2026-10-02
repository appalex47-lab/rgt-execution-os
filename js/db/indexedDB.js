const NAME="rgt-execution-os",VERSION=1,STORES=["sprints","initiatives","checklist","evidence","deepWork","activity"];
export const db={
  _db:null,
  async open(){
    this._db=await new Promise((res,rej)=>{
      const r=indexedDB.open(NAME,VERSION);
      r.onupgradeneeded=()=>STORES.forEach(s=>{if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:"id"})});
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)
    })
  },
  async all(s){return new Promise((res,rej)=>{const r=this._db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async put(s,x){return new Promise((res,rej)=>{const t=this._db.transaction(s,"readwrite");t.objectStore(s).put(x);t.oncomplete=()=>res(x);t.onerror=()=>rej(t.error)})},
  async snapshot(){const a={};for(const s of STORES)a[s]=await this.all(s);return a}
};
