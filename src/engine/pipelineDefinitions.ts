import { StaticPipelineDefinition } from './workflowModel';

export const STATIC_PIPELINES: StaticPipelineDefinition[] = [
  {
    id: 'artwork-to-vector',
    name: 'Artwork to Vector',
    category: 'Vectorization',
    description: "Live view of ORVIA's workflow. Click a step to see details.",
    defaultTimeSeconds: 1.4,
    maxTimelineSeconds: 5.5,
    codeDefinition: `// ORVIA Code Pipeline Definition
// Pipeline ID: artwork_to_vector
// Target Engine: Orvia Core v3.2.0

import { definePipeline } from '@orvia/runtime';
import { normalizeRaster, analyzeContours, vectorizePaths, validateSvg, exportPackages } from './nodes';

export default definePipeline('Artwork to Vector', {
  concurrency: 4,
  timeout: '30s',
  trace: true,
})
  .step('01_intake', async (ctx) => {
    const rawAsset = await ctx.input.asBuffer();
    return await normalizeRaster(rawAsset, { targetDpi: 300, colorSpace: 'sRGB' });
  })
  .step('02_analyze', async (ctx, normalized) => {
    return await analyzeContours(normalized, { colorClusters: 8, contrastThreshold: 0.18 });
  })
  .step('03_vectorize', async (ctx, contours) => {
    return await vectorizePaths(contours, { engine: 'resvg', curveTolerance: 0.04 });
  })
  .step('04_validate', async (ctx, svgDraft) => {
    return await validateSvg(svgDraft, { maxNodes: 25000, checkSelfIntersections: true });
  })
  .step('05_export', async (ctx, validatedSvg) => {
    return await exportPackages(validatedSvg, ['svg', 'eps', 'pdf']);
  });`,
    nodes: [
      {
        id: 'intake',
        stepNumber: '01',
        name: 'Intake',
        description: 'Ingests raw raster assets, extracts metadata, and normalizes DPI and color profile.',
        plannedStart: 0.1,
        expectedDuration: 0.3,
        dependsOn: [],
        inputTemplate: {
          name: 'artwork_master_source.png',
          size: '14.8 MB',
          type: 'image/png',
        },
        outputTemplate: {
          name: 'artwork_normalized.png',
          size: '12.4 MB',
          type: 'image/png',
          runningStatusText: 'Normalizing DPI & color space...',
        },
        dependencies: [
          { name: 'libvips', status: 'Available', version: '8.15.2' },
          { name: 'sharp', status: 'Available', version: '0.33.2' },
        ],
        baseCpuProfile: { runningBase: 42, runningVariance: 12, idleBase: 5 },
        baseMemProfile: { runningBase: 24, runningVariance: 4, idleBase: 12 },
      },
      {
        id: 'analyze',
        stepNumber: '02',
        name: 'Analyze',
        description: 'Executes edge detection, segmentation, palette extraction, and path boundary prediction.',
        plannedStart: 0.4,
        expectedDuration: 0.7,
        dependsOn: ['intake'],
        inputTemplate: {
          name: 'artwork_normalized.png',
          size: '12.4 MB',
          type: 'image/png',
        },
        outputTemplate: {
          name: 'color_topology_map.json',
          size: '1.8 MB',
          type: 'application/json',
          runningStatusText: 'Analyzing 8 color clusters...',
        },
        dependencies: [
          { name: 'OpenCV-WASM', status: 'Available', version: '4.9.0' },
          { name: 'potrace-core', status: 'Available', version: '1.2.1' },
        ],
        baseCpuProfile: { runningBase: 68, runningVariance: 15, idleBase: 8 },
        baseMemProfile: { runningBase: 38, runningVariance: 6, idleBase: 18 },
      },
      {
        id: 'vectorize',
        stepNumber: '03',
        name: 'Vectorize',
        description: 'Reconstructs clean vector paths from the analyzed artwork.',
        plannedStart: 0.8,
        expectedDuration: 1.4, // Running from 0.8 to 2.2, at 1.4s it is running (duration: 1.4s displayed)
        dependsOn: ['analyze'],
        inputTemplate: {
          name: 'artwork_normalized.png',
          size: '12.4 MB',
          type: 'image/png',
        },
        outputTemplate: {
          name: 'vector_paths.svg',
          size: '840 KB',
          type: 'image/svg+xml',
          runningStatusText: 'Processing...',
        },
        dependencies: [
          { name: 'resvg', status: 'Available', version: '0.41.0' },
          { name: 'SVG.js', status: 'Available', version: '3.2.0' },
          { name: 'DACS', status: 'Available', version: '2.0.4' },
        ],
        baseCpuProfile: { runningBase: 78, runningVariance: 14, idleBase: 12 },
        baseMemProfile: { runningBase: 44, runningVariance: 8, idleBase: 22 },
      },
      {
        id: 'validate',
        stepNumber: '04',
        name: 'Validate',
        description: 'Verifies node continuity, self-intersecting loops, and SVG 1.1 / 2.0 standard conformance.',
        plannedStart: 2.2,
        expectedDuration: 0.8,
        dependsOn: ['vectorize'],
        inputTemplate: {
          name: 'vector_paths.svg',
          size: '840 KB',
          type: 'image/svg+xml',
        },
        outputTemplate: {
          name: 'validated_artwork.svg',
          size: '720 KB',
          type: 'image/svg+xml',
          runningStatusText: 'Verifying Bézier junctions...',
        },
        dependencies: [
          { name: 'SVGO', status: 'Available', version: '3.3.2' },
          { name: 'W3C-Validator', status: 'Available', version: '1.8.0' },
        ],
        baseCpuProfile: { runningBase: 50, runningVariance: 10, idleBase: 4 },
        baseMemProfile: { runningBase: 26, runningVariance: 3, idleBase: 14 },
      },
      {
        id: 'export',
        stepNumber: '05',
        name: 'Export',
        description: 'Compiles clean vector deliverables in SVG, EPS, and high-fidelity PDF formats.',
        plannedStart: 3.0,
        expectedDuration: 1.5,
        dependsOn: ['validate'],
        inputTemplate: {
          name: 'validated_artwork.svg',
          size: '720 KB',
          type: 'image/svg+xml',
        },
        outputTemplate: {
          name: 'vector_package.zip',
          size: '2.4 MB',
          type: 'application/zip',
          runningStatusText: 'Packaging multi-res bundles...',
        },
        dependencies: [
          { name: 'PDFKit', status: 'Available', version: '0.14.0' },
          { name: 'S3-Publisher', status: 'Available', version: '3.5.1' },
        ],
        baseCpuProfile: { runningBase: 35, runningVariance: 8, idleBase: 4 },
        baseMemProfile: { runningBase: 32, runningVariance: 5, idleBase: 10 },
      },
    ],
    eventStream: [
      { id: 'e1', timestampOffset: 0.05, wallClockTime: '14:21:04', type: 'PIPELINE_INIT', level: 'INFO', message: 'Workflow pipeline initialized with execution ID wf_98a72b' },
      { id: 'e2', timestampOffset: 0.1, wallClockTime: '14:21:05', type: 'STAGE_START', stageId: 'intake', level: 'INFO', message: 'Asset received via secure upload pipe: artwork_master_source.png (14.8 MB)' },
      { id: 'e3', timestampOffset: 0.2, wallClockTime: '14:21:05', type: 'LOG_MESSAGE', stageId: 'intake', level: 'INFO', message: 'Read EXIF metadata and color space profile' },
      { id: 'e4', timestampOffset: 0.3, wallClockTime: '14:21:06', type: 'LOG_MESSAGE', stageId: 'intake', level: 'INFO', message: 'Normalized resolution to 300 DPI' },
      { id: 'e5', timestampOffset: 0.4, wallClockTime: '14:21:06', type: 'STAGE_COMPLETE', stageId: 'intake', level: 'SUCCESS', message: 'Normalization complete in 0.3s. Emitted artwork_normalized.png' },
      { id: 'e6', timestampOffset: 0.45, wallClockTime: '14:21:06', type: 'STAGE_START', stageId: 'analyze', level: 'INFO', message: 'Submitting canvas slices to feature analyzer' },
      { id: 'e7', timestampOffset: 0.6, wallClockTime: '14:21:07', type: 'LOG_MESSAGE', stageId: 'analyze', level: 'INFO', message: 'Segmented 8 distinct semantic color layers' },
      { id: 'e8', timestampOffset: 0.8, wallClockTime: '14:21:07', type: 'LOG_MESSAGE', stageId: 'analyze', level: 'INFO', message: 'Detected high-frequency contour edges' },
      { id: 'e9', timestampOffset: 1.0, wallClockTime: '14:21:08', type: 'LOG_MESSAGE', stageId: 'analyze', level: 'INFO', message: 'Emitted vector topological node hints' },
      { id: 'e10', timestampOffset: 1.1, wallClockTime: '14:21:08', type: 'STAGE_COMPLETE', stageId: 'analyze', level: 'SUCCESS', message: 'Completed feature analysis in 0.7s. Emitted color_topology_map.json' },
      { id: 'e11', timestampOffset: 1.15, wallClockTime: '14:21:08', type: 'STAGE_START', stageId: 'vectorize', level: 'INFO', message: 'Started vectorization process via resvg engine' },
      { id: 'e12', timestampOffset: 1.25, wallClockTime: '14:21:09', type: 'LOG_MESSAGE', stageId: 'vectorize', level: 'DEBUG', message: 'Loaded resvg v0.41.0 with SIMD acceleration enabled' },
      { id: 'e13', timestampOffset: 1.35, wallClockTime: '14:21:10', type: 'LOG_MESSAGE', stageId: 'vectorize', level: 'INFO', message: 'Parsed 1,284 paths' },
      { id: 'e14', timestampOffset: 1.4, wallClockTime: '14:21:11', type: 'LOG_MESSAGE', stageId: 'vectorize', level: 'INFO', message: 'Rebuilding topology' },
      { id: 'e15', timestampOffset: 1.45, wallClockTime: '14:21:12', type: 'LOG_MESSAGE', stageId: 'vectorize', level: 'INFO', message: 'Optimizing curves with Douglas-Peucker epsilon tolerance 0.04' },
      { id: 'e16', timestampOffset: 1.8, wallClockTime: '14:21:13', type: 'LOG_MESSAGE', stageId: 'vectorize', level: 'DEBUG', message: 'Solved 43 junction loops' },
      { id: 'e17', timestampOffset: 2.2, wallClockTime: '14:21:14', type: 'STAGE_COMPLETE', stageId: 'vectorize', level: 'SUCCESS', message: 'Vectorization finished in 1.4s. Emitted vector_paths.svg' },
      { id: 'e18', timestampOffset: 2.25, wallClockTime: '14:21:14', type: 'STAGE_START', stageId: 'validate', level: 'INFO', message: 'Validating SVG standard conformance and node count' },
      { id: 'e19', timestampOffset: 2.6, wallClockTime: '14:21:15', type: 'LOG_MESSAGE', stageId: 'validate', level: 'INFO', message: 'Node count verified: 12,410 nodes (within 25,000 threshold)' },
      { id: 'e20', timestampOffset: 3.0, wallClockTime: '14:21:16', type: 'STAGE_COMPLETE', stageId: 'validate', level: 'SUCCESS', message: 'SVG validation passed with 0 warnings' },
      { id: 'e21', timestampOffset: 3.05, wallClockTime: '14:21:16', type: 'STAGE_START', stageId: 'export', level: 'INFO', message: 'Packaging SVG, EPS, and high-fidelity PDF targets' },
      { id: 'e22', timestampOffset: 4.5, wallClockTime: '14:21:18', type: 'STAGE_COMPLETE', stageId: 'export', level: 'SUCCESS', message: 'Export completed. Artifacts synced to deployment cache.' },
    ],
  },
  {
    id: 'color-analysis',
    name: 'Color Analysis',
    category: 'Palette Extraction',
    description: 'Detailed chromatic clustering, color harmony maps, and pigment profiling.',
    defaultTimeSeconds: 1.2,
    maxTimelineSeconds: 4.0,
    codeDefinition: `// Color Analysis Pipeline\nimport { definePipeline } from '@orvia/runtime';\n\nexport default definePipeline('Color Analysis')\n  .step('01_intake', async (ctx) => ctx.input)\n  .step('02_kmeans', async (ctx, img) => extractCentroids(img, 16))\n  .step('03_export', async (ctx, colors) => compileSwatches(colors));`,
    nodes: [
      {
        id: 'color-intake',
        stepNumber: '01',
        name: 'Intake',
        description: 'Read input imagery and calibrate color gamut profile.',
        plannedStart: 0.1,
        expectedDuration: 0.2,
        dependsOn: [],
        inputTemplate: { name: 'palette_source.jpg', size: '6.4 MB' },
        outputTemplate: { name: 'calibrated_source.png', size: '5.9 MB' },
        dependencies: [{ name: 'libvips', status: 'Available' }],
        baseCpuProfile: { runningBase: 35, runningVariance: 8, idleBase: 5 },
        baseMemProfile: { runningBase: 20, runningVariance: 3, idleBase: 10 },
      },
      {
        id: 'color-k-means',
        stepNumber: '02',
        name: 'K-Means',
        description: 'Run accelerated K-Means clustering across 16 color centroids.',
        plannedStart: 0.3,
        expectedDuration: 0.7,
        dependsOn: ['color-intake'],
        inputTemplate: { name: 'calibrated_source.png', size: '5.9 MB' },
        outputTemplate: { name: 'centroids.json', size: '12 KB' },
        dependencies: [{ name: 'Scikit-WASM', status: 'Available' }],
        baseCpuProfile: { runningBase: 65, runningVariance: 12, idleBase: 8 },
        baseMemProfile: { runningBase: 32, runningVariance: 5, idleBase: 14 },
      },
      {
        id: 'color-export',
        stepNumber: '03',
        name: 'Export',
        description: 'Generates ASE, CSS, and Pantone match swatches.',
        plannedStart: 1.0,
        expectedDuration: 0.2,
        dependsOn: ['color-k-means'],
        inputTemplate: { name: 'centroids.json', size: '12 KB' },
        outputTemplate: { name: 'palette.ase', size: '4 KB' },
        dependencies: [{ name: 'ASE-Encoder', status: 'Available' }],
        baseCpuProfile: { runningBase: 25, runningVariance: 4, idleBase: 4 },
        baseMemProfile: { runningBase: 16, runningVariance: 2, idleBase: 8 },
      },
    ],
    eventStream: [
      { id: 'c1', timestampOffset: 0.05, wallClockTime: '14:18:00', type: 'PIPELINE_INIT', level: 'INFO', message: 'Color Analysis pipeline started' },
      { id: 'c2', timestampOffset: 0.1, wallClockTime: '14:18:01', type: 'STAGE_START', stageId: 'color-intake', level: 'INFO', message: 'Color gamut normalized' },
      { id: 'c3', timestampOffset: 0.3, wallClockTime: '14:18:02', type: 'STAGE_START', stageId: 'color-k-means', level: 'INFO', message: '16 dominant centroids clustered' },
      { id: 'c4', timestampOffset: 1.0, wallClockTime: '14:18:03', type: 'STAGE_COMPLETE', stageId: 'color-export', level: 'SUCCESS', message: 'Color palette ready for export' },
    ],
  },
];
