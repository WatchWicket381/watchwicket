import React, { useRef, useState } from "react";
import { supabase } from "../supabaseClient";

interface Props {
  team: "A" | "B";
  teamName: string;
  logoUrl: string | null | undefined;
  onLogoChange: (url: string | null) => void;
  disabled?: boolean;
}

export const TeamLogoUpload: React.FC<Props> = ({
  team,
  teamName,
  logoUrl,
  onLogoChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG, JPEG, and WebP images are supported");
      return;
    }

    try {
      setUploading(true);

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image"));
        };
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;

      const targetSize = 512;
      canvas.width = targetSize;
      canvas.height = targetSize;

      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        size,
        size,
        0,
        0,
        targetSize,
        targetSize
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          "image/webp",
          0.9
        );
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const fileName = `${user.id}/${Date.now()}_team${team}.webp`;

      const { data, error: uploadError } = await supabase.storage
        .from("team-logos")
        .upload(fileName, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("team-logos")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log("Logo uploaded successfully:", publicUrl);

      onLogoChange(publicUrl);
    } catch (err) {
      console.error("Logo upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setError(null);
    onLogoChange(null);
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={handleClick}
        className={`relative w-20 h-20 rounded-full border-2 ${
          logoUrl ? "border-green-500" : "border-slate-600"
        } bg-slate-800 flex items-center justify-center overflow-hidden ${
          disabled || uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-green-400"
        } transition-colors`}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt={`Team ${team} Logo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-3xl font-bold text-slate-500">{team}</div>
        )}

        {!disabled && !uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs text-white font-semibold">
              {logoUrl ? "Change" : "Upload"}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {error && (
        <div className="mt-2 text-xs text-red-400 text-center max-w-[200px]">
          {error}
        </div>
      )}

      {logoUrl && !disabled && !uploading && (
        <button
          onClick={handleRemoveLogo}
          className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove Logo
        </button>
      )}

      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-white">
          {teamName || `Team ${team}`}
        </p>
      </div>
    </div>
  );
};
