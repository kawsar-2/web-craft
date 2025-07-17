interface GeneratedContent {
  html: string;
  css: string;
  js: string;
}

export const generateWebsiteFromPrompt = async (
  prompt: string
): Promise<GeneratedContent> => {
  try {
    // Process the user prompt to make it more specific and professional
    const enhancedPrompt = enhanceUserPrompt(prompt);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDAIcGx7KPIPfj4-xjhTTOuvXOaVgNWqW8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a professional web developer specializing in modern, responsive websites. 
                  
Create a modern, professional-looking website using Tailwind CSS based on the following description: "${enhancedPrompt}".

Your response must include:

1. HTML code that implements a responsive layout with Tailwind CSS classes directly in the HTML
2. Any custom CSS that might be needed (minimize this as much as possible by leveraging Tailwind)
3. JavaScript for interactivity if needed

Important formatting requirements:
- ALL text content (headings, paragraphs, button text, etc.) should have a data-editable="true" attribute
- ALL images should have a data-editable="image" attribute and use placeholder images from https://placehold.co/ or similar services
- Make sure all editable elements have unique IDs for reference

General requirements:
- Create a visually appealing, modern design that follows current web design trends
- Use semantic HTML5 elements
- Make the design fully responsive for mobile, tablet, and desktop
- Include proper spacing, typography, and visual hierarchy
- Add appropriate micro-interactions and hover states
- Ensure good accessibility practices
- Include a proper header, hero section, and footer

Format your response with these exact delimiters:
HTML_START
[Your HTML code here with Tailwind classes]
HTML_END

CSS_START
[Any additional custom CSS needed, minimize this]
CSS_END

JS_START
[Your JavaScript code here]
JS_END

Remember to use Tailwind CSS classes directly in the HTML elements rather than writing custom CSS.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 30000,
            temperature: 1.0,
          },
        }),
      }
    );

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content generated from the AI");
    }

    const htmlMatch = generatedText.match(/HTML_START([\s\S]*?)HTML_END/);
    const cssMatch = generatedText.match(/CSS_START([\s\S]*?)CSS_END/);
    const jsMatch = generatedText.match(/JS_START([\s\S]*?)JS_END/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : "",
      css: cssMatch ? cssMatch[1].trim() : "",
      js: jsMatch ? jsMatch[1].trim() : "",
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate website content");
  }
};

/**
 * Enhances the user's prompt to make it more specific and professional
 * for better Gemini API results
 */
function enhanceUserPrompt(userPrompt: string): string {
  // Add industry-specific terminology if detected
  let enhancedPrompt = userPrompt;

  // If prompt is too short, expand it with defaults
  if (enhancedPrompt.length < 20) {
    enhancedPrompt +=
      " with a clean, modern design that follows current web design trends";
  }

  // Add specific details based on keywords in the prompt
  if (enhancedPrompt.includes("portfolio")) {
    enhancedPrompt +=
      " Include sections for projects, skills, about me, and contact information.";
  } else if (
    enhancedPrompt.includes("ecommerce") ||
    enhancedPrompt.includes("shop")
  ) {
    enhancedPrompt +=
      " Include product listing, shopping cart preview, hero section with promotions, and product categories.";
  } else if (enhancedPrompt.includes("blog")) {
    enhancedPrompt +=
      " Include featured posts, categories, article previews with images, and a newsletter signup.";
  } else if (enhancedPrompt.includes("landing")) {
    enhancedPrompt +=
      " Include a compelling hero section, features or benefits section, testimonials, and a strong call-to-action.";
  }

  // Always request these elements unless explicitly mentioned
  if (!enhancedPrompt.includes("responsive")) {
    enhancedPrompt +=
      " The design should be fully responsive and work well on mobile, tablet, and desktop.";
  }

  // Add color preferences if not specified
  if (!enhancedPrompt.includes("color") && !enhancedPrompt.includes("theme")) {
    enhancedPrompt += " Use a professional color scheme with good contrast.";
  }

  return enhancedPrompt;
}
