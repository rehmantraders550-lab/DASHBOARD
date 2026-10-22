import { createHash, randomUUID } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export const maxDuration = 10;
const MAX_PNG_BYTES = 280000;
const MAX_PIXELS = 512 * 512;
const MAX_GRID = 128;

function fail(message: string): never { throw new Error(message); }
function sha(data: Uint8Array | string): string { return createHash('sha256').update(data).digest('hex'); }

function decodePng(bytes: Buffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length > MAX_PNG_BYTES || bytes.length < 55 || !bytes.subarray(0,8).equals(sig)) fail('Expected a small PNG file. Maximum 280 KB.');
  let offset = 8, width = 0, height = 0, bpp = 0, idat: Buffer[] = [], ended = false;
  while (offset + 12 <= bytes.length) {
    const len = bytes.readUInt32BE(offset), type = bytes.toString('ascii',offset+4,offset+8);
    if (len > MAX_PNG_BYTES || offset + len + 12 > bytes.length) fail('Malformed PNG chunk.');
    const chunk = bytes.subarray(offset + 8,offset + 8 + len);
    offset += len + 12;
    if (type === 'IHDR') {
      if (len !== 13 || width !== 0) fail('Malformed PNG header.');
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      const depth = chunk[8], color = chunk[9];
      if (!width || !height || width * height > MAX_PIXELS || width > 512 || height > 512) fail('Image dimensions exceed 512 × 512 pixels.');
      if (depth !== 8 || ![0,2,4,6].includes(color) || chunk[10] !== 0 || chunk[11] !== 0 || chunk[12] !== 0) fail('Unsupported PNG profile. Re-export through the browser canvas.');
      bpp = color === 6 ? 4 : color === 2 ? 3 : color === 4 ? 2 : 1;
    } else if (type === 'IDAT') {
      if (!bpp) fail('PNG missing header.');
      idat.push(Buffer.from(chunk));
    } else if (type === 'IEND') { ended = true; break; }
  }
  if (!ended || !idat.length) fail('Incomplete PNG file.');
  const stride = width * bpp, expected = (stride + 1) * height;
  let scan: Buffer;
  try { scan = inflateSync(Buffer.concat(idat), { maxOutputLength: expected }); }
  catch { return fail('Invalid or oversized compressed PNG data.'); }
  if (scan.length !== expected) fail('PNG raster length mismatch.');
  const rgba = new Uint8Array(width * height * 4), prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  let ptr = 0;
  for (let y=0; y<height; y++) {
    const filter=scan[ptr++];
    if (filter > 4) fail('Invalid PNG filter.');
    for(let x=0; x<stride; x++) {
      const a=x>=bpp?cur[x-bpp]:0,b=prev[x],c=x>=bpp?prev[x-bpp]:0;
      let p=0;
      if(filter===1)p=a;else if(filter===2)p=b;else if(filter===3)p=Math.floor((a+b)/2);
      else if(filter===4){const q=a+b-c,da=Math.abs(q-a),db=Math.abs(q-b),dc=Math.abs(q-c);p=da<=db&&da<=dc?a:db<=dc?b:c;}
      cur[x]=(scan[ptr++]+p)&255;
    }
    for(let x=0;x<width;x++){
      const s=x*bpp, d=(y*width+x)*4;
      if(bpp===4){rgba[d]=cur[s];rgba[d+1]=cur[s+1];rgba[d+2]=cur[s+2];rgba[d+3]=cur[s+3];}
      else if(bpp===3){rgba[d]=cur[s];rgba[d+1]=cur[s+1];rgba[d+2]=cur[s+2];rgba[d+3]=255;}
      else if(bpp===2){rgba[d]=rgba[d+1]=rgba[d+2]=cur[s];rgba[d+3]=cur[s+1];}
      else{rgba[d]=rgba[d+1]=rgba[d+2]=cur[s];rgba[d+3]=255;}
    }
    prev.set(cur);
  }
  return {width,height,rgba};
}
type Raster = ReturnType<typeof decodePng>;

function sampleRaster({width,height,rgba}:Raster) {
  const scale=Math.min(1,MAX_GRID/Math.max(width,height));
  const cols=Math.max(1,Math.round(width*scale)),rows=Math.max(1,Math.round(height*scale));
  const rgb = new Uint8Array(cols*rows*3);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const sx=Math.min(width-1,Math.floor((x+.5)*width/cols)),sy=Math.min(height-1,Math.floor((y+.5)*height/rows));
    const i=(sy*width+sx)*4,j=(y*cols+x)*3,a=rgba[i+3]/255;
    for(let c=0;c<3;c++)rgb[j+c]=Math.round(rgba[i+c]*a+255*(1-a));
  }
  return {cols,rows,rgb};
}
type Samples=ReturnType<typeof sampleRaster>;
function analyze(samples:Samples) {
  const {rgb}=samples,n=rgb.length/3,seed=new Map<string,{rgb:[number,number,number],count:number}>();
  for(let i=0;i<n;i++){
    const j=i*3,r=rgb[j],g=rgb[j+1],b=rgb[j+2];
    const key=[r,g,b].map(v=>v>>5).join(':');
    const item=seed.get(key);
    if(item){ item.count++; for(let c=0;c<3;c++) item.rgb[c]+=rgb[j+c]; }
    else seed.set(key,{rgb:[r,g,b],count:1});
  }
  const centers=[...seed.values()].sort((a,b)=>b.count-a.count).slice(0,8).map(x=>x.rgb.map(c=>Math.round(c/x.count)));
  if(!centers.length)fail('No image colors found.');
  const labels=new Uint8Array(n);
  for(let it=0;it<5;it++){
    const sums=centers.map(()=>[0,0,0,0]);
    for(let i=0;i<n;i++){
      const j=i*3; let best=0,dist=Infinity;
      for(let k=0;k<centers.length;k++){let d=0;for(let c=0;c<3;c++){let delta=rgb[j+c]-centers[k][c];d+=delta*delta;}if(d<dist){dist=d;best=k;}}
      labels[i]=best;for(let c=0;c<3;c++)sums[best][c]+=rgb[j+c];sums[best][3]++;
    }
    centers.forEach((c,i)=>{if(sums[i][3])for(let t=0;t<3;t++)c[t]=Math.round(sums[i][t]/sums[i][3]);});
  }
  return {labels,centers};
}
type Analysis=ReturnType<typeof analyze>;
function vectorize(samples:Samples,analysis:Analysis,width:number,height:number,sourceHash:string) {
  const {cols,rows}=samples,{labels,centers}=analysis;
  const parts=centers.map(()=>[] as string[]);
  let segments=0;
  for(let y=0;y<rows;y++){
    let x=0;
    while(x<cols){
      const color=labels[y*cols+x],begin=x;
      while(x<cols&&labels[y*cols+x]===color)x++;
      parts[color].push('M'+begin+' '+y+'h'+(x-begin)+'v1h-'+(x-begin)+'z');
      segments++;
    }
  }
  const xScale=(width/cols).toFixed(6),yScale=(height/rows).toFixed(6);
  const body=parts.map((p,i)=>p.length?'<path fill="#'+centers[i].map(n=>Math.max(0,Math.min(255,n)).toString(16).padStart(2,'0')).join('')+'" d="'+p.join('')+'"/>':'').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img"><title>ORVIA quantized raster reconstruction</title><metadata>source-sha256:'+sourceHash+'; status:ART_REVIEW_REQUIRED; status:PRINT_PROOF_REQUIRED; method:bounded-raster-to-SVG</metadata><g id="10_VECTORIZED_SHAPES" transform="scale('+xScale+' '+yScale+')">'+body+'</g></svg>\n';
  return {svg,segments,palette:centers.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''))};
}

export async function POST(request:Request):Promise<Response>{
  const origin=request.headers.get('origin');
  const host=request.headers.get('host');
  if(origin&&host&&new URL(origin).host!==host) return Response.json({error:'Cross-origin processing is disabled.'},{status:403});
  const declared=Number(request.headers.get('content-length')||0);
  if(declared>480000)return Response.json({error:'Upload exceeds 480 KB request limit.'},{status:413});
  let payload:{image?:unknown,filename?:unknown};
  try {
    const text=await request.text();
    if(text.length>480000)throw Error('Upload exceeds 480 KB request limit.');
    payload=JSON.parse(text);
  }catch{return Response.json({error:'Invalid or oversized JSON payload.'},{status:400});}
  if(typeof payload?.image!=='string'||payload.image.length>400000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(payload.image))return Response.json({error:'Expected a compact base64 PNG image.'},{status:400});
  const image=Buffer.from(payload.image.slice('data:image/png;base64,'.length),'base64');
  const runId=randomUUID(), clock=performance.now(),encoder=new TextEncoder();
  const stream=new ReadableStream<Uint8Array>({
    async start(controller){
      let index=0,active='intake';
      const seconds=()=>Number(((performance.now()-clock)/1000).toFixed(4));
      const emit=(o:Record<string,unknown>)=>controller.enqueue(encoder.encode(JSON.stringify(o)+'\n'));
      const event=(type:string,stageId:string,message:string,level='INFO',extra?:Record<string,unknown>)=>{
        emit({kind:'event',event:{id:runId+'-'+(++index),timestampOffset:seconds(),wallClockTime:new Date().toISOString().slice(11,19),type,stageId,level,message,...(extra?{payload:extra}:{})}});
      };
      const stage=async(id:string,label:string,fn:()=>unknown)=>{
        active=id;event('STAGE_START',id,label+' started');await new Promise(resolve=>setTimeout(resolve,0));
        const result=fn();event('STAGE_COMPLETE',id,label+' completed','SUCCESS');await new Promise(resolve=>setTimeout(resolve,0));
        return result;
      };
      try{
        event('PIPELINE_INIT','intake','Real backend run '+runId+' initiated');
        const raster=await stage('intake','PNG intake and source hash',()=>decodePng(image)) as Raster;
        const hash=sha(image);
        const samples=await stage('analyze','Pixel sampling and color analysis',()=>sampleRaster(raster)) as Samples;
        const analysis=analyze(samples);
        const vector=await stage('vectorize','Quantized SVG reconstruction',()=>vectorize(samples,analysis,raster.width,raster.height,hash)) as ReturnType<typeof vectorize>;
        await stage('validate','SVG structural validation',()=>{
          if(!vector.svg.startsWith('<svg')||!vector.svg.includes('</svg>')||!vector.svg.includes('<path')||vector.segments>MAX_PIXELS||vector.svg.length>1800000)fail('Generated SVG did not meet the output contract.');
          return true;
        });
        const receipt=await stage('export','SVG artifact receipt',()=>({svgSha256:sha(vector.svg),memoryMb:Number((process.memoryUsage().heapUsed/1024/1024).toFixed(1))}));
        emit({kind:'result',result:{runId,pipelineId:'artwork-to-vector',mode:'LIVE',engine:'orvia-bounded-raster-v0.1',svg:vector.svg,svgSha256:(receipt as {svgSha256:string}).svgSha256,sourceSha256:hash,width:raster.width,height:raster.height,colors:vector.palette,segments:vector.segments,elapsedSeconds:seconds(),limits:{maxSourceBytes:MAX_PNG_BYTES,maxPixels:MAX_PIXELS},warnings:['Bounded quantized vector reconstruction, not semantic recovery or full Python CLI output.','SVG requires artwork review; no PDF, OCR, ICC, CorelDRAW certification or print-ready status.'],telemetry:{workerThreads:1,activeMemoryMb:(receipt as {memoryMb:number}).memoryMb,peakMemoryLimitMb:0,cacheHitRatio:0,bufferDropCount:0}}});
      }catch(error){
        event('RESILIENCE_STATE',active,error instanceof Error?error.message:'Backend processing failed','WARN',{state:'failed'});
        emit({kind:'error',error:error instanceof Error?error.message:'Unknown error',stageId:active});
      }finally{controller.close();}
    }
  });
  return new Response(stream,{status:200,headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff','X-ORVIA-Mode':'REAL-BOUNDED'}});
}
export function GET():Response{return Response.json({service:'ORVIA vector compute',status:'ready',engine:'orvia-bounded-raster-v0.1',realProcessing:true,mode:'bounded',accepted:['PNG RGBA/RGB 8-bit'],maxSourceBytes:MAX_PNG_BYTES,maxPixels:MAX_PIXELS,noPaidAPIs:true,printReady:false},{headers:{'Cache-Control':'no-store'}});}
