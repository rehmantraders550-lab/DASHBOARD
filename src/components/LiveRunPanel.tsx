import React, { useState } from 'react';
import { Upload, Play, Download, AlertCircle } from 'lucide-react';
import type { RuntimeEvent, RuntimeTelemetry } from '../engine/workflowModel';

interface Output {svg:string;svgSha256:string;segments:number;colors:string[];warnings:string[];elapsedSeconds:number;telemetry:RuntimeTelemetry;engine:string}
interface Props {onStart:()=>void;onEvent:(event:RuntimeEvent)=>void;onFinish:(telemetry?:RuntimeTelemetry)=>void}
export const LiveRunPanel:React.FC<Props>=({onStart,onEvent,onFinish})=>{
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState<Output|null>(null);
  const [expanded,setExpanded]=useState(false);
  const fileToPng=async(f:File):Promise<string>=>{
    if(f.size>8*1024*1024)throw Error('Input must be no larger than 8 MB.');
    const bitmap=await createImageBitmap(f);
    if(bitmap.width*bitmap.height>32000000){bitmap.close();throw Error('Image dimensions are too large.');}
    const factor=Math.min(1,512/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*factor));
    canvas.height=Math.max(1,Math.round(bitmap.height*factor));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('2D canvas is unavailable.');
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    const max=128;
    for(let s=1;s<=4;s++){
      const url=canvas.toDataURL('image/png');
      if(url.length<375000)return url;
      const scale= s===1?0.75:0.72;
      const temp=document.createElement('canvas');
      temp.width=Math.max(1,Math.round(canvas.width*scale));temp.height=Math.max(1,Math.round(canvas.height*scale));
      temp.getContext('2d')!.drawImage(canvas,0,0,temp.width,temp.height);
      canvas.width=temp.width;canvas.height=temp.height;
      ctx.drawImage(temp,0,0);
      if(canvas.width<max && canvas.height<max)break;
    }
    throw Error('Artwork compresses beyond the backend limit. Reduce image complexity.');
  };
  const run=async()=>{
    if(!file||busy)return;
    setBusy(true);setError('');setResult(null);onStart();
    try{
      const image=await fileToPng(file);
      const response=await fetch('/api/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({image,filename:file.name})});
      if(!response.ok){const problem=await response.json().catch(()=>({}));throw Error(problem.error||'Backend request failed: '+response.status);}
      if(!response.body)throw Error('Streaming response unavailable.');
      const reader=response.body.getReader(),decoder=new TextDecoder();
      let buffer='',completed:Output|null=null;
      while(true){
        const {done,value}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});
        const lines=buffer.split('\n');buffer=lines.pop()||'';
        for(const line of lines){if(!line.trim())continue;const msg=JSON.parse(line);
          if(msg.kind==='event')onEvent(msg.event);
          else if(msg.kind==='result'){completed=msg.result;setResult(msg.result);}
          else if(msg.kind==='error')throw Error(msg.error||'Backend failed');
        }
        if(done)break;
      }
      if(!completed)throw Error('The backend did not return a vector artifact.');
      onFinish(completed.telemetry);
    }catch(e){setError(e instanceof Error?e.message:'Processing failed');onFinish();}
    finally{setBusy(false);}
  };
  const download=()=>{
    if(!result)return;
    const blob=new Blob([result.svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='orvia-vector-'+result.svgSha256.slice(0,12)+'.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  };
  return <section className="shrink-0 mx-4 mt-2 sm:mx-6 lg:mx-8 rounded-xl border border-[#E5E1DA] bg-white px-4 py-3 text-sm">
    <div className="flex items-center gap-3 flex-wrap">
      <button className="font-semibold text-[#242628] flex items-center gap-2" onClick={()=>setExpanded(!expanded)}><span className="h-2 w-2 bg-[#16A34A] rounded-full"/>Real ORVIA Compute <span className="text-xs text-[#737373]">{expanded?'−':'+'}</span></button>
      <span className="text-[#737373] text-xs hidden sm:inline">Actual image → editable SVG / zero external API calls</span>
      {result&&<button className="ml-auto bg-[#F97316] text-white px-3 py-1.5 rounded-lg flex items-center gap-1" onClick={download}><Download className="w-4 h-4"/>Download SVG</button>}
    </div>
    {expanded&&<div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-[#E5E1DA]">
      <label className="cursor-pointer border rounded-lg px-3 py-2 flex items-center gap-2"><Upload className="w-4 h-4"/> {file?file.name:'Choose PNG/JPG/WebP'}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <button disabled={!file||busy} onClick={run} className="bg-[#242628] disabled:opacity-40 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Play className="w-4 h-4"/>{busy?'Processing…':'Run Real Pipeline'}</button>
      <span className="text-xs text-[#737373]">Bounded color-vector reconstruction; not full semantic Python engine or certified print output.</span>
    </div>}
    {error&&<p className="text-red-700 flex gap-2 items-center mt-2 text-xs" role="alert"><AlertCircle className="w-4 h-4"/>{error}</p>}
    {result&&expanded&&<p className="mt-2 text-xs text-[#737373]">Completed in {result.elapsedSeconds}s · {result.segments} SVG segments · {result.colors.length} palette colors · {result.engine} · artwork review required</p>}
  </section>;
};
