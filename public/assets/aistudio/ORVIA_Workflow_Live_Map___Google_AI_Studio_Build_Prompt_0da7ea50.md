Build a functional responsive web UI called **ORVIA Code Visualizer — Workflow Pipe Live Map** based on the attached reference image.

## OBJECTIVE
Create a minimal, elegant live workflow visualizer for inspecting code-processing pipelines in real time. Match the reference image closely. Do not redesign it or add unnecessary dashboard elements.

## VISUAL SYSTEM
- Background: warm ivory `#F7F4EE`
- Primary charcoal: `#242628`
- Secondary charcoal: `#343638`
- Accent orange: `#F97316`
- Active orange tint: `#FFF1E7`
- White/card surface: `#FFFFFF`
- Muted text: `#737373`
- Borders: `#E5E1DA`
- Success may use restrained green only where semantically required.
- Use generous whitespace, thin borders, subtle shadows and approximately 12–16px radii.
- Editorial serif for major workflow/title text.
- Clean sans-serif for UI labels, navigation, status and data.
- No gradients except extremely subtle state treatment.
- No glassmorphism, neon, excessive animation or decorative graphics.

## PAGE STRUCTURE

### 1. Left Sidebar
Charcoal background.

Show:
- ORVIA logo / wordmark
- “CODE VISUALIZER”
- Workflows
  - Artwork to Vector — active
  - Color Analysis
  - Batch Processing
  - QA Validation
  - Export
- Divider
- Repository
- Integrations
- Settings

Active item uses restrained orange highlighting.

### 2. Top Navigation
Show:
- Live Map — active
- Code
- Execution
- Dependencies
- Simulation

Right side:
- Orange status dot
- “Workflow Running”
- Stop button

### 3. Main Workflow Canvas
Heading:
**Artwork to Vector**

Subtitle:
“Live view of ORVIA’s workflow. Click a step to see details.”

Create this horizontal pipeline:

`Intake → Analyze → Vectorize → Validate → Export`

Each stage is a compact card.

States:
- Intake: completed, 0.3s
- Analyze: completed, 0.7s
- Vectorize: running, 1.4s
- Validate: waiting
- Export: waiting

Connect cards using smooth curved pipes.

Completed pipe segments should use orange.
Future/inactive segments should use muted gray.

Vectorize is the selected stage:
- thin orange outline
- subtle orange-tinted background
- circular progress indicator
- no excessive glow

### 4. Right Inspector
When a workflow stage is clicked, update this panel.

For Vectorize show:

Step 03  
**Vectorize**

Status: Running  
Duration: 1.4s  
Progress: 60%

Description:
“Reconstructs clean vector paths from the analyzed artwork.”

Input:
`artwork_normalized.png — 12.4 MB`

Output:
`Processing...`

Dependencies:
- resvg — Available
- SVG.js — Available
- DACS — Available

Recent Events:
- Started vectorization process
- Loaded resvg
- Parsed 1,284 paths
- Rebuilding topology
- Optimizing curves...

### 5. Bottom Timeline
Create tabs:

`Timeline | Logs`

Timeline is default.

Display five rows:
- Intake
- Analyze
- Vectorize
- Validate
- Export

Use a restrained Gantt-style execution timeline.

Show a vertical current-time marker at `1.4s`.

## INTERACTION

Implement real interactions, not a static mockup.

- Clicking workflow cards selects them and updates the inspector.
- Animate workflow progress subtly.
- Active data movement may use a small moving pulse along the connecting pipe.
- Timeline reflects workflow state.
- Timeline/Logs tabs work.
- Stop button pauses simulation.
- Clicking Stop again changes to Resume and resumes it.
- Navigation active states work.
- Add accessible hover/focus states.
- Respect `prefers-reduced-motion`.

Keep animations slow and functional. Never animate merely for decoration.

## RESPONSIVENESS
Desktop should closely match the reference.

On smaller screens:
- Collapse sidebar.
- Allow workflow stages to stack or horizontally scroll.
- Inspector moves below workflow.
- Timeline remains readable.
- No horizontal page overflow.

## IMPLEMENTATION
Use the simplest production-quality stack available in the current environment.

Prefer:
- React
- TypeScript
- CSS/Tailwind
- lightweight SVG for workflow connectors and timeline

Do NOT add heavy visualization libraries unless necessary.

Create reusable components:
- `Sidebar`
- `TopNav`
- `WorkflowCanvas`
- `WorkflowNode`
- `WorkflowConnector`
- `NodeInspector`
- `ExecutionTimeline`
- `EventLog`

Use local mock workflow data initially, but structure components so live execution data can replace it later.

## IMPORTANT
This is an **operational visualization tool**, not a generic analytics dashboard.

Prioritize:
1. workflow readability
2. current execution state
3. node inspection
4. timing
5. failure visibility

Avoid:
- excessive cards
- charts unrelated to workflow execution
- dense telemetry
- giant dependency graphs
- decorative animation
- unnecessary libraries
- unnecessary files
- placeholder sections

First build the exact core interface shown in the reference. Keep the implementation compact and modular. Do not create features outside this specification.