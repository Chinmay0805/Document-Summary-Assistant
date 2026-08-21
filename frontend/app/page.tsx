"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import { UploadResponse } from "@/lib/api";

export default function Home() {
  const [uploadedDocument, setUploadedDocument] =
    useState<UploadResponse | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
            AI Document Intelligence
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Document Summary Assistant
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            Upload a document and turn its content into
            clear, structured insights.
          </p>
        </header>

        <section className="mx-auto w-full max-w-3xl">
          <UploadZone
            onUploadSuccess={setUploadedDocument}
          />

          {uploadedDocument && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-medium text-green-800">
                Upload successful
              </p>

              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p>
                  File: {uploadedDocument.filename}
                </p>

                <p>
                  Size:{" "}
                  {(
                    uploadedDocument.size_bytes /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}