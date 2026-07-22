// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@tpt/ui";
import { toast } from "sonner";
import { listAttachments, createAttachment, deleteAttachment } from "../attachments/attachments-service.js";
import { processAttachmentFile } from "../utils/image-resize.js";

/** Generic photo/media attachment picker + gallery, embeddable against any record
 * in any module without each module needing its own attachment UI (see Phase 17). */
export function AttachmentsPanel({
  farmId,
  recordTable,
  recordId,
  onClose,
}: {
  farmId: string;
  recordTable: string;
  recordId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const queryKey = ["attachments", recordTable, recordId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listAttachments(farmId, recordTable, recordId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttachment(farmId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["attachment-counts"] });
      toast.success("Attachment deleted");
    },
  });

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const processed = await processAttachmentFile(file);
      await createAttachment(farmId, recordTable, recordId, processed);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["attachment-counts"] });
      toast.success("Attachment uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-green-700"
          />
          {uploading && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No attachments yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const url = `data:${item.mimeType};base64,${item.dataBase64}`;
              const isImage = item.mimeType.startsWith("image/");
              return (
                <div key={item.id} className="group relative rounded-md border border-gray-200 p-2">
                  <a href={url} download={item.fileName} target="_blank" rel="noreferrer">
                    {isImage ? (
                      <img src={url} alt={item.fileName} className="h-24 w-full rounded object-cover" />
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center rounded bg-gray-50 text-3xl">📄</div>
                    )}
                  </a>
                  <p className="mt-1 truncate text-xs text-gray-600" title={item.fileName}>{item.fileName}</p>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="absolute right-1 top-1 hidden rounded bg-white/90 px-1.5 py-0.5 text-xs text-red-600 shadow group-hover:block"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
