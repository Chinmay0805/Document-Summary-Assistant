const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UploadResponse {
  success: boolean;
  filename: string;
  document_id: string;
  content_type: string;
  size_bytes: number;
  message: string;
}

export interface Extraction {
  text: string;
  method: string;
  pages: number;
  characters: number;
  words: number;
}

export interface ExtractionResponse {
  success: boolean;
  document_id: string;
  extraction: Extraction;
}

export type SummaryLength = "short" | "medium" | "long";

export interface SummaryRequest {
  length: SummaryLength;
}

export interface SummaryResponse {
  success: boolean;
  document_id: string;
  summary: string;
  length: SummaryLength;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "An unexpected server error occurred.";

    throw new Error(message);
  }

  return data as T;
}

export async function uploadDocument(
  file: File,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  return parseResponse<UploadResponse>(response);
}

export async function extractDocument(
  documentId: string,
): Promise<ExtractionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/extract`,
    {
      method: "POST",
    },
  );

  return parseResponse<ExtractionResponse>(response);
}

export async function summarizeDocument(
  documentId: string,
  length: SummaryLength,
): Promise<SummaryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/summarize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ length }),
    },
  );

  return parseResponse<SummaryResponse>(response);
}