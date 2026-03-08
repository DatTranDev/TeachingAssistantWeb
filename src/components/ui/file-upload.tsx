'use client';

import React, { useCallback, useRef, useState } from 'react';
import { UploadCloudIcon, XIcon, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onChange: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept = 'image/*',
  multiple = false,
  maxSizeMB = 5,
  onChange,
  className,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const arr = Array.from(incoming);
      const oversized = arr.filter((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversized.length > 0) {
        setError(`Files must be under ${maxSizeMB}MB`);
        return;
      }
      setError(null);
      const next = multiple ? [...files, ...arr] : arr;
      setFiles(next);
      onChange(next);
    },
    [files, multiple, maxSizeMB, onChange]
  );

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onChange(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors',
          dragOver && 'border-primary bg-primary-light',
          !disabled && 'cursor-pointer hover:border-primary hover:bg-primary-light',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloudIcon className="size-8 text-muted" />
        <div>
          <p className="text-sm font-medium text-neutral-700">
            Drag & drop or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted">Max {maxSizeMB}MB per file</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {error && <p className="text-xs text-danger">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-muted hover:text-danger"
                aria-label={`Remove ${file.name}`}
              >
                <XIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
