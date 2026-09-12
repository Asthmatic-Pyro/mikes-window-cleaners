import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { cropToJpeg } from "@/lib/follow/cropImage";

type Aspect = "16:9" | "4:3";

type ImageCropModalProps = {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export default function ImageCropModal({ file, onCancel, onConfirm }: ImageCropModalProps) {
  const src = URL.createObjectURL(file);
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [pixels, setPixels] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, cropped: Area) => {
    setPixels(cropped);
  }, []);

  const makePreview = async () => {
    if (!pixels) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropToJpeg(src, pixels);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!pixels) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropToJpeg(src, pixels);
      const next = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      URL.revokeObjectURL(src);
      if (preview) URL.revokeObjectURL(preview);
      onConfirm(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 bg-foreground/60 backdrop-blur-[6px]" aria-label="Cancel crop" onClick={onCancel} />
      <div className="relative z-10 flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/70 bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-display text-xl font-bold">Crop photo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Drag the window to pick which part of the photo is shown.</p>
        </div>
        <div className="relative h-[46vh] min-h-[240px] bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect === "16:9" ? 16 / 9 : 4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {(["16:9", "4:3"] as const).map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${aspect === id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                onClick={() => setAspect(id)}
              >
                {id}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          {preview && (
            <img src={preview} alt="Crop preview" className="max-h-36 w-full rounded-md object-cover" />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => void makePreview()} disabled={busy}>
              Preview
            </button>
            <button type="button" className="btn-primary text-sm" onClick={() => void confirm()} disabled={busy}>
              Use this crop
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
