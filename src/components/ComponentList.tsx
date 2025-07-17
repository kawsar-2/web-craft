import { useDraggable } from "@dnd-kit/core";
import {
  Heading,
  Type,
  Image,
  Donut as Button,
  Youtube,
  LayoutGrid,
  FilterIcon as FooterIcon,
  ArrowUpDown,
  Minus,
  Share2,
  Box,
  Navigation,
  Link,
  Menu,
} from "lucide-react";

const components = [
  { type: "container", icon: Box, label: "Container" },
  { type: "navbar", icon: Navigation, label: "Navigation Bar" },
  { type: "heading", icon: Heading, label: "Heading" },
  { type: "paragraph", icon: Type, label: "Paragraph" },
  { type: "image", icon: Image, label: "Image" },
  { type: "button", icon: Button, label: "Button" },
  { type: "link", icon: Link, label: "Link" },
  { type: "dropdown", icon: Menu, label: "Dropdown Menu" },
  { type: "youtube", icon: Youtube, label: "YouTube" },
  { type: "grid", icon: LayoutGrid, label: "Grid" },
  { type: "footer", icon: FooterIcon, label: "Footer" },
  { type: "spacer", icon: ArrowUpDown, label: "Spacer" },
  { type: "divider", icon: Minus, label: "Divider" },
  { type: "social", icon: Share2, label: "Social Links" },
];

export const ComponentList = () => {
  return (
    <div className="w-64 bg-white p-4 border-r border-gray-200 h-screen overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Components</h2>
      <div className="space-y-2">
        {components.map((component) => (
          <DraggableComponent key={component.type} {...component} />
        ))}
      </div>
    </div>
  );
};

const DraggableComponent = ({ type, icon: Icon, label }: any) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `new-${type}`,
    data: {
      type,
      isNew: true,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
      style={style}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </div>
  );
};
