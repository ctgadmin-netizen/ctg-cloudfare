import type { Env, AirtableRecord, Invitation, LinkStatus } from "./types";
import { AIRTABLE_FIELDS, RFQ_FIELDS } from "./config";
import { logError } from "./logging";
const API = "https://api.airtable.com/v0";

async function airtableFetch(env: Env, url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parseInt(env.AIRTABLE_TIMEOUT_MS || "8000", 10));
  try {
    return await fetch(url, { ...init, headers: { Authorization:`Bearer ${env.AIRTABLE_API_TOKEN}`, "Content-Type":"application/json", ...(init.headers||{}) }, signal:controller.signal });
  } finally { clearTimeout(timeout); }
}
function tableUrl(env:Env, table:string){ return `${API}/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`; }

export async function findInvitationByToken(env:Env, token:string):Promise<Invitation|null>{
  try {
    const safe = token.replace(/'/g,"\\'");
    const formula = encodeURIComponent(`{${AIRTABLE_FIELDS.TOKEN}} = '${safe}'`);
    const r = await airtableFetch(env, `${tableUrl(env,env.AIRTABLE_TABLE_NAME)}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`);
    if(!r.ok){ logError("Airtable findInvitationByToken",{status:r.status}); return null; }
    const data = await r.json() as {records:AirtableRecord[]};
    return data.records?.[0] ? normalizeInvitation(data.records[0]) : null;
  } catch(e){ logError("Airtable findInvitationByToken",e); return null; }
}
export async function getInvitationById(env:Env,id:string):Promise<Invitation|null>{
  if(!/^rec[a-zA-Z0-9]+$/.test(id)) return null;
  try { const r=await airtableFetch(env,`${tableUrl(env,env.AIRTABLE_TABLE_NAME)}/${id}?returnFieldsByFieldId=true`); if(!r.ok)return null; return normalizeInvitation(await r.json() as AirtableRecord); } catch(e){logError("getInvitationById",e);return null;}
}
export async function getRfq(env:Env,id:string):Promise<{status:string|null;deadline:string|null}|null>{
  if(!/^rec[a-zA-Z0-9]+$/.test(id)) return null;
  try { const r=await airtableFetch(env,`${tableUrl(env,env.AIRTABLE_RFQ_TABLE_NAME)}/${id}?returnFieldsByFieldId=true`); if(!r.ok)return null; const d=await r.json() as AirtableRecord; return {status:typeof d.fields[RFQ_FIELDS.STATUS]==="string"?d.fields[RFQ_FIELDS.STATUS] as string:null,deadline:typeof d.fields[RFQ_FIELDS.RESPONSE_DEADLINE]==="string"?d.fields[RFQ_FIELDS.RESPONSE_DEADLINE] as string:null}; } catch(e){logError("getRfq",e);return null;}
}
export async function updateInvitation(env:Env,id:string,fields:Record<string,unknown>):Promise<boolean>{
  try { const r=await airtableFetch(env,`${tableUrl(env,env.AIRTABLE_TABLE_NAME)}/${id}`,{method:"PATCH",body:JSON.stringify({fields})}); if(!r.ok)logError("updateInvitation",{status:r.status}); return r.ok; } catch(e){logError("updateInvitation",e);return false;}
}
export async function markAccess(env:Env,id:string):Promise<void>{ await updateInvitation(env,id,{[AIRTABLE_FIELDS.LAST_ACCESS_AT]:new Date().toISOString()}); }

function normalizeInvitation(record:AirtableRecord):Invitation{
 const f=record.fields; const s=(k:string)=>{const v=f[k]; if(v==null)return null;if(Array.isArray(v))return v.length?String(v[0]):null;return String(v)}; const b=(k:string)=>f[k]===true||f[k]===1||f[k]==="1"||f[k]==="true"; const n=(k:string)=>Number(f[k]??0)||0;
 return {recordId:record.id,token:s(AIRTABLE_FIELDS.TOKEN)??"",linkVersion:n(AIRTABLE_FIELDS.LINK_VERSION),linkStatus:(s(AIRTABLE_FIELDS.LINK_STATUS)??"Revoked") as LinkStatus,expiresAt:s(AIRTABLE_FIELDS.EXPIRES_AT),releaseEligible:b(AIRTABLE_FIELDS.RELEASE_ELIGIBLE),rfqId:s(AIRTABLE_FIELDS.RFQ_ID),rfqStatus:null,supplierId:s(AIRTABLE_FIELDS.SUPPLIER_ID),supplierName:s(AIRTABLE_FIELDS.SUPPLIER_NAME),supplierPhone:s(AIRTABLE_FIELDS.SUPPLIER_PHONE),resendCount:n(AIRTABLE_FIELDS.RESEND_COUNT)};
}
