import { WorkflowDefinition } from '../types/workflow';

export const INITIAL_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'artwork-to-vector',
    name: 'Artwork to Vector',
    category: 'Vectorization',
    description: "Live view of ORVIA's workflow. Click a step to see details.",
    currentTimeSeconds: 1.4,
    maxTimelineSeconds: 5.5,
    isRunning: true,
    selectedStageId: 'vectorize',
    stages: [
      {
        id: 'intake',
        stepNumber: '01',
        name: 'Intake',
        status: 'completed',
        duration: '0.3s',
        durationSeconds: 0.3,
        progressPercent: 100,
        description: 'Ingests raw raster assets, extracts metadata, and normalizes DPI and color profile.',
        input: {
          name: 'artwork_master_source.png',
          size: '14.8 MB',
          type: 'image/png',
        },
        output: {
          statusText: 'artwork_normalized.png',
          isProcessing: false,
          name: 'artwork_normalized.png',
          size: '12.4 MB',
        },
        dependencies: [
          { name: 'libvips', status: 'Available', version: '8.15.2' },
          { name: 'sharp', status: 'Available', version: '0.33.2' },
        ],
        recentEvents: [
          { timestamp: '14:21:05', message: 'Asset received via secure upload pipe' },
          { timestamp: '14:21:05', message: 'Read EXIF metadata and color space profile' },
          { timestamp: '14:21:06', message: 'Normalized resolution to 300 DPI' },
          { timestamp: '14:21:06', message: 'Cached normalized payload in buffer pool' },
        ],
        timeline: {
          start: 0.1,
          duration: 0.3,
        },
      },
      {
        id: 'analyze',
        stepNumber: '02',
        name: 'Analyze',
        status: 'completed',
        duration: '0.7s',
        durationSeconds: 0.7,
        progressPercent: 100,
        description: 'Executes edge detection, segmentation, palette extraction, and path boundary prediction.',
        input: {
          name: 'artwork_normalized.png',
          size: '12.4 MB',
          type: 'image/png',
        },
        output: {
          statusText: 'color_topology_map.json',
          isProcessing: false,
          name: 'color_topology_map.json',
          size: '1.8 MB',
        },
        dependencies: [
          { name: 'OpenCV-WASM', status: 'Available', version: '4.9.0' },
          { name: 'potrace-core', status: 'Available', version: '1.2.1' },
        ],
        recentEvents: [
          { timestamp: '14:21:06', message: 'Submitting canvas slices to analyzer' },
          { timestamp: '14:21:07', message: 'Segmented 8 distinct semantic color layers' },
          { timestamp: '14:21:07', message: 'Detected high-frequency contour edges' },
          { timestamp: '14:21:08', message: 'Emitted vector topological node hints' },
        ],
        timeline: {
          start: 0.4,
          duration: 0.7,
        },
      },
      {
        id: 'vectorize',
        stepNumber: '03',
        name: 'Vectorize',
        status: 'running',
        duration: '1.4s',
        durationSeconds: 1.4,
        progressPercent: 60,
        description: 'Reconstructs clean vector paths from the analyzed artwork.',
        input: {
          name: 'artwork_normalized.png',
          size: '12.4 MB',
          type: 'image/png',
        },
        output: {
          statusText: 'Processing...',
          isProcessing: true,
        },
        dependencies: [
          { name: 'resvg', status: 'Available', version: '0.41.0' },
          { name: 'SVG.js', status: 'Available', version: '3.2.0' },
          { name: 'DACS', status: 'Available', version: '2.0.4' },
        ],
        recentEvents: [
          { timestamp: '14:21:08', message: 'Started vectorization process' },
          { timestamp: '14:21:09', message: 'Loaded resvg' },
          { timestamp: '14:21:10', message: 'Parsed 1,284 paths' },
          { timestamp: '14:21:11', message: 'Rebuilding topology' },
          { timestamp: '14:21:12', message: 'Optimizing curves...' },
        ],
        timeline: {
          start: 0.8,
          duration: 0.6,
          projectedEnd: 2.2,
        },
      },
      {
        id: 'validate',
        stepNumber: '04',
        name: 'Validate',
        status: 'waiting',
        duration: 'Waiting',
        durationSeconds: 0,
        progressPercent: 0,
        description: 'Verifies node continuity, self-intersecting loops, and SVG 1.1 / 2.0 standard conformance.',
        input: {
          name: 'vector_draft.svg',
          size: 'Pending',
          type: 'image/svg+xml',
        },
        output: {
          statusText: 'Waiting for Vectorize step...',
          isProcessing: false,
        },
        dependencies: [
          { name: 'SVGO', status: 'Available', version: '3.3.2' },
          { name: 'W3C-Validator', status: 'Available', version: '1.8.0' },
        ],
        recentEvents: [
          { timestamp: '14:21:08', message: 'Validation harness initialized and awaiting payload' },
        ],
        timeline: {
          start: 2.2,
          duration: 0.8,
          projectedEnd: 3.0,
        },
      },
      {
        id: 'export',
        stepNumber: '05',
        name: 'Export',
        status: 'waiting',
        duration: 'Waiting',
        durationSeconds: 0,
        progressPercent: 0,
        description: 'Compiles clean vector deliverables in SVG, EPS, and high-fidelity PDF formats.',
        input: {
          name: 'validated_artwork.svg',
          size: 'Pending',
          type: 'application/octet-stream',
        },
        output: {
          statusText: 'Waiting for Validate step...',
          isProcessing: false,
        },
        dependencies: [
          { name: 'PDFKit', status: 'Available', version: '0.14.0' },
          { name: 'S3-Publisher', status: 'Available', version: '3.5.1' },
        ],
        recentEvents: [
          { timestamp: '14:21:08', message: 'Export storage targets mounted and hot' },
        ],
        timeline: {
          start: 3.0,
          duration: 1.5,
          projectedEnd: 4.5,
        },
      },
    ],
    logs: [
      { id: 'l1', timestamp: '14:21:04.120', level: 'INFO', stage: 'System', message: 'Workflow pipeline initialized with execution ID wf_98a72b' },
      { id: 'l2', timestamp: '14:21:05.002', level: 'INFO', stage: 'Intake', message: 'Binary stream received: artwork_master_source.png (14.8 MB)' },
      { id: 'l3', timestamp: '14:21:05.312', level: 'SUCCESS', stage: 'Intake', message: 'Normalization complete in 0.3s. Emitted artwork_normalized.png' },
      { id: 'l4', timestamp: '14:21:05.350', level: 'INFO', stage: 'Pipe 01→02', message: 'Zero-copy memory transfer to Analyze node complete' },
      { id: 'l5', timestamp: '14:21:06.012', level: 'INFO', stage: 'Analyze', message: 'Evaluating 8 color clusters and high-contrast boundaries' },
      { id: 'l6', timestamp: '14:21:07.410', level: 'SUCCESS', stage: 'Analyze', message: 'Completed feature analysis in 0.7s. Emitted color_topology_map.json' },
      { id: 'l7', timestamp: '14:21:07.450', level: 'INFO', stage: 'Pipe 02→03', message: 'Streamed topology vectors to Vectorize engine' },
      { id: 'l8', timestamp: '14:21:08.100', level: 'INFO', stage: 'Vectorize', message: 'Started vectorization process via resvg engine' },
      { id: 'l9', timestamp: '14:21:09.320', level: 'DEBUG', stage: 'Vectorize', message: 'Loaded resvg v0.41.0 with SIMD acceleration enabled' },
      { id: 'l10', timestamp: '14:21:10.150', level: 'INFO', stage: 'Vectorize', message: 'Parsed 1,284 Bézier paths from contour fragments' },
      { id: 'l11', timestamp: '14:21:11.230', level: 'INFO', stage: 'Vectorize', message: 'Rebuilding manifold topology and resolving junction nodes' },
      { id: 'l12', timestamp: '14:21:12.440', level: 'INFO', stage: 'Vectorize', message: 'Optimizing curves with Douglas-Peucker epsilon tolerance 0.04' },
    ],
    codeDefinition: `// ORVIA Code Pipeline Definition
// Pipeline ID: artwork_to_vector
// Target Engine: Orvia Core v3.2.0

import { definePipeline, stage, pipe } from '@orvia/runtime';
import { normalizeRaster, analyzeContours, vectorizePaths, validateSvg, exportPackages } from './nodes';

export default definePipeline('Artwork to Vector', {
  concurrency: 4,
  timeout: '30s',
  trace: true,
})
  .step('01_intake', async (ctx) => {
    const rawAsset = await ctx.input.asBuffer();
    return await normalizeRaster(rawAsset, {
      targetDpi: 300,
      colorSpace: 'sRGB',
      autoOrient: true
    });
  })

  .step('02_analyze', async (ctx, normalized) => {
    const contours = await analyzeContours(normalized, {
      colorClusters: 8,
      contrastThreshold: 0.18,
      preserveSharpCorners: true
    });
    return contours;
  })

  .step('03_vectorize', async (ctx, contours) => {
    // Current live executing step
    ctx.logger.info('Started vectorization process');
    const svgPaths = await vectorizePaths(contours, {
      engine: 'resvg',
      curveTolerance: 0.04,
      smoothJunctions: true
    });
    return svgPaths;
  })

  .step('04_validate', async (ctx, svgDraft) => {
    return await validateSvg(svgDraft, {
      maxNodes: 25000,
      checkSelfIntersections: true,
      conformTo: 'SVG_1_1'
    });
  })

  .step('05_export', async (ctx, validatedSvg) => {
    return await exportPackages(validatedSvg, ['svg', 'eps', 'pdf']);
  });`,
  },
  {
    id: 'color-analysis',
    name: 'Color Analysis',
    category: 'Palette Extraction',
    description: 'Detailed chromatic clustering, color harmony maps, and pigment profiling.',
    currentTimeSeconds: 0.9,
    maxTimelineSeconds: 4.0,
    isRunning: false,
    selectedStageId: 'color-intake',
    stages: [
      {
        id: 'color-intake',
        stepNumber: '01',
        name: 'Intake',
        status: 'completed',
        duration: '0.2s',
        durationSeconds: 0.2,
        progressPercent: 100,
        description: 'Read input imagery and calibrate color gamut profile.',
        input: { name: 'palette_source.jpg', size: '6.4 MB' },
        output: { statusText: 'calibrated_source.png', isProcessing: false, name: 'calibrated_source.png', size: '5.9 MB' },
        dependencies: [{ name: 'libvips', status: 'Available' }],
        recentEvents: [{ timestamp: '14:18:01', message: 'Color gamut normalized' }],
        timeline: { start: 0.1, duration: 0.2 },
      },
      {
        id: 'color-k-means',
        stepNumber: '02',
        name: 'K-Means',
        status: 'completed',
        duration: '0.7s',
        durationSeconds: 0.7,
        progressPercent: 100,
        description: 'Run accelerated K-Means clustering across 16 color centroids.',
        input: { name: 'calibrated_source.png', size: '5.9 MB' },
        output: { statusText: 'centroids.json', isProcessing: false, name: 'centroids.json', size: '12 KB' },
        dependencies: [{ name: 'Scikit-WASM', status: 'Available' }],
        recentEvents: [{ timestamp: '14:18:02', message: '16 dominant centroids clustered' }],
        timeline: { start: 0.3, duration: 0.7 },
      },
      {
        id: 'color-export',
        stepNumber: '03',
        name: 'Export',
        status: 'completed',
        duration: '0.2s',
        durationSeconds: 0.2,
        progressPercent: 100,
        description: 'Generates ASE, CSS, and Pantone match swatches.',
        input: { name: 'centroids.json', size: '12 KB' },
        output: { statusText: 'palette.ase', isProcessing: false, name: 'palette.ase', size: '4 KB' },
        dependencies: [{ name: 'ASE-Encoder', status: 'Available' }],
        recentEvents: [{ timestamp: '14:18:03', message: 'Color palette ready for export' }],
        timeline: { start: 1.0, duration: 0.2 },
      },
    ],
    logs: [
      { id: 'c1', timestamp: '14:18:00.100', level: 'INFO', stage: 'System', message: 'Color Analysis pipeline started' },
      { id: 'c2', timestamp: '14:18:02.900', level: 'SUCCESS', stage: 'Export', message: 'Finished in 1.1s total' },
    ],
    codeDefinition: `// Color Analysis Pipeline\nimport { definePipeline } from '@orvia/runtime';\n\nexport default definePipeline('Color Analysis')\n  .step('01_intake', async (ctx) => ctx.input)\n  .step('02_kmeans', async (ctx, img) => extractCentroids(img, 16))\n  .step('03_export', async (ctx, colors) => compileSwatches(colors));`,
  },
  {
    id: 'batch-processing',
    name: 'Batch Processing',
    category: 'Bulk Pipeline',
    description: 'Concurrent processing of asset packages across distributed worker nodes.',
    currentTimeSeconds: 2.1,
    maxTimelineSeconds: 6.0,
    isRunning: true,
    selectedStageId: 'batch-fanout',
    stages: [
      {
        id: 'batch-intake',
        stepNumber: '01',
        name: 'Intake',
        status: 'completed',
        duration: '0.4s',
        durationSeconds: 0.4,
        progressPercent: 100,
        description: 'Unpack zip bundle and register manifest items.',
        input: { name: 'assets_archive.zip', size: '148 MB' },
        output: { statusText: '42 items unpacked', isProcessing: false, name: 'manifest.json', size: '84 KB' },
        dependencies: [{ name: 'unzip-stream', status: 'Available' }],
        recentEvents: [{ timestamp: '14:10:01', message: 'Extracted 42 raster assets' }],
        timeline: { start: 0.1, duration: 0.4 },
      },
      {
        id: 'batch-fanout',
        stepNumber: '02',
        name: 'Fanout',
        status: 'running',
        duration: '1.7s',
        durationSeconds: 1.7,
        progressPercent: 48,
        description: 'Distributes vectorization jobs across worker pool.',
        input: { name: 'manifest.json', size: '84 KB' },
        output: { statusText: '20/42 processed', isProcessing: true },
        dependencies: [{ name: 'WorkerPool', status: 'Available' }],
        recentEvents: [{ timestamp: '14:10:03', message: 'Allocated 8 concurrent threads' }],
        timeline: { start: 0.5, duration: 1.7, projectedEnd: 3.2 },
      },
      {
        id: 'batch-bundle',
        stepNumber: '03',
        name: 'Bundle',
        status: 'waiting',
        duration: 'Waiting',
        durationSeconds: 0,
        progressPercent: 0,
        description: 'Gathers all artifacts into target release archive.',
        input: { name: 'vector_bundle', size: 'Pending' },
        output: { statusText: 'Awaiting fanout completion', isProcessing: false },
        dependencies: [{ name: 'ZipArchiver', status: 'Available' }],
        recentEvents: [{ timestamp: '14:10:02', message: 'Storage spool initialized' }],
        timeline: { start: 3.2, duration: 1.0, projectedEnd: 4.2 },
      },
    ],
    logs: [
      { id: 'b1', timestamp: '14:10:00.000', level: 'INFO', stage: 'System', message: 'Batch run initialized' },
      { id: 'b2', timestamp: '14:10:02.120', level: 'INFO', stage: 'Fanout', message: '20 of 42 tasks finished' },
    ],
    codeDefinition: `// Batch Processing Pipeline\nimport { definePipeline, fanout } from '@orvia/runtime';\n\nexport default definePipeline('Batch Processing')\n  .step('01_intake', async (ctx) => unpackArchive(ctx.input))\n  .step('02_fanout', async (ctx, manifest) => fanout(manifest.items, 8))\n  .step('03_bundle', async (ctx, outputs) => createTarball(outputs));`,
  },
  {
    id: 'qa-validation',
    name: 'QA Validation',
    category: 'Quality Assurance',
    description: 'Automated test suite verifying geometric fidelity and raster diff score.',
    currentTimeSeconds: 3.2,
    maxTimelineSeconds: 5.0,
    isRunning: false,
    selectedStageId: 'qa-diff',
    stages: [
      {
        id: 'qa-render',
        stepNumber: '01',
        name: 'Render',
        status: 'completed',
        duration: '0.5s',
        durationSeconds: 0.5,
        progressPercent: 100,
        description: 'Rasterize vector SVG at 1x, 2x, 4x resolutions.',
        input: { name: 'master.svg', size: '820 KB' },
        output: { statusText: 'diff_renders.tar', isProcessing: false, name: 'diff_renders.tar', size: '8.4 MB' },
        dependencies: [{ name: 'resvg', status: 'Available' }],
        recentEvents: [{ timestamp: '14:05:01', message: 'Rendered 3 scale variants' }],
        timeline: { start: 0.1, duration: 0.5 },
      },
      {
        id: 'qa-diff',
        stepNumber: '02',
        name: 'Diff Score',
        status: 'completed',
        duration: '1.2s',
        durationSeconds: 1.2,
        progressPercent: 100,
        description: 'Compute pixel-by-pixel SSIM diff index vs master artwork.',
        input: { name: 'diff_renders.tar', size: '8.4 MB' },
        output: { statusText: 'SSIM: 0.994 (Pass)', isProcessing: false, name: 'report.json', size: '14 KB' },
        dependencies: [{ name: 'pixelmatch', status: 'Available' }],
        recentEvents: [{ timestamp: '14:05:03', message: 'SSIM fidelity score 99.4% passed' }],
        timeline: { start: 0.6, duration: 1.2 },
      },
    ],
    logs: [
      { id: 'q1', timestamp: '14:05:00.000', level: 'INFO', stage: 'System', message: 'QA Test suite started' },
      { id: 'q2', timestamp: '14:05:03.200', level: 'SUCCESS', stage: 'Diff Score', message: 'Validation passed with 0 warnings' },
    ],
    codeDefinition: `// QA Validation Pipeline\nimport { definePipeline } from '@orvia/runtime';\n\nexport default definePipeline('QA Validation')\n  .step('01_render', async (ctx) => renderScales(ctx.input, [1, 2, 4]))\n  .step('02_diff', async (ctx, renders) => computeSSIM(renders, ctx.groundTruth));`,
  },
  {
    id: 'export-pipeline',
    name: 'Export',
    category: 'Distribution',
    description: 'Cloud replication and artifact signing for production publishing.',
    currentTimeSeconds: 0.8,
    maxTimelineSeconds: 4.0,
    isRunning: false,
    selectedStageId: 'exp-sign',
    stages: [
      {
        id: 'exp-sign',
        stepNumber: '01',
        name: 'Cryptographic Sign',
        status: 'completed',
        duration: '0.4s',
        durationSeconds: 0.4,
        progressPercent: 100,
        description: 'Generates SHA-256 integrity checksums and cryptographic manifest.',
        input: { name: 'package.tar.gz', size: '3.4 MB' },
        output: { statusText: 'package.sig', isProcessing: false, name: 'checksums.txt', size: '512 B' },
        dependencies: [{ name: 'OpenSSL', status: 'Available' }],
        recentEvents: [{ timestamp: '13:58:01', message: 'Manifest signed with Orvia KMS key' }],
        timeline: { start: 0.1, duration: 0.4 },
      },
      {
        id: 'exp-publish',
        stepNumber: '02',
        name: 'CDN Sync',
        status: 'completed',
        duration: '0.6s',
        durationSeconds: 0.6,
        progressPercent: 100,
        description: 'Syncs build artifacts to global edge cache buckets.',
        input: { name: 'package.tar.gz', size: '3.4 MB' },
        output: { statusText: 'Published to 14 Edge POPs', isProcessing: false, name: 'release_urls.json', size: '1.2 KB' },
        dependencies: [{ name: 'Cloudflare-Worker-API', status: 'Available' }],
        recentEvents: [{ timestamp: '13:58:02', message: 'Purged cache and deployed release' }],
        timeline: { start: 0.5, duration: 0.6 },
      },
    ],
    logs: [
      { id: 'e1', timestamp: '13:58:00.000', level: 'INFO', stage: 'System', message: 'Export job initiated' },
      { id: 'e2', timestamp: '13:58:02.100', level: 'SUCCESS', stage: 'CDN Sync', message: 'Edge distribution finished successfully' },
    ],
    codeDefinition: `// Export Pipeline\nimport { definePipeline } from '@orvia/runtime';\n\nexport default definePipeline('Export')\n  .step('01_sign', async (ctx) => signPayload(ctx.input))\n  .step('02_publish', async (ctx, signed) => syncEdgeCDN(signed));`,
  },
];
