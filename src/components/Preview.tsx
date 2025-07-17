import React, { useState } from "react";
import { ComponentData } from "../types";
import { useBuilderStore } from "../store";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
  Youtube,
  Github,
  Gitlab,
} from "lucide-react";

interface PreviewComponentProps {
  component: ComponentData;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({ component }) => {
  const { type, content, props } = component;
  const pages = useBuilderStore((state) => state.pages);
  const setCurrentPage = useBuilderStore((state) => state.setCurrentPage);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return "";

    let videoId = "";
    let params = "";

    // Extract video ID and query parameters
    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([^?&]+)/);
    if (match) {
      videoId = match[1];
      params = url.includes("?") ? url.split("?")[1] : ""; // Keep extra parameters
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}${params ? "?" + params : ""}`
      : "";
  };

  const getSocialIcon = (url: string) => {
    if (url.includes("facebook")) return <Facebook className="w-6 h-6" />;
    if (url.includes("twitter")) return <Twitter className="w-6 h-6" />;
    if (url.includes("instagram")) return <Instagram className="w-6 h-6" />;
    if (url.includes("linkedin")) return <Linkedin className="w-6 h-6" />;
    if (url.includes("youtube")) return <Youtube className="w-6 h-6" />;
    if (url.includes("github")) return <Github className="w-6 h-6" />;
    if (url.includes("gitlab")) return <Gitlab className="w-6 h-6" />;
    return null;
  };

  const handleNavigation = (href: string) => {
    const targetPage = pages.find((p) => p.slug === href);
    if (targetPage) {
      setCurrentPage(targetPage.id);
    }
  };

  const getButtonClasses = (variant: string = "primary") => {
    const baseClasses = "px-4 py-2 rounded transition-colors";
    switch (variant) {
      case "primary":
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
      case "secondary":
        return `${baseClasses} bg-gray-500 text-white hover:bg-gray-600`;
      case "outline":
        return `${baseClasses} border-2 border-blue-500 text-blue-500 hover:bg-blue-50`;
      case "ghost":
        return `${baseClasses} text-blue-500 hover:bg-blue-50`;
      default:
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }
  };

  const getTextStyle = () => {
    if (!["heading", "paragraph", "button", "link"].includes(type)) return {};
    return {
      fontSize: `${props?.fontSize || 16}px`,
    };
  };

  switch (type) {
    case "navbar":
      return (
        <nav className="bg-white shadow-sm mb-4 fixed top-0 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-lg font-semibold">{content}</span>
              </div>
              <div className="flex items-center space-x-4">
                {props?.items?.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.href)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      );
    case "dropdown":
      return (
        <div className="relative inline-block text-left mb-4">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            {content}
            <ChevronDown className="-mr-1 ml-2 h-5 w-5" />
          </button>
          {isDropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                {props?.items?.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleNavigation(item.href);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div
          className={`mb-4 text-${props?.alignment || "left"}`}
          style={{ width: props?.width }}
        >
          <button
            onClick={() => handleNavigation(props?.href || "/")}
            className={getButtonClasses(props?.variant)}
            style={getTextStyle()}
          >
            {content}
          </button>
        </div>
      );
    case "link":
      return (
        <button
          onClick={() => handleNavigation(props?.href || "/")}
          className="text-blue-500 hover:text-blue-600 hover:underline mb-4"
          style={getTextStyle()}
        >
          {content}
        </button>
      );
    case "container":
      return (
        <div
          style={{
            backgroundColor: props?.backgroundColor || "transparent",
            padding: props?.padding || "1rem",
            width: props?.width,
            minHeight: props?.height,
          }}
          className="rounded-lg mb-4"
        >
          {content}
        </div>
      );
    case "heading":
      return (
        <h1
          className="text-2xl font-bold mb-4"
          style={{
            ...getTextStyle(),
            width: props?.width,
          }}
        >
          {content}
        </h1>
      );
    case "paragraph":
      return (
        <p
          className="mb-4 leading-relaxed"
          style={{
            ...getTextStyle(),
            width: props?.width,
          }}
        >
          {content}
        </p>
      );
    case "image":
      return content ? (
        <div style={{ width: props?.width }} className="mb-4">
          <img
            src={content}
            alt="Content"
            className="max-w-full h-auto rounded"
          />
        </div>
      ) : null;
    case "youtube":
      return content ? (
        <div style={{ width: props?.width }} className="mb-4">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={getYouTubeEmbedUrl(content)}
              className="absolute top-0 left-0 w-full h-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        </div>
      ) : null;
    case "grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${props?.columns || 2}, 1fr)`,
            gap: `${props?.spacing || 4}rem`,
            width: props?.width,
          }}
          className="mb-4"
        >
          {Array.from({ length: props?.columns || 2 }).map((_, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded">
              Grid Column {index + 1}
            </div>
          ))}
        </div>
      );
    case "footer":
      return (
        <footer className="bg-gray-800 text-white py-8 px-4 mt-8">
          <div className="max-w-4xl mx-auto">
            <div
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{ width: props?.width }}
            />
          </div>
        </footer>
      );
    case "spacer":
      return (
        <div
          style={{
            height: `${props?.spacing || 4}rem`,
            width: props?.width,
          }}
        />
      );
    case "divider":
      return (
        <hr className="my-4 border-gray-200" style={{ width: props?.width }} />
      );
    case "social":
      return (
        <div className="flex gap-4 mb-4" style={{ width: props?.width }}>
          {content.split("\n").map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                const fullUrl = url.startsWith("http") ? url : `https://${url}`;
                window.open(fullUrl, "_blank");
              }}
            >
              {getSocialIcon(url)}
            </a>
          ))}
        </div>
      );
    default:
      return null;
  }
};

export const Preview = () => {
  const components = useBuilderStore((state) => state.components);
  const currentPage = useBuilderStore((state) =>
    state.pages.find((p) => p.id === state.currentPageId)
  );

  return (
    <div className="max-w-7xl mx-auto pt-16">
      <div className="bg-white shadow-sm mb-8 px-4 py-2 text-sm text-gray-500">
        Currently previewing: {currentPage?.title}
      </div>
      <div className="max-w-4xl mx-auto p-8">
        {components.map((component) => (
          <PreviewComponent key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
};
