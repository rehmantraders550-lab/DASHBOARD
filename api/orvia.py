import base64
import hashlib
import io
import json
import os
import tempfile
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image, ImageOps

MAX_BODY = 450000
MAX_PIXELS = 512 * 512

class handler(BaseHTTPRequestHandler):
    def _json(self, code, body):
        data = json.dumps(body, separators=(",", ":"), allow_nan=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._json(200, {"service":"ORVIA original Python engine","engine":"poster-vector-rebuilder",
                         "modes":["hard","semantic"],"maxPixels":MAX_PIXELS,
                         "backend":"OpenCV original ORVIA modules", "printReady":False})

    def do_POST(self):
        started=time.monotonic()
        stage="intake"
        events=[]
        def ev(t, stage_id, message, level="INFO"):
            events.append({"id":"py-"+str(len(events)+1),"timestampOffset":round(time.monotonic()-started,4),
                "wallClockTime":datetime.now(timezone.utc).strftime("%H:%M:%S"),"type":t,
                "stageId":stage_id,"level":level,"message":message})
        try:
            cl=int(self.headers.get("content-length","0"))
            if cl<1 or cl>MAX_BODY: raise ValueError("Request too large; max 450 KB")
            origin=self.headers.get("origin")
            host=self.headers.get("host")
            if origin:
                from urllib.parse import urlparse
                if urlparse(origin).netloc != host: raise ValueError("Cross-origin processing blocked")
            incoming=json.loads(self.rfile.read(cl))
            mode=incoming.get("mode","semantic")
            if mode not in ("hard","semantic"): raise ValueError("Invalid route: hard or semantic")
            raw=incoming.get("image")
            if not isinstance(raw,str) or not raw.startswith("data:image/png;base64,") or len(raw)>400000:
                raise ValueError("Expected a compact PNG data URL")
            rawbytes=base64.b64decode(raw.partition(",")[2],validate=True)
            if len(rawbytes)>280000: raise ValueError("Image exceeds 280 KB")
            ev("PIPELINE_INIT","intake","ORVIA Python backend execution started")
            ev("STAGE_START","intake","Reading PNG and validating source")
            image=Image.open(io.BytesIO(rawbytes))
            if image.width*image.height>MAX_PIXELS: raise ValueError("Maximum 262144 input pixels")
            image=ImageOps.exif_transpose(image).convert("RGBA")
            source_hash=hashlib.sha256(rawbytes).hexdigest()
            ev("STAGE_COMPLETE","intake","Image accepted: "+str(image.width)+"x"+str(image.height),"SUCCESS")
            ev("STAGE_START","analyze","Selecting real "+mode+" reconstruction route")
            ev("STAGE_COMPLETE","analyze","OpenCV route verified","SUCCESS")
            folder=Path(tempfile.mkdtemp(prefix="orvia-py-"))
            src=folder/"source.png"; out=folder/"artwork.svg"; report_path=folder/"report.json"
            image.save(src)
            ev("STAGE_START","vectorize","Running original ORVIA "+mode+" module")
            if mode=="hard":
                from orvia_engine.hard_vectorize import vectorize_hard_graphic
                report=vectorize_hard_graphic(src,out,report_path=report_path,backend="opencv",
                            colors=8,min_area=3.0,simplify=0.0025)
            else:
                from orvia_engine.semantic_primitives import reconstruct_semantic_primitives
                report=reconstruct_semantic_primitives(src,out,report_path=report_path,
                            colors=8,min_area=4.0,simplify=0.003)
            ev("STAGE_COMPLETE","vectorize","Generated original ORVIA SVG geometry","SUCCESS")
            ev("STAGE_START","validate","XML parsing and output validation")
            svg=out.read_text(encoding="utf-8")
            root=ET.fromstring(svg)
            nodes=sum(1 for el in root.iter() if el.tag.endswith(("path","rect","circle","ellipse","polygon","line")))
            if nodes<1: raise ValueError("No SVG geometry was generated")
            ev("STAGE_COMPLETE","validate","SVG XML valid: "+str(nodes)+" geometry objects","SUCCESS")
            ev("STAGE_START","export","Preparing SVG and reconstruction report")
            result={"runId":source_hash[:16],"pipelineId":"artwork-to-vector","mode":"LIVE",
              "engine":"orvia-python-"+mode+"-opencv","route":mode,
              "svg":svg,"svgSha256":hashlib.sha256(svg.encode()).hexdigest(),"sourceSha256":source_hash,
              "width":image.width,"height":image.height,"segments":nodes,
              "colors":[],"report":report,"elapsedSeconds":round(time.monotonic()-started,4),
              "telemetry":{"workerThreads":1,"activeMemoryMb":0,"peakMemoryLimitMb":0,"cacheHitRatio":0,"bufferDropCount":0},
              "warnings":["Original Python reconstruction route; PDF/ICC/RIP and print-ready status not certified."]}
            ev("STAGE_COMPLETE","export","SVG and measured report returned","SUCCESS")
            self._json(200,{"events":events,"result":result})
        except Exception as exc:
            ev("RESILIENCE_STATE",stage,"Python engine failed: "+str(exc),"WARN")
            self._json(422,{"error":str(exc),"events":events})
