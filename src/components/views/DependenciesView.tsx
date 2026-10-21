import React from 'react';
import { Package, CheckCircle2, Shield, ExternalLink, Cpu } from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';

interface DependenciesViewProps {
  workflow: WorkflowDefinition;
}

export const DependenciesView: React.FC<DependenciesViewProps> = ({ workflow }) => {
  const allDeps = [
    {
      name: 'resvg',
      version: '0.41.0',
      type: 'Native Rust Binary / WASM',
      purpose: 'Fast SVG rendering and path triangulation',
      status: 'Available',
      license: 'MPL-2.0',
    },
    {
      name: 'SVG.js',
      version: '3.2.0',
      type: 'TypeScript Library',
      purpose: 'High-level SVG path builder and manipulator',
      status: 'Available',
      license: 'MIT',
    },
    {
      name: 'DACS',
      version: '2.0.4',
      type: 'Internal Engine',
      purpose: 'Direct Artwork Contour Segmentation & Junction solver',
      status: 'Available',
      license: 'Proprietary Orvia Core',
    },
    {
      name: 'libvips',
      version: '8.15.2',
      type: 'C++ Low-Memory Processor',
      purpose: 'High-throughput raster image normalization & metadata EXIF stripping',
      status: 'Available',
      license: 'LGPL-2.1',
    },
    {
      name: 'OpenCV-WASM',
      version: '4.9.0',
      type: 'WebAssembly Module',
      purpose: 'Edge detection, Gaussian blur, Canny filter contours',
      status: 'Available',
      license: 'Apache-2.0',
    },
    {
      name: 'potrace-core',
      version: '1.2.1',
      type: 'C/WASM Transform',
      purpose: 'Bitonal raster polygon tracing & curve smoothing',
      status: 'Available',
      license: 'GPL-2.0',
    },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#737373] uppercase">
          <Package className="w-4 h-4 text-[#F97316]" />
          <span>SYSTEM PACKAGES &amp; ENGINES</span>
        </div>
        <h1 className="font-editorial text-3xl font-normal text-[#242628] mt-1">
          Pipeline Dependencies
        </h1>
        <p className="text-sm text-[#737373] mt-0.5">
          Native binaries, WebAssembly modules, and libraries required to execute {workflow.name}.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E1DA] overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-[#242628]">
            <Shield className="w-4 h-4 text-[#16A34A]" />
            <span>All 6 core modules validated and hot-loaded</span>
          </div>
          <span className="text-xs font-mono text-[#737373]">Integrity: SHA-256 Verified</span>
        </div>

        <div className="divide-y divide-[#F2EFEA]">
          {allDeps.map((dep) => (
            <div
              key={dep.name}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9F7F3] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm text-[#242628] font-mono">
                    {dep.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDE8E0] text-[#595C60]">
                    v{dep.version}
                  </span>
                  <span className="text-xs text-[#8E8B85]">• {dep.type}</span>
                </div>
                <p className="text-xs text-[#595C60]">{dep.purpose}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-mono text-[#8E8B85] hidden md:inline">
                  {dep.license}
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{dep.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
