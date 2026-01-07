import React, { useState, useRef, useEffect } from "react";

interface ImageCropModalProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageFile,
  onCropComplete,
  onCancel,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [cropping, setCropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const handleCrop = async () => {
    if (!imgRef.current || !canvasRef.current) return;

    setCropping(true);

    try {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      const size = Math.min(img.naturalWidth, img.naturalHeight);
      canvas.width = size;
      canvas.height = size;

      const offsetX = (img.naturalWidth - size) / 2;
      const offsetY = (img.naturalHeight - size) / 2;

      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], imageFile.name, {
              type: imageFile.type,
              lastModified: Date.now(),
            });
            onCropComplete(croppedFile);
          }
          setCropping(false);
        },
        imageFile.type,
        0.95
      );
    } catch (error) {
      console.error("Error cropping image:", error);
      setCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full">
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Crop Photo</h2>
          <button
            onClick={onCancel}
            className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh]">
            {imageSrc && (
              <div className="relative">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Preview"
                  className="max-w-full max-h-[55vh] object-contain"
                  style={{
                    clipPath: `inset(${
                      imgRef.current
                        ? Math.max(
                            0,
                            ((imgRef.current.naturalHeight -
                              Math.min(
                                imgRef.current.naturalWidth,
                                imgRef.current.naturalHeight
                              )) /
                              2 /
                              imgRef.current.naturalHeight) *
                              100
                          )
                        : 0
                    }% ${
                      imgRef.current
                        ? Math.max(
                            0,
                            ((imgRef.current.naturalWidth -
                              Math.min(
                                imgRef.current.naturalWidth,
                                imgRef.current.naturalHeight
                              )) /
                              2 /
                              imgRef.current.naturalWidth) *
                              100
                          )
                        : 0
                    }%)`,
                  }}
                />
                <div className="absolute inset-0 border-4 border-dashed border-green-500 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300">
            <p>
              ✓ Image will be cropped to a square (1:1 ratio) perfect for avatars
            </p>
            <p className="mt-1 text-slate-400">
              The crop area is centered automatically
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={cropping}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={cropping}
              className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {cropping ? "Cropping..." : "Crop & Continue"}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
