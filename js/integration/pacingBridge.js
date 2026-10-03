export const pacingBridge={
 version:'1.0',
 receive(payload){
  if(!payload||payload.type!=='RGT_PACING_UPDATE'||!payload.data) return null;
  const d=payload.data;
  return {source:d.source||'RevNavigator',asOf:d.asOf||new Date().toISOString(),target:Number(d.target||0),actual:Number(d.actual||0),conversionRate:d.conversionRate==null?null:Number(d.conversionRate),aov:d.aov==null?null:Number(d.aov),remainingDays:d.remainingDays==null?null:Number(d.remainingDays)};
 },
 postTo(parent=window.parent){ parent?.postMessage?.({type:'RGT_PACING_READY',version:this.version},'*'); }
};
