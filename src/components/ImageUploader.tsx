import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import { Loader2, UploadCloud, Camera, X, ImageIcon, Link } from "lucide-react";

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  onCancel: () => void;
  initialImageUrl?: string;
  error?: string | null;
  conversionMode?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  onCancel,
  initialImageUrl = "",
  error = null,
  conversionMode = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(error);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || "");

  // Update internal error when prop changes
  useEffect(() => {
    setInternalError(error);
  }, [error]);

  // Pre-fill URL if provided
  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
      // If URL is provided, default to URL tab
      setUploadMethod("url");
    }
  }, [initialImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        setInternalError("Please select an image file");
        return;
      }

      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setInternalError("Image must be smaller than 5MB");
        return;
      }

      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.onerror = () => {
        setInternalError("Error reading file");
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Simplified and more direct URL handling
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setInternalError(null);
  };

  const handleUploadUrl = () => {
    if (!imageUrl.trim()) {
      setInternalError("Please enter an image URL");
      return;
    }

    setUploading(true);

    // We'll directly use the URL without validation to avoid CORS issues
    console.log("Using image URL directly:", imageUrl);

    // Add a slight delay to show loading state
    setTimeout(() => {
      onImageUpload(imageUrl);
      setUploading(false);
    }, 300);
  };

  const handleUpload = async () => {
    if (uploadMethod === "url") {
      handleUploadUrl();
      return;
    }

    if (!file) {
      setInternalError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setInternalError(null);

      // Create a unique file name
      const fileName = `${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const storageRef = ref(storage, `website-images/${fileName}`);

      console.log("Uploading file to Firebase:", fileName);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadUrl);

      // Pass URL back to parent component
      onImageUpload(downloadUrl);
    } catch (err) {
      console.error("Error uploading image:", err);
      setInternalError(
        "Failed to upload image. Please try again. " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setUploading(false);
    }
  };

  // Test direct URL (fetch it to check if it exists)
  const testImageUrl = (url: string) => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {conversionMode ? "Convert to Image" : "Update Image"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {internalError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {internalError}
          </div>
        )}

        {conversionMode && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            You're converting an element to an image. Please provide an image
            URL or upload a file.
          </div>
        )}

        {/* Simplified tab interface */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 border-b-2 ${
              uploadMethod === "file"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setUploadMethod("file")}
          >
            <div className="flex items-center">
              <Camera size={16} className="mr-2" />
              Upload File
            </div>
          </button>
          <button
            className={`py-2 px-4 border-b-2 ${
              uploadMethod === "url"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setUploadMethod("url")}
          >
            <div className="flex items-center">
              <Link size={16} className="mr-2" />
              Image URL
            </div>
          </button>
        </div>

        {uploadMethod === "file" ? (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {!preview ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-gray-600">
                        Click to select an image
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        or drag and drop
                      </span>
                    </div>
                  ) : (
                    <div>
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 max-w-full mx-auto"
                      />
                      <div className="text-sm text-blue-600 mt-2">
                        Click to change
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:bg-blue-300"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload to Firebase
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Image URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {imageUrl && imageUrl.startsWith("http") && (
                <div className="mt-4 border rounded-lg overflow-hidden p-2">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img
                    src={imageUrl}
                    alt="URL preview"
                    className="max-h-48 max-w-full mx-auto"
                    onError={(e) => {
                      // Hide the broken image icon but don't show error
                      (e.target as HTMLImageElement).style.display = "none";
                      // Only show error if user tries to use this URL
                    }}
                    onLoad={(e) => {
                      // Show image when it loads successfully
                      (e.target as HTMLImageElement).style.display = "block";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadUrl}
                disabled={!imageUrl.trim() || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:bg-blue-300"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Use This URL
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
