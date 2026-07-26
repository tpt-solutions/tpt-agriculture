import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDb } from "@tpt/core";
import { photos } from "@tpt/core/schema";
import { eq, and } from "drizzle-orm";
import { toast } from "sonner";
import { Button } from "@tpt/ui";

interface Props {
  farmId: string;
  moduleId: string;
  recordId: string;
}

export function PhotoAttachments({ farmId, moduleId, recordId }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["photos", moduleId, recordId],
    queryFn: async () => {
      const db = await getDb();
      return db
        .select({ id: photos.id, fileName: photos.fileName, mimeType: photos.mimeType, data: photos.data, createdAt: photos.createdAt })
        .from(photos)
        .where(and(eq(photos.farmId, farmId), eq(photos.moduleId, moduleId), eq(photos.recordId, recordId)))
        .orderBy(photos.createdAt) as unknown as { id: string; fileName: string; mimeType: string; data: string; createdAt: Date }[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const db = await getDb();
      await db.delete(photos).where(eq(photos.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", moduleId, recordId] });
      toast.success("Photo deleted");
    },
    onError: () => toast.error("Failed to delete photo"),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const db = await getDb();
      await db.insert(photos).values({
        farmId,
        moduleId,
        recordId,
        fileName: file.name,
        mimeType: file.type,
        data,
      });
      queryClient.invalidateQueries({ queryKey: ["photos", moduleId, recordId] });
      toast.success("Photo uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">Photos ({items.length})</span>
        <span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <Button size="sm" variant="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading..." : "+ Add Photo"}
          </Button>
        </span>
      </div>
      {isLoading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-xs text-gray-400">No photos yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((photo) => (
            <div key={photo.id} className="group relative">
              <img
                src={photo.data}
                alt={photo.fileName}
                className="h-20 w-20 rounded border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={() => { if (confirm("Delete this photo?")) deleteMutation.mutate(photo.id); }}
                className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white group-hover:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
