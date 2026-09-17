import type {Env,ValidationResult} from "./types";
import {findInvitationByToken,getRfq,updateInvitation} from "./airtable";
import {AIRTABLE_FIELDS,RFQ_FIELDS} from "./config";
export async function validateToken(env:Env,token:string):Promise<ValidationResult>{
 const i=await findInvitationByToken(env,token); if(!i)return bad(null,"not_found","This secure RFQ link was not found.");
 if(i.linkStatus!=="Active")return bad(i,i.linkStatus==="Expired"?"expired":"not_active",i.linkStatus==="Used"?"This secure RFQ link has already been used.":i.linkStatus==="Expired"?"This secure RFQ link has expired.":"This secure RFQ link is no longer active.");
 if(!i.expiresAt||isNaN(new Date(i.expiresAt).getTime())||new Date(i.expiresAt)<=new Date()){ await updateInvitation(env,i.recordId,{[AIRTABLE_FIELDS.LINK_STATUS]:"Expired"}); return bad(i,"expired","This secure RFQ link has expired."); }
 if(!i.releaseEligible)return bad(i,"not_release_eligible","This secure RFQ link is no longer eligible.");
 if(!i.rfqId)return bad(i,"rfq_closed","This RFQ is no longer available."); const rfq=await getRfq(env,i.rfqId); i.rfqStatus=rfq?.status??null;
 if(!rfq||rfq.status!==RFQ_FIELDS.OPEN_VALUE)return bad(i,"rfq_closed","This RFQ is no longer accepting responses.");
 if(!i.supplierId)return bad(i,"supplier_mismatch","This secure RFQ link is no longer active.");
 return {valid:true,invitation:i,reason:"valid",message:"Token is valid."};
}
function bad(i:any,reason:ValidationResult["reason"],message:string):ValidationResult{return{valid:false,invitation:i,reason,message};}
