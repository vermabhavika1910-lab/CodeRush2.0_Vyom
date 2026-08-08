# 🎭 Maestro: Unified Multi-Agent AI Flow Orchestrator

<p align="center">
  <b>Design, orchestrate, and execute complex multi-agent AI workflows on an interactive, cyber-dark visual canvas.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI Badge"/>
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite Badge"/>
</p>

---

## 🌟 Overview

**Maestro** is a state-of-the-art, cyber-dark visual dashboard designed to build, compile, and execute cognitive multi-agent **DAG (Directed Acyclic Graph) workflows**. 

It connects a premium React-TypeScript visual canvas workspace with a Python FastAPI server and **Langflow API core engine** to coordinate automated role-playing LLM agents with real-time budget, latency, and security logs.

---

## ✨ Key Features & Capabilities

### 🎛️ Unified Visual Workspace Layout
* **Fluid Grid System**: Seamlessly resize panels for the left control sidebar, visual flow canvas, execution debugger console, and right agent settings inspector.
* **Rich Glassmorphic Design**: Curated slate gradient colors, high contrast accents, custom CSS micro-animations, and full light/dark themes.

### 🛑 Active-Run Safeguards
* **Prompt Protection**: Composer inputs automatically lock during active runs to prevent runtime overrides.
* **Stop/Edit Gates**: Triggering *"Edit Prompt"* invokes a warning confirmation modal: 
  > *"Editing the prompt will stop the current project. Do you want to continue?"*
* **Instant Cancellation**: Confirming raises a global cancel event that halts timers and API polling immediately, resetting controls.

### 📊 Dynamic Verification scoring
* **Real-time Metrics**: Visual rating gauge scales based on workflow success:
  * **Running**: `0%` rating with inactive grey indicators.
  * **Success**: Computes a dynamic rating between **`92%` and `98%`** with green checkmarks.
  * **Failed/Blocked**: Drops to `0%` with warning badges and red indicators.

### 🛡️ Smart Offline Simulator
* **Interactive Mock Generators**: Automatically detects and responds dynamically based on prompt intent to replace generic mock templates:
  * 🔒 *Security keywords* ("hack", "exploit") trigger audit logs of SQL injections and CORS vulnerabilities.
  * 🎙️ *Voice/Speech keywords* ("audio", "whisper") generate full WebRTC + Whisper audio streaming architecture notes.
  * 💡 *General queries* dynamically extract subjects to build relevant research structures.

---

## 📁 Repository Blueprint

```text
├── backend/                  # Python FastAPI application root
│   ├── main.py               # Server entrypoint and CORS configurations
│   ├── router.py             # Custom API endpoint definitions
│   ├── engine.py             # Topological graph dependency execution loops
│   ├── llm_client.py         # LLM adapter (Groq, Gemini, OpenRouter, GitHub)
│   ├── models.py             # Pydantic schema blueprints (WorkflowGraph)
│   └── requirements.txt      # Python dependencies manifest
│
└── frontend/                 # React Vite TypeScript application root
    ├── src/
    │   ├── App.tsx           # Main workspace view and simulation loops
    │   ├── services/api.ts   # Langflow API v1 client bridge
    │   ├── components/       # UI widget elements
    │   │   ├── PromptComposer.tsx
    │   │   ├── ExecutionPanel.tsx
    │   │   └── TopBar.tsx
    │   └── data/mock.ts      # Default visual nodes registry
    ├── index.html
    └── package.json
```

---

## 🚀 Getting Started

### 1. Configure the Langflow Backend (Recommended)
Maestro bridges directly to Langflow's API server to execute graph nodes:

> [!TIP]
> Ensure Langflow is running locally on port `7860`:
> ```bash
> pip install langflow
> langflow run --port 7860
> ```

### 2. Launch the React Visual Dashboard
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Live Production Deployments

* **Frontend Dashboard**: Deployed on Vercel CDN:  
  👉 **[https://frontend-pi-hazel-52.vercel.app](https://frontend-pi-hazel-52.vercel.app)**
* **Backend Engine**: Ready for [Render.com](https://render.com) deployment. Set base directory to `backend/` and configure your API keys (`GROQ_API_KEY`, etc.) inside environment settings to activate live completions.
