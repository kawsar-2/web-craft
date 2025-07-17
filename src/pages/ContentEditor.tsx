import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Eye,
  Layout,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Plus,
  ChevronDown,
  Move,
} from "lucide-react";
import { ImageUploader } from "../components/ImageUploader";

export const ContentEditor = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showElementTools, setShowElementTools] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLIFrameElement>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [scriptElements, setScriptElements] = useState<HTMLScriptElement[]>([]);
  const [jsInteractivity, setJsInteractivity] = useState<{
    [key: string]: boolean;
  }>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [invalidImageEdit, setInvalidImageEdit] = useState(false);
  const [isElementConversion, setIsElementConversion] = useState(false);
  const [elementToReplace, setElementToReplace] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    // Load content from localStorage
    const savedContent = localStorage.getItem("webcraft-editor-content");
    if (!savedContent) {
      // If no content is found, redirect back to generator
      alert("No content found to edit. Please generate a website first.");
      navigate("/");
      return;
    }

    setContent(savedContent);
    setOriginalContent(savedContent);
  }, [navigate]);

  useEffect(() => {
    if (content && editorRef.current) {
      // Set the content in the iframe
      const iframe = editorRef.current;
      iframe.onload = () => {
        initializeEditor(iframe);
        detectJavaScriptFunctionality(iframe);
      };

      // If already loaded
      if (iframe.contentDocument?.readyState === "complete") {
        initializeEditor(iframe);
        detectJavaScriptFunctionality(iframe);
      }
    }
  }, [content]);

  const detectJavaScriptFunctionality = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument || !iframe.contentWindow) return;

    const doc = iframe.contentDocument;

    // Find all script elements
    const scripts = Array.from(doc.querySelectorAll("script"));
    setScriptElements(scripts as HTMLScriptElement[]);

    // Detect forms with submit events or search functionality
    const forms = Array.from(doc.querySelectorAll("form"));
    const searchInputs = Array.from(
      doc.querySelectorAll(
        'input[type="search"], input[placeholder*="search" i], input[name*="search" i]'
      )
    );

    const interactivity: { [key: string]: boolean } = {};

    // Check for form functionality
    if (forms.length > 0) {
      interactivity.hasForms = true;
    }

    // Check for search functionality
    if (searchInputs.length > 0) {
      interactivity.hasSearch = true;
    }

    // Check for event listeners on elements
    const clickableElements = Array.from(
      doc.querySelectorAll("button, a, [onclick]")
    );
    if (clickableElements.some((el) => el.getAttribute("onclick") !== null)) {
      interactivity.hasClickHandlers = true;
    }

    setJsInteractivity(interactivity);
  };

  const initializeEditor = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument || !iframe.contentWindow) return;

    const doc = iframe.contentDocument;

    // Make all text elements editable
    const textElements = doc.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, button, a, li"
    );
    textElements.forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.classList.add(
        "hover:outline",
        "hover:outline-2",
        "hover:outline-blue-300",
        "hover:outline-dashed"
      );

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        selectElement(el as HTMLElement);
      });
    });

    // Enhance images with clear upload indicators
    const imageElements = doc.querySelectorAll("img");
    imageElements.forEach((el) => {
      const imgElement = el as HTMLImageElement;

      // Add styling to make it clear the image is editable
      imgElement.style.cursor = "pointer";

      // Create overlay container for images
      const containerDiv = doc.createElement("div");
      containerDiv.style.position = "relative";
      containerDiv.style.display = "inline-block";
      containerDiv.className = "image-upload-container";

      // Only wrap the image if not already wrapped
      if (
        !imgElement.parentElement?.classList.contains("image-upload-container")
      ) {
        // Wrap the image with the container
        imgElement.parentNode?.insertBefore(containerDiv, imgElement);
        containerDiv.appendChild(imgElement);

        // Create upload overlay
        const uploadOverlay = doc.createElement("div");
        uploadOverlay.className = "upload-overlay";
        uploadOverlay.style.position = "absolute";
        uploadOverlay.style.top = "0";
        uploadOverlay.style.left = "0";
        uploadOverlay.style.right = "0";
        uploadOverlay.style.bottom = "0";
        uploadOverlay.style.display = "flex";
        uploadOverlay.style.alignItems = "center";
        uploadOverlay.style.justifyContent = "center";
        uploadOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        uploadOverlay.style.opacity = "0";
        uploadOverlay.style.transition = "opacity 0.2s";
        uploadOverlay.style.color = "white";
        uploadOverlay.style.fontSize = "14px";
        uploadOverlay.style.fontWeight = "bold";
        uploadOverlay.style.cursor = "pointer";

        // Add upload button text
        uploadOverlay.innerText = "Upload Image";

        // Add hover effect
        containerDiv.addEventListener("mouseenter", () => {
          uploadOverlay.style.opacity = "1";
        });

        containerDiv.addEventListener("mouseleave", () => {
          uploadOverlay.style.opacity = "0";
        });

        // Add click handler for the overlay
        uploadOverlay.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Select the image and show the uploader
          selectElement(imgElement);
          setShowImageUploader(true);
        });

        containerDiv.appendChild(uploadOverlay);
      }

      // Original click handler for the image itself
      imgElement.addEventListener("click", (e) => {
        e.stopPropagation();
        selectElement(imgElement);
        setShowImageUploader(true);
      });
    });

    // Make links editable
    const linkElements = doc.querySelectorAll("a");
    linkElements.forEach((el) => {
      el.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newHref = prompt(
          "Enter link URL:",
          el.getAttribute("href") || ""
        );
        if (newHref !== null) {
          el.setAttribute("href", newHref);
        }
      });
    });

    // Make elements with event handlers (onclick) special treatment
    const elementsWithHandlers = doc.querySelectorAll("[onclick]");
    elementsWithHandlers.forEach((el) => {
      // Store the onclick attribute value
      const onclickValue = el.getAttribute("onclick");

      // Mark for special handling
      if (onclickValue) {
        el.setAttribute("data-original-onclick", onclickValue);

        // For elements with both contenteditable and onclick, we need special handling
        el.addEventListener("click", (e) => {
          // If we're in edit mode, prevent the onclick handler from firing
          if (!showPreview) {
            e.preventDefault();
            e.stopPropagation();
            selectElement(el as HTMLElement);
          }
        });
      }
    });

    // Make container elements draggable
    const containerElements = doc.querySelectorAll(
      "div, section, article, header, footer, aside, nav"
    );
    containerElements.forEach((el) => {
      el.classList.add(
        "hover:outline",
        "hover:outline-1",
        "hover:outline-gray-400",
        "hover:outline-dotted"
      );

      el.addEventListener("click", (e) => {
        if (e.currentTarget === el) {
          e.stopPropagation();
          selectElement(el as HTMLElement);
        }
      });

      // Add handle for dragging
      const handle = doc.createElement("div");
      handle.className =
        "drag-handle absolute -top-6 left-0 bg-blue-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 cursor-move text-xs flex items-center";
      handle.innerHTML =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14M5 15h14"></path></svg> Move';

      // Only add handle to direct children of body or major container
      if (
        el.parentElement === doc.body ||
        el.parentElement?.tagName === "MAIN" ||
        el.parentElement?.tagName === "SECTION"
      ) {
        // Set parent as relative for absolute positioning
        el.classList.add("group", "relative");
        el.appendChild(handle);

        handle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          setIsDragging(true);
          selectElement(el as HTMLElement);

          // Drag logic would go here
          // This would need a full implementation of drag-and-drop
        });
      }
    });

    // Click outside to deselect
    doc.addEventListener("click", (e) => {
      if (e.target === doc.body || e.target === doc.documentElement) {
        deselectElement();
      }
    });
  };

  const selectElement = (element: HTMLElement) => {
    // Remove highlight from previously selected element
    if (selectedElement) {
      selectedElement.style.outline = "";
    }

    // Highlight the selected element
    element.style.outline = "2px solid #3b82f6";
    setSelectedElement(element);
    setShowElementTools(true);
  };

  const deselectElement = () => {
    if (selectedElement) {
      selectedElement.style.outline = "";
    }
    setSelectedElement(null);
    setShowElementTools(false);
  };

  const handleTextEdit = () => {
    if (!selectedElement) return;
    selectedElement.focus();
  };

  // Enhanced image edit handler to allow converting divs to images
  const handleImageEdit = () => {
    setInvalidImageEdit(false);
    setIsElementConversion(false);
    setElementToReplace(null);

    if (!selectedElement) {
      console.error("No element selected");
      setInvalidImageEdit(true);
      return;
    }

    // If it's already an image, just edit it as usual
    if (selectedElement instanceof HTMLImageElement) {
      console.log("Opening image uploader for:", selectedElement.src);
      setShowImageUploader(true);
      return;
    }

    // If it's a div or other element that might be intended as an image container
    console.log("Selected element is not an image:", selectedElement.tagName);

    // Ask user if they want to convert the element to an image
    const shouldConvert = confirm(
      `Convert this ${selectedElement.tagName.toLowerCase()} element to an image?`
    );

    if (shouldConvert) {
      // Mark this as a conversion operation and store the element to replace
      setIsElementConversion(true);
      setElementToReplace(selectedElement);
      setShowImageUploader(true);
    } else {
      setInvalidImageEdit(true);
    }
  };

  // Enhanced image upload handler to support element conversion
  const handleImageUpload = (imageUrl: string) => {
    console.log("Image URL received in ContentEditor:", imageUrl);

    if (!selectedElement) {
      console.error("No element selected for image update");
      alert("Error: No element selected for image update");
      return;
    }

    try {
      // Case 1: Element is already an image - update its src
      if (selectedElement instanceof HTMLImageElement) {
        console.log(
          "Updating existing image:",
          selectedElement.src,
          "->",
          imageUrl
        );
        selectedElement.src = imageUrl;
      }
      // Case 2: Non-image element that needs to be converted to an image
      else if (isElementConversion && selectedElement) {
        console.log("Converting element to image:", selectedElement.tagName);

        // Create a new image element
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "100%";

        // Replace the element with the new image
        selectedElement.parentNode?.replaceChild(img, selectedElement);

        // Select the new image
        selectElement(img);
      }

      // Close the uploader
      setShowImageUploader(false);

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className =
        "fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50";
      successMsg.textContent = "Image updated successfully!";
      document.body.appendChild(successMsg);

      setTimeout(() => {
        if (document.body.contains(successMsg)) {
          document.body.removeChild(successMsg);
        }
      }, 3000);

      // Save changes to content
      if (editorRef.current && editorRef.current.contentDocument) {
        // Clean up editor elements before saving
        const iframeDoc = editorRef.current.contentDocument;

        // Deep clone the document to avoid modifying the live DOM
        const tempDoc = document.implementation.createHTMLDocument();
        const clone = tempDoc.importNode(iframeDoc.documentElement, true);
        tempDoc.replaceChild(clone, tempDoc.documentElement);

        // Clean up the cloned document
        cleanupEditorElements(tempDoc);

        // Get the cleaned HTML
        const updatedContent = tempDoc.documentElement.outerHTML;

        // Set the content state
        setContent(updatedContent);
      }
    } catch (error) {
      console.error("Error updating image:", error);
      alert(
        "Failed to update image: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const showSuccessMessage = (message: string) => {
    // Create success message element
    const successMsg = document.createElement("div");
    successMsg.className =
      "fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50";
    successMsg.textContent = message;
    document.body.appendChild(successMsg);

    // Remove after delay
    setTimeout(() => {
      if (document.body.contains(successMsg)) {
        document.body.removeChild(successMsg);
      }
    }, 3000);
  };

  const togglePreviewMode = () => {
    // Before toggling preview, save current state
    if (editorRef.current && editorRef.current.contentDocument) {
      const currentContent =
        editorRef.current.contentDocument.documentElement.outerHTML;
      setContent(currentContent);
    }

    setShowPreview(!showPreview);
  };

  const handleLinkEdit = () => {
    if (!selectedElement) return;

    if (selectedElement.tagName === "A") {
      const newHref = prompt(
        "Enter link URL:",
        selectedElement.getAttribute("href") || ""
      );
      if (newHref !== null) {
        selectedElement.setAttribute("href", newHref);
      }
    } else {
      // If it's not a link, ask if they want to convert it
      const makeLink = confirm("Convert this element to a link?");
      if (makeLink) {
        const newHref = prompt("Enter link URL:", "https://");
        if (newHref && newHref.trim() !== "") {
          const link = document.createElement("a");
          link.href = newHref;
          link.innerHTML = selectedElement.innerHTML;
          selectedElement.parentNode?.replaceChild(link, selectedElement);
          selectElement(link);
        }
      }
    }
  };

  const handleDelete = () => {
    if (!selectedElement) return;
    const confirmDelete = confirm(
      "Are you sure you want to delete this element?"
    );
    if (confirmDelete) {
      selectedElement.remove();
      deselectElement();
    }
  };

  const handleSave = () => {
    if (!editorRef.current || !editorRef.current.contentDocument) return;

    try {
      const iframeDoc = editorRef.current.contentDocument;

      // Deep clone the document to avoid modifying the live DOM
      const tempDoc = document.implementation.createHTMLDocument();
      const clone = tempDoc.importNode(iframeDoc.documentElement, true);
      tempDoc.replaceChild(clone, tempDoc.documentElement);

      // Clean up the cloned document
      cleanupEditorElements(tempDoc);

      // Get the cleaned HTML
      const updatedContent = tempDoc.documentElement.outerHTML;

      // Save to localStorage
      localStorage.setItem("webcraft-editor-content", updatedContent);

      // Update the state
      setContent(updatedContent);

      // Notify the user
      alert("Your changes have been saved!");
    } catch (error) {
      console.error("Error saving content:", error);
      alert(
        "Failed to save changes: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const handlePreview = () => {
    togglePreviewMode();
  };

  const handleBack = () => {
    const hasChanges = content !== originalContent;

    if (hasChanges) {
      const confirmLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave the editor?"
      );
      if (!confirmLeave) return;
    }

    navigate("/");
  };

  // Enhanced export function to ensure JavaScript works
  const handleExport = () => {
    if (!content) return;

    try {
      // Create a temporary document to clean up editor elements
      const parser = new DOMParser();
      const tempDoc = parser.parseFromString(content, "text/html");

      // Clean up the document
      cleanupEditorElements(tempDoc);

      // Get the cleaned HTML
      const cleanedContent = tempDoc.documentElement.outerHTML;

      // Add a script to ensure event handlers are preserved
      const finalContent = cleanedContent.replace(
        "</head>",
        `
        <script>
          // Helper function to reattach event handlers after page load
          window.addEventListener('DOMContentLoaded', function() {
            // Reattach any handlers that might have been lost
            document.querySelectorAll('[onclick]').forEach(el => {
              if (typeof el.onclick !== 'function' && el.getAttribute('onclick')) {
                try {
                  // Create a proper function from the onclick string
                  const handlerStr = el.getAttribute('onclick');
                  el.onclick = new Function(handlerStr);
                } catch(e) {
                  console.error('Failed to reattach handler:', e);
                }
              }
            });
          });
        </script>
        </head>
      `
      );

      // Create the blob and download
      const blob = new Blob([finalContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-website.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting content:", error);
      alert(
        "Failed to export website: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  // Modified cleanup function to preserve JavaScript functionality
  const cleanupEditorElements = (doc: Document): void => {
    // Remove move handles
    const moveHandles = doc.querySelectorAll(
      '.drag-handle, [class*="move"], [class*="draggable"]'
    );
    moveHandles.forEach((handle) => handle.remove());

    // Remove any editor-specific classes or attributes
    const editableElements = doc.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach((el) => {
      el.removeAttribute("contenteditable");
      // Remove any outline styles
      el.style.outline = "";
    });

    // Clean up any other editor UI elements
    const editorOverlays = doc.querySelectorAll(
      ".upload-overlay, .image-upload-container > div:not(img)"
    );
    editorOverlays.forEach((overlay) => overlay.remove());

    // Restore onclick attributes from data-original-onclick
    const elementsWithSavedHandlers = doc.querySelectorAll(
      "[data-original-onclick]"
    );
    elementsWithSavedHandlers.forEach((el) => {
      const originalHandler = el.getAttribute("data-original-onclick");
      if (originalHandler) {
        el.setAttribute("onclick", originalHandler);
        el.removeAttribute("data-original-onclick");
      }
    });

    // Ensure script tags are not modified
    const scripts = doc.querySelectorAll("script");
    scripts.forEach((script) => {
      // Remove any editor-added attributes from scripts
      if (script.hasAttribute("data-editor-modified")) {
        script.removeAttribute("data-editor-modified");
      }
    });
  };

  if (!content) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with tools */}
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 hover:bg-gray-700 rounded"
            title="Back to Generator"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Content Editor</h1>
        </div>

        <div className="flex space-x-2">
          {Object.keys(jsInteractivity).length > 0 && (
            <div className="bg-yellow-600 text-white px-3 py-1 rounded text-sm flex items-center mr-2">
              <span>Interactive Elements Detected</span>
              <div className="ml-2 text-xs bg-yellow-500 rounded px-1">
                {Object.keys(jsInteractivity).length}
              </div>
            </div>
          )}
          <button
            onClick={handlePreview}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded flex items-center"
          >
            <Eye size={16} className="mr-2" />
            {showPreview ? "Edit Mode" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Export HTML
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with element tools */}
        <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="font-bold mb-4">Element Tools</h2>

          {showElementTools ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Element selected:{" "}
                <span className="font-mono">
                  {selectedElement?.tagName.toLowerCase()}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTextEdit}
                  className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-50 flex flex-col items-center"
                  title="Edit Text"
                >
                  <Type size={16} />
                  <span className="text-xs mt-1">Text</span>
                </button>
                <button
                  onClick={handleImageEdit}
                  className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-50 flex flex-col items-center"
                  title="Edit Image"
                >
                  <ImageIcon size={16} />
                  <span className="text-xs mt-1">Image</span>
                </button>
                <button
                  onClick={handleLinkEdit}
                  className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-50 flex flex-col items-center"
                  title="Edit Link"
                >
                  <LinkIcon size={16} />
                  <span className="text-xs mt-1">Link</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-50 text-red-500 flex flex-col items-center"
                  title="Delete Element"
                >
                  <Trash2 size={16} />
                  <span className="text-xs mt-1">Delete</span>
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Element Style</h3>
                <div className="space-y-2">
                  <select className="w-full p-2 border border-gray-300 rounded text-sm">
                    <option>Default</option>
                    <option>Bold and Centered</option>
                    <option>Highlighted</option>
                    <option>Large Text</option>
                    <option>Small Text</option>
                  </select>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-white p-1 border border-gray-300 rounded text-xs">
                      Apply Class
                    </button>
                    <button className="flex-1 bg-white p-1 border border-gray-300 rounded text-xs">
                      Custom CSS
                    </button>
                  </div>
                </div>
              </div>

              {/* Add JavaScript information if the element has event handlers */}
              {selectedElement?.hasAttribute("onclick") && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    This element has JavaScript functionality. Switch to Preview
                    mode to test it.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Click on any element in the preview to select and edit it.
            </p>
          )}

          {/* JavaScript Functionality Section */}
          {scriptElements.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                JavaScript Functionality
              </h3>
              <div className="bg-yellow-50 p-2 rounded text-xs text-gray-700">
                <p className="mb-1">
                  This website contains JavaScript functionality:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  {jsInteractivity.hasForms && <li>Forms processing</li>}
                  {jsInteractivity.hasSearch && <li>Search functionality</li>}
                  {jsInteractivity.hasClickHandlers && (
                    <li>Interactive elements</li>
                  )}
                </ul>
                <p className="mt-2 font-medium">
                  Use Preview mode to test functionality.
                </p>
              </div>
            </div>
          )}

          <hr className="my-4" />

          <div>
            <h3 className="font-medium mb-2">Add Elements</h3>
            <div className="space-y-1">
              <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded flex items-center">
                <Plus size={14} className="mr-2" /> Heading
              </button>
              <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded flex items-center">
                <Plus size={14} className="mr-2" /> Paragraph
              </button>
              <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded flex items-center">
                <Plus size={14} className="mr-2" /> Button
              </button>
              <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded flex items-center">
                <Plus size={14} className="mr-2" /> Image
              </button>
              <button className="w-full text-left text-sm p-2 hover:bg-gray-200 rounded flex items-center">
                <Plus size={14} className="mr-2" /> Container
              </button>
            </div>
          </div>
        </div>

        {/* Main Editor Area - updated sandbox attributes */}
        <div className="flex-1 bg-gray-200 p-4 overflow-auto">
          <div className="bg-white shadow-lg rounded-lg h-full overflow-hidden">
            <iframe
              ref={editorRef}
              srcDoc={content}
              title="Website Editor"
              className="w-full h-full border-0"
              sandbox={
                showPreview
                  ? "allow-scripts allow-forms allow-popups allow-same-origin"
                  : "allow-scripts allow-same-origin allow-forms allow-modals"
              }
            />
          </div>
        </div>
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <ImageUploader
          onImageUpload={handleImageUpload}
          onCancel={() => {
            setShowImageUploader(false);
            setInvalidImageEdit(false);
            setIsElementConversion(false);
            setElementToReplace(null);
          }}
          initialImageUrl={
            selectedElement instanceof HTMLImageElement
              ? selectedElement.src
              : ""
          }
          error={invalidImageEdit ? "Selected element is not an image" : null}
          conversionMode={isElementConversion}
        />
      )}

      {/* Error notification */}
      {uploadError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          {uploadError}
        </div>
      )}
    </div>
  );
};
