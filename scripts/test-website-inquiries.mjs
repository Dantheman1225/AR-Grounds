import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const site = fileURLToPath(new URL('../argrounds-website/argrounds-final/', import.meta.url));
const require = createRequire(join(site, 'package.json'));
const { build } = require('esbuild');
const out = mkdtempSync(join(tmpdir(), 'grounds-inquiry-test-'));
await build({entryPoints:['leads-create','contact','leads-list'].map(n=>join(site,'functions/api',n+'.js')),bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},outdir:out});
process.on('exit',()=>rmSync(out,{recursive:true,force:true}));
const {onRequestPost} = await import(pathToFileURL(join(out,'leads-create.mjs')));
const {onRequestPost:contact} = await import(pathToFileURL(join(out,'contact.mjs')));
const {onRequestGet:listLeads} = await import(pathToFileURL(join(out,'leads-list.mjs')));
const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_test', RESEND_API_KEY: 'test-only', FROM_EMAIL: 'Grounds <requests@argrounds.com>', ADMIN_EMAIL: 'grounds.helpme@gmail.com' };
const lead = { first_name: 'TEST', last_name: 'ONLY', phone: '5019610788', email: 'grounds.helpme+test@gmail.com', address: 'TEST — DO NOT DISPATCH', service: 'pressure-washing', size: 'small', timing: 'afternoon', message: '<img src=x onerror=alert(1)> Test only', page_path: '/' };
const request = body => new Request('https://argrounds.com/api/leads-create', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
function mock({dbStatus=201,mailStatus=200}={}) {
 const calls=[];
 globalThis.fetch=async (url, init={})=> {
  const call={url:String(url),...init,body:init.body?JSON.parse(init.body):null};calls.push(call);
  if(String(url).includes('/rest/')) {
   assert.equal(init.headers.Prefer, 'return=minimal');
   return new Response(null,{status:dbStatus});
  }
  return new Response(JSON.stringify({id:'email-test'}),{status:mailStatus});
 };
 return calls;
}
test('quote saves complete record with INSERT-only access and sends actionable receipts', async()=>{
 const calls=mock();const response=await onRequestPost({request:request(lead),env});const result=await response.json();
 assert.equal(response.status,201);assert.equal(result.notification_sent,true);assert.equal(result.confirmation_sent,true);
 const row=calls[0].body;assert.equal(row.id,result.id);for(const k of ['phone','email','address','service','size','timing','message','page_path'])assert.equal(row[k],lead[k]);
 assert.equal(row.name,'TEST ONLY');assert.equal(calls[0].headers.Authorization,undefined);
 const email=calls[1].body;assert.equal(email.to,env.ADMIN_EMAIL);assert.equal(email.reply_to,lead.email);assert.match(email.text,/small/);assert.match(email.text,/Afternoon/);assert.match(email.text,/TEST — DO NOT DISPATCH/);assert.match(email.html,/&lt;img/);assert.ok(!email.html.includes('<img src=x'));
 assert.equal(calls[2].body.reply_to,env.ADMIN_EMAIL);assert.equal(calls[2].body.to,lead.email);
});
test('contact subject and source survive shared submission',async()=>{
 const calls=mock();await contact({request:request({name:'TEST CONTACT',phone:lead.phone,email:lead.email,subject:'Commercial property question',message:'No dispatch'}),env});
 assert.equal(calls[0].body.service,'Commercial property question');assert.equal(calls[0].body.source,'contact_form');assert.match(calls[1].body.text,/Commercial property question/);
});
test('database outage falls back to complete email delivery and identifies email-only storage',async()=>{
 const calls=mock({dbStatus:503});const response=await onRequestPost({request:request(lead),env});const result=await response.json();assert.equal(response.status,202);assert.equal(result.captured,false);assert.equal(result.notification_sent,true);assert.equal(calls.length,3);assert.match(calls[1].body.text,/EMAIL-ONLY REQUEST/);assert.match(calls[1].body.text,/small/);assert.match(calls[1].body.text,/Afternoon/);assert.ok(!calls[1].body.text.includes('request has been saved'));
});
test('simultaneous database and email failure never reports success',async()=>{
 const calls=mock({dbStatus:503,mailStatus:401});const response=await onRequestPost({request:request(lead),env});assert.equal(response.status,503);assert.equal(calls.length,2);
});
test('database network failure and missing configuration both use the email fallback',async()=>{
 for(const missing of [false,true]){
  const calls=mock();const orig=globalThis.fetch;globalThis.fetch=async(url,init)=>{if(String(url).includes('/rest/'))throw new TypeError('network failed');return orig(url,init);};
  const response=await onRequestPost({request:request(lead),env:missing?{...env,SUPABASE_URL:''}:env});assert.equal(response.status,202);assert.equal((await response.json()).notification_sent,true);assert.equal(calls.length,2);
 }
});
test('notification failure preserves saved record and reports partial delivery',async()=>{
 const calls=mock({mailStatus:401});const response=await onRequestPost({request:request(lead),env});const result=await response.json();assert.equal(result.captured,true);assert.equal(result.notification_sent,false);assert.equal(result.confirmation_sent,false);assert.equal(calls.length,2);
});
test('missing email settings cannot silently report successful notification',async()=>{
 const calls=mock();const result=await (await onRequestPost({request:request(lead),env:{...env,RESEND_API_KEY:''}})).json();assert.equal(result.captured,true);assert.equal(result.notification_sent,false);assert.equal(calls.length,1);
});
test('transient mail errors retry with one stable idempotency key',async()=>{
 const calls=mock({mailStatus:503});const result=await (await onRequestPost({request:request(lead),env})).json();assert.equal(result.notification_sent,false);assert.equal(calls.length,3);assert.equal(calls[1].headers['Idempotency-Key'],calls[2].headers['Idempotency-Key']);
});
for(const [name,body,status] of [['bad phone',{...lead,phone:'123'},400],['bad email',{...lead,email:'not-email'},400],['bad shape',null,400],['honeypot',{...lead,_gotcha:'spam'},201]])test(name,async()=>{const calls=mock();assert.equal((await onRequestPost({request:request(body),env})).status,status);assert.equal(calls.length,0);});
test('anonymous CRM reads are denied before accessing database',async()=>{
 const calls=mock();const response=await listLeads({request:new Request('https://argrounds.com/api/leads-list'),env});assert.equal(response.status,401);assert.equal(calls.length,0);
});
test('CRM queries use the verified user token, not the public role',async()=>{
 const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),headers:new Headers(init.headers)});return new Response(JSON.stringify(String(url).includes('/auth/v1/user')?{id:'test-user',role:'authenticated',email:'test@example.com'}:[]),{status:200,headers:{'content-type':'application/json','content-range':'0-0/0'}});};
 const response=await listLeads({request:new Request('https://argrounds.com/api/leads-list',{headers:{Authorization:'Bearer valid-test-session'}}),env});assert.equal(response.status,200);assert.equal(calls.length,2);assert.equal(calls[1].headers.get('Authorization'),'Bearer valid-test-session');
});

test('phone-only requests send one actionable business notification',async()=>{
 const calls=mock();const response=await onRequestPost({request:request({...lead,email:''}),env});const result=await response.json();assert.equal(result.notification_sent,true);assert.equal(result.confirmation_sent,false);assert.equal(calls.length,2);assert.match(calls[1].body.text,/No email was supplied; call or text/);
});

test('manual CRM entries preserve their source attribution',async()=>{
 const calls=mock();await onRequestPost({request:request({...lead,source:'manual'}),env});assert.equal(calls[0].body.source,'manual');
});

// The branded templates must retain full details and work without their images.
test('customer receipt preserves details and routes photos and calls to the business',async()=>{
 const calls=mock();await onRequestPost({request:request(lead),env});const receipt=calls[2].body;
 for(const value of ['TEST ONLY',lead.phone,lead.email,lead.address,lead.message])assert.ok(receipt.text.includes(value));
 assert.match(receipt.html,/LET’S GET YOUR/);assert.match(receipt.html,/href="tel:\+15019610788"/);assert.match(receipt.html,/href="sms:\+15019610788"/);assert.match(receipt.html,/mailto:grounds.helpme@gmail.com\?subject=Property%20photos/);
 assert.match(receipt.text,/appointment will be confirmed separately/);assert.ok(!receipt.html.includes('WEBSITE SOURCE'));assert.match(receipt.html,/&lt;img src=x/);
 assert.ok(Buffer.byteLength(receipt.html)<20000);
});
test('visitor text cannot inject HTML into the branded heading or links',async()=>{
 const calls=mock();await onRequestPost({request:request({...lead,first_name:'<script>alert(1)</script>',service:'<b>Custom job</b>',email:'quote"x@example.com'}),env});
 for(const call of calls.slice(1)){assert.ok(!call.body.html.includes('<script>'));assert.ok(!call.body.html.includes('<b>Custom job</b>'));assert.match(call.body.html,/&lt;b&gt;Custom job/);assert.ok(!call.body.html.includes('href="mailto:quote"'));}
});
