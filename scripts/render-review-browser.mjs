import fs from 'node:fs/promises';
export class BrowserPage {
  constructor(socket) { this.socket=socket;this.id=0;this.pending=new Map();this.errors=[];socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}else if(msg.method==='Runtime.exceptionThrown')this.errors.push(msg.params.exceptionDetails.text);});}
  static async create(){const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const page=new BrowserPage(socket);await page.call('Page.enable');await page.call('Runtime.enable');await page.call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});return page;}
  call(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`Browser command timed out: ${method}`));},30000);this.pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});this.socket.send(JSON.stringify({id,method,params}));});}
  async evaluate(expression){const result=await this.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
  async wait(expression,timeout=25000){const start=Date.now();while(Date.now()-start<timeout){if(await this.evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,150));}throw Error(`Timeout: ${expression}`);}
  async goto(url){await this.call('Page.navigate',{url});await this.wait('document.readyState !== "loading"');}
  async capture(path){await this.call('Page.bringToFront');await this.evaluate('document.fonts.ready');const {data}=await this.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path,Buffer.from(data,'base64'));}
  async close(){this.socket.close();}
}
if(process.argv[2]==='smoke'){
 const page=await BrowserPage.create();await page.goto('http://localhost:5173/atelier');await page.wait('document.querySelectorAll("article h3").length > 0');await page.capture('GeneaTree/test-artifacts/saints-review/catalogue.png');console.log(await page.evaluate('({title:document.title, cards:document.querySelectorAll("article").length, errors:document.querySelector("[role=alert]")?.innerText})'));await page.close();
}
