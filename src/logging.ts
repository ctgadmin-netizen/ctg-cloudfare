/** CTG Market secure RFQ Worker logging utilities. */
import type { LogEntry, Invitation } from "./types";

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function logAccess(token:string|null,result:"success"|"failure",reason:string,invitation:Invitation|null,message:string):Promise<void>{
  const entry:LogEntry={timestamp:new Date().toISOString(),tokenHash:token?await hashToken(token):null,result,reason,linkStatus:invitation?.linkStatus??null,invitationId:invitation?.recordId??null,supplierId:invitation?.supplierId??null,rfqId:invitation?.rfqId??null,message};
  console.log(JSON.stringify(entry));
}

export function logError(context:string,error:unknown):void{
  const detail=error instanceof Error?error.message:String(error);
  console.error(JSON.stringify({timestamp:new Date().toISOString(),context,error:detail}));
}
