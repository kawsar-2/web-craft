import { useState } from "react";
import { Lightbulb } from "lucide-react";

interface PromptHelperProps {
  onSuggestionSelect: (suggestion: string) => void;
}

export const PromptHelper = ({ onSuggestionSelect }: PromptHelperProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = [
    "Create a modern portfolio site for a photographer with a dark theme",
    "Design a landing page for a SaaS product with testimonials and pricing",
    "Build an ecommerce homepage for a furniture store with featured products",
    "Make a blog homepage with featured articles and newsletter signup",
    "Design a restaurant website with menu, reservations and location",
  ];

  const tips = [
    "Specify the type of business or purpose",
    "Mention color preferences or brand colors",
    "Include must-have sections",
    "Describe the tone (professional, playful, minimalist)",
    "Request specific features (contact form, image gallery, etc.)",
  ];

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-blue-600 text-sm underline mb-2"
      >
        <Lightbulb className="w-4 h-4 mr-1" />
        {isOpen ? "Hide prompt tips" : "Need help with your prompt?"}
      </button>

      {isOpen && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Tips for better prompts:</h3>
          <ul className="list-disc pl-5 mb-4 text-sm text-gray-700">
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>

          <h3 className="font-semibold mb-2">Example prompts:</h3>
          <div className="grid gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  onSuggestionSelect(suggestion);
                  setIsOpen(false);
                }}
                className="text-left text-sm bg-white p-2 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                "{suggestion}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
