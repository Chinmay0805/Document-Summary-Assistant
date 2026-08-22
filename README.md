# Document Summary Assistant

A full-stack AI-powered document processing application that allows users to
upload PDF and image documents, extract their content, and generate concise,
structured summaries.

The project was developed as a Software Engineering technical assessment
focused on practical problem solving, backend API design, document processing,
AI integration, validation, testing, and responsive UI development.

---

## Live Demo

**Frontend:**  
[Frontend Link](https://document-summary-assistant-pi.vercel.app/)

**Backend API:**  
[hBackend Link](https://document-summary-assistant-7zm8.onrender.com)

---

## Features

### Document Upload

Supports:

- PDF
- PNG
- JPG
- JPEG

Users can upload documents through the web interface. Max Size : 10MB

The backend validates:

- File extension
- MIME type
- File content/signature
- Empty files
- Maximum file size

Invalid files are rejected before document processing.

### Text Extraction

#### PDF

PDF documents are processed using PDF text extraction.

The extraction pipeline retrieves text while preserving the document's
logical content and performs text normalization before summarization.

#### Images

Image documents are processed using OCR to extract textual content from
scanned documents.

### AI Summarization

The application generates structured summaries using Google Gemini.

Users can select:

- Short
- Medium
- Long

Each generated summary contains:

```json
{
  "overview": "Overall description of the document",
  "key_points": [
    "Important factual point",
    "Another important point"
  ],
  "main_ideas": [
    "Central concept",
    "Important conclusion"
  ]
}
```
####*The Summary response may take time*
