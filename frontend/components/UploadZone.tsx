"use client";

import { DragEvent, useRef, useState } from "react";
import { uploadDocument, UploadResponse } from "@/lib/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

interface UploadZoneProps {
  onUploadSuccess: (result: UploadResponse) => void;
}

export default function UploadZone({
  onUploadSuccess,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PDF, PNG, JPG, or JPEG file.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10 MB.";
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError("");

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDocument(file);
      onUploadSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await handleFile(file);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      await handleFile(file);
    }

    event.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            inputRef.current?.click();
          }
        }}
        className={`
          flex min-h-[280px] cursor-pointer flex-col
          items-center justify-center rounded-2xl border-2
          border-dashed p-8 text-center transition
          ${
            isDragging
              ? "border-black bg-gray-100"
              : "border-gray-300 bg-white hover:border-gray-500"
          }
          ${isUploading ? "cursor-wait opacity-70" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <>
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

            <h3 className="text-lg font-semibold">
              Uploading document...
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while we process your file.
            </p>
          </>
        ) : (
          <>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
              ↑
            </div>

            <h3 className="text-lg font-semibold">
              Drop your document here
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              or click to browse files
            </p>

            <p className="mt-4 text-xs text-gray-400">
              PDF, PNG, JPG, JPEG · Maximum 10 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}