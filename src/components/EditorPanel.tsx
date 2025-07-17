import { useState, useEffect, useRef } from "react";
import { Edit2, Save, Undo, CheckCircle } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

interface EditorPanelProps {
  isPreviewMode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onSave: (content: string) => void;
  onToggleEditMode: () => void;
}

// Check if we can safely access the iframe content
const canAccessIframe = (iframe: HTMLIFrameElement): boolean => {
  try {
    // This will throw an error if cross-origin
    return !!iframe.contentWindow && !!iframe.contentDocument;
  } catch (e) {
    return false;
  }
};

export const EditorPanel: React.FC<EditorPanelProps> = ({
  isPreviewMode,
  iframeRef,
  onSave,
  onToggleEditMode,
}) => {
  const [editingElement, setEditingElement] = useState<HTMLElement | null>(
    null
  );
  const [savedMessage, setSavedMessage] = useState(false);
  // Track if we're working in a cross-origin context
  const [crossOriginMode, setCrossOriginMode] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedImageElement, setSelectedImageElement] =
    useState<HTMLImageElement | null>(null);

  // Store editor state in a ref when cross-origin issues arise
  const editorStateRef = useRef<{
    html: string | null;
    editableElements: string[];
  }>({
    html: null,
    editableElements: [],
  });

  useEffect(() => {
    if (!isPreviewMode || !iframeRef.current) return;

    const iframe = iframeRef.current;

    // Check if we can access the iframe directly
    if (!canAccessIframe(iframe)) {
      console.error(
        "Cross-origin iframe detected - direct DOM access not possible"
      );
      setCrossOriginMode(true);

      // Alert the user with a more specific message and instructions
      alert(
        "Cross-origin restrictions detected. To enable editing, you need to:\n\n" +
          "1. Ensure the iframe content is served from the same origin as your app\n" +
          "2. Or add appropriate CORS headers to the server hosting the iframe content\n" +
          '3. Or use the sandbox attribute on your iframe: sandbox="allow-same-origin allow-scripts"'
      );

      return;
    }

    // If we can access the iframe, continue with normal editing functionality
    setCrossOriginMode(false);

    try {
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        console.error("Cannot access iframe document");
        return;
      }

      // Save the current HTML for backup
      editorStateRef.current.html = iframeDoc.documentElement.outerHTML;

      // Add sandbox attribute to iframe to allow same-origin access
      try {
        // Try to access the iframe document safely
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) {
          console.error("Cannot access iframe document");
          return;
        }

        // Set up cross-origin safe event listeners and continue with normal flow
        const handleTextElementClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          // Remove previous editing styles
          if (editingElement) {
            editingElement.contentEditable = "false";
            editingElement.classList.remove(
              "outline-2",
              "outline-blue-500",
              "outline",
              "outline-solid"
            );
          }

          // Set new editing element
          const target = e.currentTarget as HTMLElement;
          target.contentEditable = "true";
          target.classList.add(
            "outline-2",
            "outline-blue-500",
            "outline",
            "outline-solid"
          );
          target.focus();
          setEditingElement(target);
        };

        const handleImageElementClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          const imgElement = e.currentTarget as HTMLImageElement;

          // Store reference to the clicked image element
          setSelectedImageElement(imgElement);

          // Show the Firebase image uploader
          setShowImageUploader(true);
        };

        const handleDocumentClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (
            editingElement &&
            !target.hasAttribute("data-editable") &&
            !editingElement.contains(target)
          ) {
            editingElement.contentEditable = "false";
            editingElement.classList.remove(
              "outline-2",
              "outline-blue-500",
              "outline",
              "outline-solid"
            );
            setEditingElement(null);
          }
        };

        // Set up event listeners for editable elements
        const editableTextElements = iframeDoc.querySelectorAll(
          '[data-editable="true"]'
        );
        const editableImageElements = iframeDoc.querySelectorAll(
          '[data-editable="image"]'
        );

        // Text editing
        editableTextElements.forEach((el) => {
          el.classList.add(
            "hover:outline",
            "hover:outline-2",
            "hover:outline-blue-500",
            "hover:outline-dashed"
          );

          el.addEventListener("click", handleTextElementClick);
        });

        // Image editing
        editableImageElements.forEach((el) => {
          const imgElement = el as HTMLImageElement;

          // Add edit indicator
          imgElement.classList.add("hover:opacity-80", "cursor-pointer");
          const overlayDiv = iframeDoc.createElement("div");
          overlayDiv.className =
            "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity";
          overlayDiv.innerHTML =
            '<span class="text-white text-sm font-bold">Click to change image</span>';

          // Position the parent relatively if it's not already
          const parent = imgElement.parentElement;
          if (parent && getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
          }

          if (parent) {
            parent.appendChild(overlayDiv);
          }

          // Add click handler
          imgElement.addEventListener("click", handleImageElementClick);
        });

        // If not enough elements are marked as editable, let's manually make all images and text editable
        if (
          editableTextElements.length === 0 &&
          editableImageElements.length === 0
        ) {
          console.log(
            "No elements explicitly marked as editable. Making all text and images editable..."
          );

          // Make all text elements editable
          const allTextElements = iframeDoc.querySelectorAll(
            "p, h1, h2, h3, h4, h5, h6, span, div > text, li, a"
          );
          allTextElements.forEach((el) => {
            // Skip elements with no content or that are part of a script/style
            if (!el.textContent?.trim() || el.closest("script, style")) return;

            el.setAttribute("data-editable", "true");
            el.classList.add(
              "hover:outline",
              "hover:outline-2",
              "hover:outline-blue-500",
              "hover:outline-dashed"
            );
            el.addEventListener("click", handleTextElementClick);
          });

          // Make all images editable
          const allImageElements = iframeDoc.querySelectorAll("img");
          allImageElements.forEach((el) => {
            const imgElement = el as HTMLImageElement;

            if (!imgElement.src) return;

            imgElement.setAttribute("data-editable", "image");
            imgElement.classList.add("hover:opacity-80", "cursor-pointer");
            imgElement.addEventListener("click", handleImageElementClick);
          });
        }

        // Cancel editing when clicking outside editable elements
        iframeDoc.addEventListener("click", handleDocumentClick);

        return () => {
          // Proper cleanup of event listeners
          editableTextElements.forEach((el) => {
            el.removeEventListener("click", handleTextElementClick);
          });
          editableImageElements.forEach((el) => {
            el.removeEventListener("click", handleImageElementClick);
          });
          iframeDoc.removeEventListener("click", handleDocumentClick);
        };
      } catch (error) {
        // Handle cross-origin security error
        console.error("Cross-origin security restriction detected:", error);

        // Alternative approach using iframe sandbox or postMessage could be implemented here
        alert(
          "Cannot edit content due to cross-origin restrictions. Make sure your iframe content is from the same origin as your application."
        );
      }
    } catch (error) {
      console.error("Error setting up editor:", error);
      setCrossOriginMode(true);
    }
  }, [isPreviewMode, iframeRef]);

  // Handle Firebase image upload completion
  const handleImageUpload = (imageUrl: string) => {
    if (!selectedImageElement) return;

    // Update the image with the Firebase URL
    selectedImageElement.src = imageUrl;

    // Reset state
    setSelectedImageElement(null);
    setShowImageUploader(false);

    // Auto-save after upload
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const iframeDoc = iframeRef.current.contentDocument;
      const htmlContent = iframeDoc.documentElement.outerHTML;
      onSave(htmlContent);

      // Show saved message
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    }
  };

  const handleSave = () => {
    if (!iframeRef.current) return;

    if (crossOriginMode) {
      alert(
        "Cannot save changes due to cross-origin restrictions.\n\n" +
          "To resolve this issue:\n" +
          "1. Make sure your iframe src URL has the same origin (protocol, domain, port) as your application\n" +
          "2. If using local files, serve them through your development server instead\n" +
          "3. If the content comes from another domain, set up proper CORS headers on that server"
      );
      return;
    }

    try {
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error("Cannot access iframe document for saving");
      }

      // Get the updated HTML content
      const htmlContent = iframeDoc.documentElement.outerHTML;
      onSave(htmlContent);

      // Show saved message
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Cannot save changes. Please check console for details.");
    }
  };

  if (!isPreviewMode) return null;

  return (
    <>
      <div className="bg-gray-800 text-white p-3 rounded-t-lg fixed bottom-0 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4">
        <div className="flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-lg">
          <Edit2 className="w-4 h-4 mr-2" />
          <span>Edit Mode</span>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>

        <button
          onClick={onToggleEditMode}
          className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <Undo className="w-4 h-4 mr-2" />
          Exit Edit Mode
        </button>

        {savedMessage && (
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            Changes Saved!
          </div>
        )}
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <ImageUploader
          onImageUpload={handleImageUpload}
          onCancel={() => {
            setShowImageUploader(false);
            setSelectedImageElement(null);
          }}
        />
      )}
    </>
  );
};
