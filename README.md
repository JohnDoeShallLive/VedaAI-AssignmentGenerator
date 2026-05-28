# VedaAI — AI Assessment Creator

VedaAI is a production-grade, fully functional AI-powered assessment creation platform built as a monorepo. It enables school and college teachers to generate structured, curriculum-aligned, beautifully formatted question papers and keys in minutes.

---

## 🏗️ High-Level System Architecture

VedaAI is structured as a **pnpm monorepo** with a clean architecture decoupling the frontend client, backend server logic, and shared package utilities:

```
vedaai/
├── apps/
│   ├── web/                    # Next.js 15 App Router Frontend
│   └── api/                    # Express + TypeScript API Server + Workers
├── packages/
│   └── types/                  # Shared TypeScript types & interfaces
├── docker-compose.yml          # Container configuration for local DB services
└── README.md                   # Installation & Setup documentation
```

### ⚡ Key Architectural Pipelines

1. **Structured Question Paper Generation Flow**:
   - **Form submission**: The teacher submits the configuration (Subject, Due Date, Question configs count/marks, optional instructions and uploaded PDF/JPG/PNG files) on the UI.
   - **Persistence & Queueing**: The API server persists the assignment in MongoDB with a `queued` status and creates a BullMQ task under the `generate-paper` Redis queue.
   - **Worker Orchestration**: A dedicated BullMQ Worker picks up the job, updates the status to `processing`, and broadcasts real-time updates to the active client through native WebSocket connections.
   - **AI Formulation & Schema Validation**: The AI builder builds a prompt, queries OpenAI `gpt-4o-mini`, parses the resulting JSON, and strictly validates it against a Mongoose/Zod schema.
   - **Completion**: Once saved in MongoDB, status changes to `done`, and the client is automatically navigated to the print-ready Output sheet!
2. **Caching Strategy**:
   - Paper results are retrieved from MongoDB Atlas on first access and cached using **Redis** with a 1-hour Time To Live (TTL).
   - Subsequent page renders and Puppeteer PDF requests serve straight from Redis cache memory, minimizing database connection strain and latency.
   - Cache invalidation occurs automatically when a teacher clicks **Regenerate**.
3. **Headless Puppeteer PDF Downloads**:
   - When a user clicks **Download as PDF**, the API server launches a headless Chrome browser instance via Puppeteer.
   - It navigates to the result page with a `?print=true` URL query parameter.
   - The React output component captures the parameter to strip the headers and navigation bars and applies Times New Roman/Georgia exam layout styles.
   - Puppeteer prints the canvas to A4 dimensions, streams it directly as a binary attachment, and cleans up the browser context.

---

## 🛠️ Tech Stack & Requirements

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript (strict rules, no `any` values)
- **Styling**: Tailwind CSS + Custom print-style overrides
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validator
- **Icons**: Lucide React
- **WebSocket**: Native browser WebSocket client

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express + TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Queue/Broker**: Redis (via ioredis) + BullMQ
- **WebSocket Server**: ws WebSocket Server
- **File Upload**: Multer
- **PDF Generation**: Headless Puppeteer

---

## 💻 Local Setup & Execution

### 1. Prerequisites
- **Node.js** 20 LTS or higher
- **pnpm** v9 or higher
- **Docker** (for MongoDB and Redis services)

### 2. Environment Configuration
Create environment files in both the API server and Web application workspace root:

**Backend API (`apps/api/.env`)**:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
GROQ_API_KEY=your_groq_api_key_here     # Primary AI provider (uses llama-3.3-70b-versatile by default)
GROQ_MODEL=llama-3.3-70b-versatile       # Optional: Customize Groq LLM model
OPENAI_API_KEY=your_openai_api_key_here # Optional backup AI provider (uses gpt-4o-mini)
```

**Frontend Client (`apps/web/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 3. Step-by-Step Running Instructions

1. **Spin up local Docker database services**:
   ```bash
   pnpm db:up
   ```
2. **Install all workspace dependencies**:
   ```bash
   pnpm install
   ```
3. **Ensure Chromium is downloaded for Puppeteer**:
   ```bash
   npx puppeteer browsers install chrome
   ```
4. **Compile the shared Types package**:
   ```bash
   pnpm --filter @vedaai/types build
   ```
5. **Run in development mode (API + Web Concurrently)**:
   ```bash
   pnpm dev
   ```
6. **Open the browser**:
   Visit [http://localhost:3000](http://localhost:3000) to create and view assessments!

---

## 💡 Implementation Assumptions & Decisions

- **Graceful Local Mock Fallback**: To facilitate testing without requiring a paid Groq or OpenAI account, the `ai.service.ts` includes an intelligent **Mock Generation Engine**. If both `GROQ_API_KEY` and `OPENAI_API_KEY` are omitted, VedaAI automatically constructs beautiful, subject-relevant, curriculum-aligned exam sections, questions (MCQ, Short, Diagram, Numerical, Long Answer), difficulty parameters, and concise solution manuals.
- **Mock School Profile Context**: For MVP evaluation, the student details block and the paper headers utilize default settings ("St. Kabir High School, Mumbai" and "Class X") as mock profile metadata, which are fully configurable inside the worker logic.
