---
description: 
---

1. Overview
A Human-in-the-Loop (HITL) pipeline that processes uploaded documents, extracts data via OCR/LLM, matches templates using RAG, and manages a multi-stage approval workflow before final distribution.

2. Core Tech Stack
Framework: Next.js (App Router)

Database: MongoDB (Mongoose) for document metadata and versioning

Storage: AWS S3 or Supabase Storage (for PDFs/Docx)

AI/LLM: Gemini 1.5 Pro (for Extraction, Verification, and Routing)

Processing: langchain for RAG, docxtemplater for .docx generation.

3. Database Schema (Mongoose)
JavaScript
const DocumentSchema = new mongoose.Schema({
  originalFileName: String,
  s3Url: String,
  extractedData: Object, // JSON from OCR
  status: { 
    type: String, 
    enum: ['UPLOADED', 'SCANNED', 'PENDING_APPROVAL', 'APPROVED', 'DISPATCHED'],
    default: 'UPLOADED'
  },
  version: { type: Number, default: 1 },
  adminFeedback: String,
  assignedDepartment: String,
  history: [{
    status: String,
    updatedAt: Date,
    changedBy: String
  }]
});
4. Logical Workflow Steps
Phase 1: Ingestion & Extraction
Action: Upload file -> Trigger Gemini Vision API.

Logic: Extract key-value pairs into a structured JSON object.

RAG Step: Compare JSON keys against a "Template Library" (Vector DB) to find the matching .docx template.

Phase 2: Generation & Verification
Drafting: Inject JSON into the found template using docxtemplater.

LLM Audit: Run a secondary Gemini check:

Prompt: "Compare the Original OCR text with this Generated JSON. Are there hallucinations or missing values?"

Output: Boolean isValid and a list of discrepancies.

Phase 3: Human-in-the-Loop (HITL)
Admin View: UI displays the original doc and the generated draft side-by-side.

Approval Logic: - If Rejected: Status -> UPLOADED (with feedback).

If Approved: Status -> APPROVED, convert to final .docx, increment versioning.

Phase 4: Intelligent Routing
Action: LLM reads the final approved document.

Routing Logic: Based on content (e.g., "Financial Statement" vs "Legal Contract"), determine the target department and trigger a webhook or email.

5. Implementation Requirements for Antigravity
API Routes: - /api/upload: Handles file upload and triggers extraction.

/api/approve: Admin endpoint to move docs to the next stage.

/api/templates: CRUD for the RAG template library.

Frontend Components:

UploadZone.tsx: Drag-and-drop with progress bar.

AdminDashboard.tsx: List of "Pending" documents.

ComparisonView.tsx: Side-by-side JSON/PDF editor.

How to use this with Antigravity:
Upload this .md file to your Antigravity project.

Use this Prompt:

"I have uploaded the IDP_SYSTEM_SPEC.md. Please initialize a Next.js project with Tailwind CSS and Shadcn UI. Implement the Mongoose schema and the multi-stage API logic for the Document Automation workflow. Focus on the Gemini 1.5 Pro integration for the 'Auditor' step and the HITL approval dashboard."
