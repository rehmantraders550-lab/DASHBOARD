# NodeInspector 'Download Logs' Feature

Export current execution logs for the selected pipeline stage in both structured JSON and plain-text formats for offline analysis and auditing.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive clarification phase:

- **Export Formats**: Dual format option with a combined action button and format dropdown menu allowing users to select either **JSON (.json)** or **Plain Text Log (.txt / .log)**.
- **Log Scope**: Export includes both the selected stage's **specific recent events** and any **correlated pipeline execution logs** matching this stage or pipeline run, timestamped and formatted with metadata (stage name, step number, execution status, input/output artifacts).

---

### 1. Overview & Core Concept

- **What It Does**: Adds an intuitive, high-utility **Download Logs** action to the NodeInspector header/footer in the ORVIA Code Visualizer. Users can export the telemetry, events, and operational logs of whichever stage is currently inspected (e.g. *Step 03 Vectorize*) directly to their local machine.
- **Target Audience**: Engineers and pipeline operators diagnosing vectorization issues, measuring node latencies, or archiving audit logs.
- **Key Value**: Enables one-click offline debugging without manual copy-pasting, preserving structured timestamps, severity levels, and execution metadata.

---

### 2. User Experience & Visual Design

- **Location & Visual Treatment**:
  - Located within the `NodeInspector` at the top right header (or adjacent to the Recent Events header) with a clean, restrained icon button (`Download` / `FileDown` icon) paired with a compact format dropdown.
  - Matches the established ORVIA visual system:
    - Neutral canvas `#FFFFFF`, hairline border `#E5E1DA`, subtle hover state `#F9F7F3`.
    - Accent orange `#F97316` for active download triggers and interactive feedback.
    - Zero-pill discipline: Clean micro-typography with monospace format indicators (`.json`, `.txt`).
- **Interactive Feedback**:
  - Smooth 150ms dropdown reveal on format click (`JSON (.json)` vs `Log Text (.txt)`).
  - Micro-interaction: Download button briefly transitions to a success checkmark (`Downloaded`) for 2 seconds before reverting.
  - Generates client-side file blob download via a temporary anchor element without page reload or layout shift.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Export Formats (JSON & Text)**
  - *Chosen Approach*: Provide a segmented or dropdown split button: clicking the primary button downloads the active/default format, while the dropdown selector allows toggling between structured JSON (for automated parser scripts) and standard formatted plaintext (for reading in terminal/editor).
  - *Why*: Directly satisfies developer ergonomics without cluttering the compact inspector surface.
- **Decision 2: Comprehensive Log Scope**
  - *Chosen Approach*: Assemble a unified export payload containing:
    1. Pipeline & stage metadata (workflow name, stage ID, step number, status, duration, timestamp).
    2. Input & output payload details.
    3. Stage-specific recent events list.
    4. Correlated execution logs from the pipeline event stream corresponding to this stage.
  - *Why*: Stage events alone miss runtime pipeline traces (e.g., zero-copy memory transfers, memory usage); bundling correlated logs gives complete operational visibility.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                        NodeInspector                         │
│  ┌──────────────────────┐        ┌────────────────────────┐  │
│  │ Step 03 Vectorize    │        │ [📥 Download Logs ▾]   │  │
│  └──────────────────────┘        └───────────┬────────────┘  │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                                               ▼
                              ┌────────────────────────────────┐
                              │    exportStageLogs(stage, wf)  │
                              └────────────────┬───────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
          ┌─────────────────────────┐                     ┌─────────────────────────┐
          │      JSON Payload       │                     │    Plain Text Payload   │
          │  - metadata (stage, wf) │                     │  - Header banner        │
          │  - input & output files │                     │  - Metadata key/values  │
          │  - recentEvents array   │                     │  - Chronological trace  │
          │  - correlatedLogs array │                     │  - Formatted log stream │
          └────────────┬────────────┘                     └────────────┬────────────┘
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               ▼
                                  ┌────────────────────────┐
                                  │   Browser Blob URL     │
                                  │   a.download trigger   │
                                  └────────────────────────┘
```

- **Data Models**:
  - JSON Schema:
    ```json
    {
      "workflow": "Artwork to Vector",
      "stage": {
        "id": "vectorize",
        "step": "03",
        "name": "Vectorize",
        "status": "running",
        "duration": "1.4s"
      },
      "exportedAt": "2026-10-20T23:51:00.000Z",
      "artifacts": { "input": {...}, "output": {...} },
      "dependencies": [...],
      "events": [...],
      "correlatedLogs": [...]
    }
    ```
  - Text Schema:
    Clean ASCII-ruled log header with timestamps, log levels (`[INFO]`, `[DEBUG]`), and stage tags.
