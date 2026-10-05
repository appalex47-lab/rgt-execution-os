/** Collision-safe initiative ids: <pillar initial><5 digits><random digit>, checked against existing ids. */
export function newInitiativeId(pillar, items = []) {
  const taken = new Set(items.map(x => x.id));
  let id;
  do { id = `${String(pillar)[0]}${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`; } while (taken.has(id));
  return id;
}
