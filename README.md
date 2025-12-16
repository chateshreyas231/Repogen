# Repogen

Professional report generation platform for compliance and accessibility teams. Transform project resources into structured, defensible reports using a visual graph-based canvas.

## Features

- **Graph-Based Report Builder**: Visual React Flow canvas for building report structure
- **AI-Assisted Generation**: Section-level AI prompts with resource context (no hallucinations)
- **Resource Library**: Centralized project resources (notes, PDFs, images, tables, links)
- **Live Report Preview**: Real-time preview with rich text editing, commenting, and highlighting
- **Multi-Format Export**: Export to PDF, Word, Text, and Markdown formats
- **Professional UI**: Business-oriented interface designed for executives and consultants

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js (email + password)
- **AI**: OpenAI API (GPT-4 Turbo)
- **Canvas**: React Flow for graph-based editing
- **Export**: docx, jspdf

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Your First Account

1. Navigate to `/register`
2. Create an account
3. Sign in at `/login`

## Architecture

### System Overview

Repogen is built as a full-stack Next.js application using the App Router pattern.

**Frontend:**
- Next.js 14 with App Router
- React with TypeScript
- Tailwind CSS
- React Flow for graph canvas
- React Quill for rich text editing

**Backend:**
- Next.js API Routes (RESTful)
- SQLite with Prisma ORM
- NextAuth.js for authentication
- OpenAI API for AI generation

### Data Model

**Core Entities:**
- `User`: Authentication and user management
- `Project`: Projects containing reports and resources
- `ProjectResource`: Notes, PDFs, images, tables, links
- `Report`: Generated reports linked to projects
- `ReportNode`: Graph nodes (sections, subsections, content, tables, diagrams, prompts)
- `ReportComment`: Comments on report content
- `ReportHighlight`: Text highlights with notes

**Relationships:**
```
User → Project (1:N)
Project → ProjectResource (1:N)
Project → Report (1:N)
Report → ReportNode (1:N)
Report → ReportComment (1:N)
Report → ReportHighlight (1:N)
```

### API Routes

**Authentication:**
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

**Projects:**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `GET /api/projects/[id]/resources` - List project resources
- `POST /api/projects/[id]/resources` - Add resource

**Reports:**
- `GET /api/reports?projectId=...` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/[id]` - Get report details
- `GET /api/reports/[id]/nodes` - Get report nodes (graph structure)
- `POST /api/reports/[id]/nodes` - Add node
- `PATCH /api/reports/[id]/nodes/[nodeId]` - Update node
- `DELETE /api/reports/[id]/nodes/[nodeId]` - Delete node
- `POST /api/reports/[id]/generate` - Generate content via AI
- `GET /api/reports/[id]/export?format=pdf|docx|txt|markdown` - Export report

**Comments & Highlights:**
- `GET /api/reports/[id]/comments` - Get comments
- `POST /api/reports/[id]/comments` - Add comment
- `DELETE /api/reports/[id]/comments/[commentId]` - Delete comment
- `GET /api/reports/[id]/highlights` - Get highlights
- `POST /api/reports/[id]/highlights` - Add highlight
- `DELETE /api/reports/[id]/highlights/[highlightId]` - Delete highlight

### Component Structure

**Pages:**
- `/` - Landing page
- `/login` - Authentication
- `/register` - User registration
- `/dashboard` - Main dashboard
- `/projects` - Project list
- `/projects/[id]` - Project detail
- `/reports/[id]` - Report workspace (graph canvas)

**Key Components:**
- `components/graph/flow-canvas.tsx` - React Flow canvas for report structure
- `components/graph/resources-panel.tsx` - Resource library sidebar
- `components/graph/report-preview.tsx` - Live report preview with editing
- `components/graph/nodes/*` - Custom React Flow node components

## Workflow

### 1. Create Project
Navigate to Projects → New Project and create a project with metadata.

### 2. Add Resources
Add project resources (text notes, PDFs, images, tables, links) to the resource library.

### 3. Create Report
Create a new report for the project. The report starts with a graph canvas.

### 4. Build Report Structure
- Use the React Flow canvas to add nodes (sections, subsections, content, tables, diagrams)
- All nodes are arranged in a vertical line
- Connect nodes to define report flow
- Drag and drop to reorder

### 5. Generate Content
- Add Prompt nodes with specific prompts
- Attach resources to prompts for context
- Generate content via AI (uses only attached resources, no hallucinations)
- Content is written to connected Content nodes

### 6. Edit & Refine
- Edit content directly in the report preview
- Add comments and highlights
- Reorder nodes by dragging
- Manually edit any section

### 7. Export
- Click "Export Report" dropdown
- Choose format: PDF, Word, Text, or Markdown
- Download formatted report

## AI Generation

### Rules
- AI generation is **only** triggered via Prompt nodes
- Prompts include: prompt text, section context, and attached resources
- AI output is written to connected Content nodes
- **No global AI generation** - all AI is section-specific and resource-grounded
- **No hallucinations** - AI is instructed to use only provided resources

### Prompt Structure
1. System message sets role (professional consultant)
2. User prompt includes:
   - Section title
   - All attached project resources
   - Clear instructions to use only provided information
   - Professional, firm-neutral tone requirement

## Export Formats

- **PDF**: Professional PDF with table of contents and proper formatting
- **Word (.docx)**: Microsoft Word document with full formatting
- **Text (.txt)**: Plain text format
- **Markdown (.md)**: Markdown format for documentation

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database studio (GUI)
npm run db:studio

# Database migrations
npx prisma db push
npx prisma generate
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── projects/     # Project CRUD
│   │   └── reports/      # Report generation & export
│   ├── dashboard/        # Dashboard
│   ├── projects/         # Project pages
│   └── reports/          # Report workspace
├── components/
│   ├── ui/               # Reusable UI components
│   └── graph/            # Graph canvas components
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── export-traversal.ts # Export logic
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── types/
    └── report-nodes.ts   # TypeScript types for nodes
```

## Security

- All API routes require authentication
- Input validation on all endpoints
- Prisma ORM prevents SQL injection
- React automatically escapes content
- HTML from AI is sanitized in editor

## License

MIT
