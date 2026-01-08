import React, { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { ImageCropModal } from "./ImageCropModal";
import { compressImage } from "../utils/imageProcessing";

interface PlayerPhotoUploadProps {
  currentPhotoUrl?: string;
  playerId?: string;
  playerName: string;
  onPhotoUploaded: (photoUrl: string) => void;
  onPhotoRemoved: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const PlayerPhotoUpload: React.FC<PlayerPhotoUploadProps> = ({
  currentPhotoUrl,
  playerId,
  playerName,
  onPhotoUploaded,
  onPhotoRemoved,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function getPlayerInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function handleFileSelect(file: File) {
    setError(null);
    setShowMenu(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, or WEBP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setShowCropModal(true);
  }

  async function handleCropComplete(croppedFile: File) {
    setShowCropModal(false);
    setSelectedFile(null);
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to upload photos");
        setUploading(false);
        return;
      }

      const compressedBlob = await compressImage(croppedFile, 300, 0.85);
      const compressedFile = new File([compressedBlob], croppedFile.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const timestamp = Date.now();
      const fileName = `${timestamp}.jpg`;
      const filePath = playerId
        ? `${user.id}/${playerId}/${fileName}`
        : `${user.id}/temp/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("player-photos").getPublicUrl(filePath);

      onPhotoUploaded(publicUrl);
      setUploading(false);
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("An unexpected error occurred while uploading");
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setShowCropModal(false);
    setSelectedFile(null);
  }

  async function handleRemovePhoto() {
    if (!currentPhotoUrl) return;

    const confirmed = confirm("Are you sure you want to remove this photo?");
    if (!confirmed) return;

    try {
      const url = new URL(currentPhotoUrl);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf("player-photos") + 1).join("/");

      if (filePath) {
        await supabase.storage.from("player-photos").remove([filePath]);
      }

      onPhotoRemoved();
    } catch (err) {
      console.error("Error removing photo:", err);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold mb-2">Profile Photo</label>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden border-4 border-slate-700">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              getPlayerInitials(playerName)
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="spinner-sm border-white"></div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {!uploading && (
            <>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {currentPhotoUrl ? "Change Photo" : "Add Photo"}
              </button>

              {showMenu && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-4 py-2 rounded hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <span>📁</span>
                    <span>Upload from Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full text-left px-4 py-2 rounded hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <span>📷</span>
                    <span>Take Photo</span>
                  </button>
                </div>
              )}

              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Remove Photo
                </button>
              )}
            </>
          )}

          {uploading && (
            <div className="text-sm text-slate-400 animate-pulse">Uploading photo...</div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded border border-red-800">
              {error}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      <p className="text-xs text-slate-400">
        Photos are automatically cropped to square and compressed for optimal quality
      </p>

      {showCropModal && selectedFile && (
        <ImageCropModal
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};
