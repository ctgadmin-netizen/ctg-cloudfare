import type {Env,Invitation} from "./types";
export function buildRedirectUrl(env:Env,i:Invitation):string{ const u=new URL(env.TALLY_FORM_URL); u.searchParams.set("secure_token",i.token); u.searchParams.set("link_version",String(i.linkVersion)); return u.toString(); }
export function createRedirect(env:Env,i:Invitation):Response{return new Response(null,{status:302,headers:{Location:buildRedirectUrl(env,i),"Cache-Control":"no-store, no-cache, must-revalidate",Pragma:"no-cache","Referrer-Policy":"no-referrer"}});}
