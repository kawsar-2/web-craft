import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  Send,
  ClipboardCopy,
  Loader2,
  ExternalLink,
  Edit2,
  Image as ImageIcon,
  Type,
  Layout,
} from "lucide-react";
import { generateWebsiteFromPrompt } from "../services/geminiService";
import { PromptHelper } from "../components/PromptHelper";
import { EditorPanel } from "../components/EditorPanel";

export const AIGenerator = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    html: string;
    css: string;
    js: string;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPreview, setEditedPreview] = useState<string | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [editableElements, setEditableElements] = useState<HTMLElement[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleGenerateWebsite = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setEditMode(false);
    setEditedPreview(null);

    try {
      // Use the geminiService to generate content
      const response = await generateWebsiteFromPrompt(prompt);
      setGeneratedContent(response);

      // Create a preview by combining the HTML, CSS, and JS with Tailwind included
      const previewContent = createPreviewContent(response);
      setPreview(previewContent);
    } catch (error) {
      console.error("Error generating website:", error);
      alert("Failed to generate website. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced createPreviewContent function to ensure JavaScript works
  const createPreviewContent = (content: {
    html: string;
    css: string;
    js: string;
  }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebCraft Preview</title>
        <!-- Include Tailwind CSS via CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        <style>${content.css}</style>
        <script>
          // Ensure JavaScript runs after content is loaded
          document.addEventListener('DOMContentLoaded', function() {
            // Reactivate any script tags or event handlers
            document.querySelectorAll('[onclick]').forEach(el => {
              if (typeof el.onclick !== 'function' && el.getAttribute('onclick')) {
                try {
                  const handlerStr = el.getAttribute('onclick');
                  el.onclick = new Function(handlerStr);
                } catch(e) {
                  console.error('Failed to attach handler:', e);
                }
              }
            });
          });
        </script>
      </head>
      <body>
        ${content.html}
        <script>${content.js}</script>
      </body>
      </html>
    `;
  };

  const handleCopyCode = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    alert(`${type} code copied to clipboard!`);
  };

  const handleExport = () => {
    if (!generatedContent) return;

    // Use the edited content if available, otherwise use the original
    const contentToExport = editedPreview || preview;
    if (!contentToExport) return;

    const blob = new Blob([contentToExport], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewInNewTab = () => {
    if (!preview) return;

    // Use the edited content if available, otherwise use the original
    const contentToPreview = editedPreview || preview;

    // Create a blob and open it in a new tab
    const blob = new Blob([contentToPreview], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    // Clean up the URL object after the tab is opened
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleToggleEditMode = () => {
    // Instead of toggling edit mode, navigate to the editor page
    if (!preview) return;

    // Save the current content to localStorage
    const contentToEdit = editedPreview || preview;

    // Store the content and generated code in localStorage
    localStorage.setItem("webcraft-editor-content", contentToEdit);

    if (generatedContent) {
      localStorage.setItem("webcraft-generated-html", generatedContent.html);
      localStorage.setItem("webcraft-generated-css", generatedContent.css);
      localStorage.setItem("webcraft-generated-js", generatedContent.js);
    }

    // Navigate to the editor page
    navigate("/editor");
  };

  const handleSaveEdits = (editedContent: string) => {
    setEditedPreview(editedContent);
  };

  // Initialize the editor when entering edit mode
  useEffect(() => {
    if (editMode && previewIframeRef.current) {
      const iframe = previewIframeRef.current;
      iframe.onload = () => {
        initializeEditor(iframe);
      };

      // If the iframe is already loaded
      if (iframe.contentDocument?.readyState === "complete") {
        initializeEditor(iframe);
      }
    }
  }, [editMode, preview, editedPreview]);

  const initializeEditor = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument || !iframe.contentWindow) return;

    // Find all editable elements
    const doc = iframe.contentDocument;
    const textElements = Array.from(
      doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, a, button, li")
    );
    const imageElements = Array.from(doc.querySelectorAll("img"));

    const allEditableElements = [
      ...textElements,
      ...imageElements,
    ] as HTMLElement[];
    setEditableElements(allEditableElements);

    // Make text elements editable
    textElements.forEach((el) => {
      el.contentEditable = "true";
      el.style.cursor = "pointer";
      el.addEventListener("focus", () => setSelectedElement(el as HTMLElement));
      el.addEventListener("blur", () => captureEditorState(iframe));
    });

    // Make images replaceable
    imageElements.forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        setSelectedElement(el as HTMLElement);
        promptForImageUrl(el as HTMLImageElement);
      });
    });

    // Add drag capability to container elements
    const containerElements = Array.from(
      doc.querySelectorAll("div, section, article, header, footer, nav")
    );
    containerElements.forEach((el) => {
      makeElementDraggable(el as HTMLElement, iframe);
    });
  };

  const captureEditorState = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument) return;
    // Save the current state of the edited content
    setEditedPreview(iframe.contentDocument.documentElement.outerHTML);
  };

  const promptForImageUrl = (imgElement: HTMLImageElement) => {
    const newSrc = prompt("Enter image URL:", imgElement.src);
    if (newSrc && newSrc.trim() !== "") {
      imgElement.src = newSrc;
      captureEditorState(previewIframeRef.current!);
    }
  };

  const makeElementDraggable = (
    element: HTMLElement,
    iframe: HTMLIFrameElement
  ) => {
    element.style.position = "relative";

    element.addEventListener("mousedown", (e) => {
      if (!editMode) return;
      setIsDragging(true);
      setSelectedElement(element);

      const rect = element.getBoundingClientRect();
      setDragStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      element.style.border = "2px dashed #3b82f6";
      element.style.cursor = "move";

      e.preventDefault();
    });

    iframe.contentDocument?.addEventListener("mousemove", (e) => {
      if (!isDragging || !selectedElement) return;

      const parent = selectedElement.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const newLeft = e.clientX - parentRect.left - dragStartPos.x;
      const newTop = e.clientY - parentRect.top - dragStartPos.y;

      selectedElement.style.position = "absolute";
      selectedElement.style.left = `${newLeft}px`;
      selectedElement.style.top = `${newTop}px`;
    });

    iframe.contentDocument?.addEventListener("mouseup", () => {
      if (isDragging && selectedElement) {
        selectedElement.style.border = "";
        selectedElement.style.cursor = "";
        captureEditorState(iframe);
      }
      setIsDragging(false);
    });
  };

  const handleEditSpecificElement = (type: "text" | "image" | "layout") => {
    if (!selectedElement) return;

    switch (type) {
      case "text":
        if (selectedElement instanceof HTMLElement) {
          selectedElement.contentEditable = "true";
          selectedElement.focus();
        }
        break;
      case "image":
        if (selectedElement instanceof HTMLImageElement) {
          promptForImageUrl(selectedElement);
        }
        break;
      case "layout":
        if (selectedElement instanceof HTMLElement) {
          const newClass = prompt(
            "Enter new CSS classes for layout:",
            selectedElement.className
          );
          if (newClass !== null) {
            selectedElement.className = newClass;
            captureEditorState(previewIframeRef.current!);
          }
        }
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center justify-center">
          <Wand2 className="w-8 h-8 mr-2" />
          AI Website Generator
        </h1>
        <p className="text-gray-600">
          Describe your website and let AI build it for you with Tailwind CSS
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <PromptHelper onSuggestionSelect={handlePromptSuggestion} />

        <div className="flex items-center">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-l-lg h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your website... (e.g., 'Create a modern landing page for a coffee shop with product showcase and contact form')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 h-20 rounded-r-lg flex items-center justify-center disabled:bg-blue-300"
            onClick={handleGenerateWebsite}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Generate
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">
            Generating your website with Gemini...
          </p>
        </div>
      )}

      {generatedContent && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Preview</h2>
              <button
                onClick={handleToggleEditMode}
                className="flex items-center px-3 py-1 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Content
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg h-96 overflow-auto relative">
              <iframe
                ref={previewIframeRef}
                srcDoc={editedPreview || preview!}
                title="Generated Website Preview"
                className="w-full h-full"
                sandbox="allow-scripts allow-forms allow-same-origin"
              />
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <ClipboardCopy className="w-4 h-4 mr-2" />
                Export as HTML
              </button>
              <button
                onClick={handlePreviewInNewTab}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview in New Tab
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Generated Code</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">HTML</h3>
                  <button
                    onClick={() =>
                      handleCopyCode(generatedContent.html, "HTML")
                    }
                    className="text-blue-600 flex items-center text-sm"
                  >
                    <ClipboardCopy className="w-3 h-3 mr-1" /> Copy
                  </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-28">
                  <code>{generatedContent.html}</code>
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">CSS</h3>
                  <button
                    onClick={() => handleCopyCode(generatedContent.css, "CSS")}
                    className="text-blue-600 flex items-center text-sm"
                  >
                    <ClipboardCopy className="w-3 h-3 mr-1" /> Copy
                  </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-28">
                  <code>{generatedContent.css}</code>
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">JavaScript</h3>
                  <button
                    onClick={() =>
                      handleCopyCode(generatedContent.js, "JavaScript")
                    }
                    className="text-blue-600 flex items-center text-sm"
                  >
                    <ClipboardCopy className="w-3 h-3 mr-1" /> Copy
                  </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-28">
                  <code>{generatedContent.js}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
