import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ComponentList } from "../components/ComponentList";
import { Canvas } from "../components/Canvas";
import { Preview } from "../components/Preview";
import { PageManager } from "../components/PageManager";
import { useBuilderStore } from "../store";
import { Eye, EyeOff, Code } from "lucide-react";

export const Dashboard = () => {
  const addComponent = useBuilderStore((state) => state.addComponent);
  const reorderComponents = useBuilderStore((state) => state.reorderComponents);
  const isPreviewMode = useBuilderStore((state) => state.isPreviewMode);
  const togglePreviewMode = useBuilderStore((state) => state.togglePreviewMode);
  const components = useBuilderStore((state) => state.components);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    if (active.data.current?.isNew) {
      const type = active.data.current.type;
      const newComponent = {
        id: crypto.randomUUID(),
        type,
        content: "",
        props:
          type === "navbar" || type === "dropdown"
            ? { items: [] }
            : type === "heading" || type === "paragraph" || type === "button"
            ? { fontSize: 16, color: "#000000" } // Add default color for text components
            : undefined,
      };
      addComponent(newComponent);
    } else if (over.id !== active.id) {
      reorderComponents(active.id, over.id);
    }
  };

  const exportCode = () => {
    const htmlContent = generateHTML(components);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return "";

    let videoId = "";
    let params = "";

    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([^?&]+)/);
    if (match) {
      videoId = match[1];
      params = url.includes("?") ? url.split("?")[1] : "";
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}${params ? "?" + params : ""}`
      : "";
  };

  const generateHTML = (components: any[]) => {
    const componentToHTML = (component: any) => {
      switch (component.type) {
        case "heading":
          return `<h1 style="font-size: ${
            component.props?.fontSize || 16
          }px; color: ${component.props?.color || "#000000"};">${
            component.content
          }</h1>`;
        case "paragraph":
          return `<p style="font-size: ${
            component.props?.fontSize || 16
          }px; color: ${component.props?.color || "#000000"};">${
            component.content
          }</p>`;
        case "button":
          return `<button style="font-size: ${
            component.props?.fontSize || 16
          }px; color: ${
            component.props?.color || "#000000"
          }; padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background-color: ${
            component.props?.backgroundColor || "#f8f9fa"
          };">${component.content}</button>`;
        case "image":
          return `<img src="${component.content}" alt="Content" style="max-width: 100%; height: auto;">`;
        case "youtube":
          return `
          <div style="position: relative; padding-bottom: 56.25%; height: 0;">
            <iframe
              src=${getYouTubeEmbedUrl(component.content)}
              className="absolute top-0 left-0 w-full h-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        `;
        // Add more component types as needed
        default:
          return "";
      }
    };

    const componentsHTML = components.map(componentToHTML).join("\n");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Website</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    <div class="max-w-4xl mx-auto p-8">
        ${componentsHTML}
    </div>
</body>
</html>
    `;
  };

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={togglePreviewMode}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <EyeOff className="w-5 h-5" />
            <span>Exit Preview</span>
          </button>
          <button
            onClick={exportCode}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Code className="w-5 h-5" />
            <span>Export Code</span>
          </button>
        </div>
        <Preview />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col min-h-screen">
        <PageManager />
        <div className="flex flex-1">
          <ComponentList />
          <div className="flex-1 relative">
            <div className="fixed top-4 right-4 z-50 flex gap-2">
              <button
                onClick={togglePreviewMode}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Eye className="w-5 h-5" />
                <span>Preview</span>
              </button>
              <button
                onClick={exportCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Code className="w-5 h-5" />
                <span>Export Code</span>
              </button>
            </div>
            <Canvas />
          </div>
        </div>
      </div>
      <DragOverlay />
    </DndContext>
  );
};
