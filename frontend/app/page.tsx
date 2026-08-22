"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

type SummaryLength = "short" | "medium" | "long";

type UploadResponse = {
  success: boolean;
  filename: string;
  document_id: string;
  content_type: string;
  size_bytes: number;
  message: string;
};

type ExtractionData = {
  text: string;
  method: string;
  pages: number;
  characters: number;
  words: number;
};

type ExtractionResponse = {
  success: boolean;
  document_id: string;
  extraction: ExtractionData;
};

type SummaryContent = {
  overview: string;
  key_points: string[];
  main_ideas: string[];
};

type SummaryResponse = {
  success: boolean;
  document_id: string;
  summary: SummaryContent;
  length: SummaryLength;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const MAX_FILE_SIZE_MB = 10;

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeLabel(contentType: string): string {
  switch (contentType) {
    case "application/pdf":
      return "PDF";
    case "image/png":
      return "PNG";
    case "image/jpeg":
      return "JPG";
    default:
      return "Document";
  }
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const [upload, setUpload] =
    useState<UploadResponse | null>(null);

  const [extraction, setExtraction] =
    useState<ExtractionData | null>(null);

  const [summary, setSummary] =
    useState<SummaryContent | null>(null);

  const [summaryLength, setSummaryLength] =
    useState<SummaryLength>("short");

  const [isDragging, setIsDragging] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [isSummarizing, setIsSummarizing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const resetDocument = () => {
    setFile(null);
    setUpload(null);
    setExtraction(null);
    setSummary(null);
    setError(null);
    setSuccessMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateFile = (selectedFile: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      return "Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG.";
    }

    const maxBytes =
      MAX_FILE_SIZE_MB * 1024 * 1024;

    if (selectedFile.size > maxBytes) {
      return `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
    }

    if (selectedFile.size === 0) {
      return "The selected file is empty.";
    }

    return null;
  };

  const handleFileSelected = async (
    selectedFile: File
  ) => {
    setError(null);
    setSuccessMessage(null);
    setSummary(null);
    setExtraction(null);
    setUpload(null);

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    await uploadDocument(selectedFile);
  };

  const handleInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    await handleFileSelected(selectedFile);
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (!droppedFile) {
      return;
    }

    await handleFileSelected(droppedFile);
  };

  const uploadDocument = async (
    selectedFile: File
  ) => {
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

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
          data.detail ||
            "Failed to upload the document."
        );
      }

      const uploadData =
        data as UploadResponse;

      setUpload(uploadData);

      setSuccessMessage(
        "Document uploaded successfully."
      );

      await extractDocument(
        uploadData.document_id
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload the document.";

      setError(message);
      setUpload(null);
    } finally {
      setIsUploading(false);
    }
  };

  const extractDocument = async (
    documentId: string
  ) => {
    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${documentId}/extract`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to extract document text."
        );
      }

      const extractionResponse =
        data as ExtractionResponse;

      setExtraction(
        extractionResponse.extraction
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to extract document text.";

      setError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const generateSummary = async () => {
    if (!upload?.document_id) {
      setError(
        "Please upload a document first."
      );
      return;
    }

    if (!extraction?.text?.trim()) {
      setError(
        "There is no extracted text to summarize."
      );
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${upload.document_id}/summarize`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            length: summaryLength,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to generate summary."
        );
      }

      const summaryResponse =
        data as SummaryResponse;

      /*
       * IMPORTANT:
       *
       * The backend returns:
       *
       * {
       *   summary: {
       *     overview: "...",
       *     key_points: [...],
       *     main_ideas: [...]
       *   }
       * }
       *
       * Therefore we store data.summary,
       * not the entire response object.
       */
      setSummary(summaryResponse.summary);

      setSuccessMessage(
        "Summary generated successfully."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate summary.";

      setError(message);
      setSummary(null);
    } finally {
      setIsSummarizing(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const hasDocument =
    Boolean(file && upload);

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#18181b]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Document Summary Assistant
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-zinc-500 sm:text-base">
                Upload a PDF or image, extract its
                contents, and generate an AI-powered
                summary.
              </p>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <div className="flex items-start justify-between gap-4">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError(null)}
                className="font-medium text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {successMessage && !error && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* Upload */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Upload document
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Supported formats: PDF, PNG, JPG,
              JPEG. Maximum size:{" "}
              {MAX_FILE_SIZE_MB} MB.
            </p>
          </div>

          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
              isDragging
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-300 bg-zinc-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
                ↑
              </div>

              <h3 className="text-base font-semibold">
                {isDragging
                  ? "Drop your document here"
                  : "Drag and drop your document"}
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                or select a file from your
                computer
              </p>

              <button
                type="button"
                onClick={openFilePicker}
                disabled={
                  isUploading ||
                  isExtracting
                }
                className="mt-5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading
                  ? "Uploading..."
                  : "Choose file"}
              </button>
            </div>
          </div>

          {/* Selected file */}
          {file && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {formatFileSize(
                      file.size
                    )}
                    {" · "}
                    {getFileTypeLabel(
                      file.type
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetDocument}
                  disabled={
                    isUploading ||
                    isExtracting ||
                    isSummarizing
                  }
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Processing state */}
        {(isUploading || isExtracting) && (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

              <div>
                <p className="text-sm font-medium">
                  {isUploading
                    ? "Uploading document..."
                    : "Extracting document text..."}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Please wait.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Document information */}
        {hasDocument &&
          extraction &&
          !isExtracting && (
            <>
              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Document information
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Information extracted from
                    your document.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard
                    label="Pages"
                    value={extraction.pages}
                  />

                  <StatCard
                    label="Words"
                    value={extraction.words}
                  />

                  <StatCard
                    label="Characters"
                    value={extraction.characters}
                  />

                  <StatCard
                    label="Method"
                    value={
                      extraction.method ===
                      "pdf_text"
                        ? "PDF Text"
                        : extraction.method
                    }
                  />
                </div>
              </section>

              {/* Extracted text */}
              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Extracted text
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Content extracted from your
                    document.
                  </p>
                </div>

                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-700">
                    {extraction.text}
                  </pre>
                </div>
              </section>

              {/* Summary controls */}
              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Generate summary
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Choose how detailed you want
                    the summary to be.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <SummaryLengthButton
                    value="short"
                    selected={
                      summaryLength === "short"
                    }
                    onClick={() =>
                      setSummaryLength(
                        "short"
                      )
                    }
                  />

                  <SummaryLengthButton
                    value="medium"
                    selected={
                      summaryLength ===
                      "medium"
                    }
                    onClick={() =>
                      setSummaryLength(
                        "medium"
                      )
                    }
                  />

                  <SummaryLengthButton
                    value="long"
                    selected={
                      summaryLength === "long"
                    }
                    onClick={() =>
                      setSummaryLength(
                        "long"
                      )
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={generateSummary}
                  disabled={
                    isSummarizing ||
                    !extraction.text.trim()
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSummarizing && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                  )}

                  {isSummarizing
                    ? "Generating summary..."
                    : "Generate summary"}
                </button>
              </section>
            </>
          )}

        {/* Summary */}
        {summary && (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Generated summary
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    AI-generated summary based
                    only on the extracted document
                    content.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700">
                  {summaryLength} summary
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-semibold text-zinc-900">
                Overview
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-700">
                {summary.overview}
              </p>
            </div>

            {/* Key points */}
            {summary.key_points?.length > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Key points
                </h3>

                <ul className="mt-4 space-y-3">
                  {summary.key_points.map(
                    (point, index) => (
                      <li
                        key={`key-point-${index}`}
                        className="flex gap-3 text-sm leading-6 text-zinc-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />

                        <span>{point}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Main ideas */}
            {summary.main_ideas?.length > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Main ideas
                </h3>

                <ul className="mt-4 space-y-3">
                  {summary.main_ideas.map(
                    (idea, index) => (
                      <li
                        key={`main-idea-${index}`}
                        className="flex gap-3 text-sm leading-6 text-zinc-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />

                        <span>{idea}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-zinc-400">
          Document Summary Assistant
        </footer>
      </div>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
};

function StatCard({
  label,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-2 truncate text-base font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}

type SummaryLengthButtonProps = {
  value: SummaryLength;
  selected: boolean;
  onClick: () => void;
};

function SummaryLengthButton({
  value,
  selected,
  onClick,
}: SummaryLengthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
        selected
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {value}
    </button>
  );
}