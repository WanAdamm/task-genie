import { apiFetch } from "@/lib/api";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

export const MAX_ASSIGNMENT_REQUIREMENTS_CHARACTERS = 50_000;

const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const supportedExtensions = new Set(["pdf", "docx", "txt"]);

type ExtractionResponse = {
  text: string;
  characterCount: number;
  files: Array<{
    name: string;
    documentType: "PDF" | "DOCX" | "TXT";
    sizeBytes: number;
    characterCount: number;
    pageCount: number | null;
    warnings: string[];
  }>;
  warnings: string[];
};

type UploadState = {
  hasPendingFiles: boolean;
  isExtracting: boolean;
};

type AssignmentDocumentUploadProps = {
  currentText: string;
  disabled: boolean;
  editorId: string;
  onChange: (value: string) => void;
  onUploadStateChange: (state: UploadState) => void;
};

function characterCount(value: string) {
  return Array.from(value).length;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionFor(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function errorDetail(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object" || !("msg" in item)) return null;
        return typeof item.msg === "string" ? item.msg : null;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length) return messages.join(" ");
  }
  return null;
}

async function extractionResponse(response: Response) {
  const text = await response.text();
  let data: ExtractionResponse | { detail?: unknown } | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as ExtractionResponse | { detail?: unknown };
    } catch {
      if (response.ok) throw new Error("The server returned an invalid response.");
    }
  }
  if (!response.ok) {
    const detail = data && "detail" in data ? errorDetail(data.detail) : null;
    throw new Error(detail || "The documents could not be read. Try again.");
  }
  if (!data || !("text" in data)) {
    throw new Error("The server returned an empty response.");
  }
  return data;
}

export default function AssignmentDocumentUpload({
  currentText,
  disabled,
  editorId,
  onChange,
  onUploadStateChange,
}: AssignmentDocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [applyMode, setApplyMode] = useState<"append" | "replace">("append");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const reportError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const updateFiles = (files: File[]) => {
    setSelectedFiles(files);
    onUploadStateChange({ hasPendingFiles: files.length > 0, isExtracting: false });
  };

  const addFiles = (incoming: File[]) => {
    if (disabled || isExtracting || incoming.length === 0) return;
    const unsupported = incoming.find(
      (file) => !supportedExtensions.has(extensionFor(file)),
    );
    if (unsupported) {
      reportError(`${unsupported.name} is not supported. Use PDF, DOCX, or TXT.`);
      return;
    }
    const empty = incoming.find((file) => file.size === 0);
    if (empty) {
      reportError(`${empty.name} is empty.`);
      return;
    }
    const oversized = incoming.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      reportError(`${oversized.name} exceeds the 5 MB per-file limit.`);
      return;
    }
    const duplicate = incoming.find((file) =>
      selectedFiles.some(
        (selected) =>
          selected.name === file.name &&
          selected.size === file.size &&
          selected.lastModified === file.lastModified,
      ),
    );
    if (duplicate) {
      reportError(`${duplicate.name} is already selected.`);
      return;
    }
    const nextFiles = [...selectedFiles, ...incoming];
    if (nextFiles.length > MAX_FILES) {
      reportError("Select no more than five documents.");
      return;
    }
    if (nextFiles.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
      reportError("The selected files exceed the 15 MB combined limit.");
      return;
    }

    setError(null);
    setStatus(
      `${nextFiles.length} document${nextFiles.length === 1 ? "" : "s"} selected.`,
    );
    setWarnings([]);
    updateFiles(nextFiles);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    if (isExtracting) return;
    setError(null);
    const nextFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
    updateFiles(nextFiles);
    setStatus(
      nextFiles.length
        ? `${nextFiles.length} document${nextFiles.length === 1 ? "" : "s"} selected.`
        : "All selected documents removed.",
    );
  };

  const extract = async () => {
    if (!selectedFiles.length || disabled || isExtracting) return;
    const existingText = currentText.trimEnd();
    const shouldAppend = applyMode === "append" && Boolean(existingText);
    const separator = shouldAppend ? "\n\n" : "";
    const availableCharacters =
      MAX_ASSIGNMENT_REQUIREMENTS_CHARACTERS -
      (shouldAppend ? characterCount(existingText) + characterCount(separator) : 0);
    if (availableCharacters < 1) {
      reportError("Shorten the current brief or replace it with the extracted documents.");
      return;
    }

    setError(null);
    setStatus(
      `Extracting text from ${selectedFiles.length} document${selectedFiles.length === 1 ? "" : "s"}...`,
    );
    setWarnings([]);
    setIsExtracting(true);
    onUploadStateChange({ hasPendingFiles: true, isExtracting: true });
    let succeeded = false;
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("maxCharacters", String(availableCharacters));
      const response = await extractionResponse(
        await apiFetch("/api/assignment-plans/extract", {
          method: "POST",
          body: formData,
        }),
      );
      const nextText = `${shouldAppend ? existingText : ""}${separator}${response.text}`;
      if (characterCount(nextText) > MAX_ASSIGNMENT_REQUIREMENTS_CHARACTERS) {
        throw new Error("The extracted brief exceeds the 50,000-character limit.");
      }

      onChange(nextText);
      setSelectedFiles([]);
      setWarnings(response.warnings);
      setStatus(
        `Text extracted from ${response.files.length} document${response.files.length === 1 ? "" : "s"}. Review and edit it below.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      requestAnimationFrame(() => document.getElementById(editorId)?.focus());
      succeeded = true;
    } catch (caught) {
      setStatus(null);
      reportError(
        caught instanceof Error ? caught.message : "The documents could not be read.",
      );
    } finally {
      setIsExtracting(false);
      onUploadStateChange({
        hasPendingFiles: succeeded ? false : selectedFiles.length > 0,
        isExtracting: false,
      });
    }
  };

  const totalBytes = selectedFiles.reduce((total, file) => total + file.size, 0);

  return (
    <div className="mt-6">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleInput}
        disabled={disabled || isExtracting}
        tabIndex={-1}
        className="sr-only"
        aria-label="Choose assignment documents"
        aria-describedby="assignment-document-help"
      />
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isExtracting) setIsDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragActive(false);
          }
        }}
        onDrop={handleDrop}
        aria-busy={isExtracting}
        aria-describedby="assignment-document-help"
        className={`rounded-xl border border-dashed px-5 py-6 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-control-border bg-field/50"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-3xl text-primary"
        >
          upload_file
        </span>
        <p className="mt-2 text-sm font-bold">Drop assignment documents here</p>
        <p id="assignment-document-help" className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, or TXT. Up to 5 files, 5 MB each. Scanned PDFs need text recognition and are not supported yet.
        </p>
        <button
          type="button"
          disabled={disabled || isExtracting}
          onClick={() => inputRef.current?.click()}
          aria-describedby="assignment-document-help"
          className="mt-4 rounded-lg border border-control-border bg-card px-4 py-2 text-xs font-extrabold text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Browse files
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              {selectedFiles.length} selected
            </p>
            <p className="text-xs text-muted-foreground">{formatBytes(totalBytes)} total</p>
          </div>
          <ul className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-3 rounded-lg bg-surface-container-high px-3 py-2"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">
                  description
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{file.name}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="material-symbols-outlined rounded-md p-1 text-base text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-40"
                >
                  close
                </button>
              </li>
            ))}
          </ul>

          {currentText.trim() && (
            <fieldset className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
              <legend className="sr-only">How to apply extracted text</legend>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="radio"
                  name="document-apply-mode"
                  checked={applyMode === "append"}
                  onChange={() => setApplyMode("append")}
                  disabled={isExtracting}
                  className="accent-primary"
                />
                Add to current brief
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="radio"
                  name="document-apply-mode"
                  checked={applyMode === "replace"}
                  onChange={() => setApplyMode("replace")}
                  disabled={isExtracting}
                  className="accent-primary"
                />
                Replace current brief
              </label>
            </fieldset>
          )}

          <button
            type="button"
            disabled={disabled || isExtracting}
            onClick={() => void extract()}
            className="mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-xs font-extrabold text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExtracting
              ? "Reading documents..."
              : `Extract and review ${selectedFiles.length === 1 ? "document" : "documents"}`}
          </button>
        </div>
      )}

      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive outline-none"
        >
          {error}
        </p>
      )}
      {warnings.length > 0 && (
        <div role="status" aria-live="polite" className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}
      {status && (
        <p aria-live="polite" className="mt-3 text-xs font-semibold text-muted-foreground">
          {status}
        </p>
      )}
    </div>
  );
}
