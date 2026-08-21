const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface UploadResponse {
  success: boolean;
  filename: string;
  document_id: string;
  content_type: string;
  size_bytes: number;
  message: string;
}

export async function uploadDocument(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to upload document."
    );
  }

  return data;
}