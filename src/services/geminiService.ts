
import { GoogleGenAI, Type } from "@google/genai";
import { SuggestionResponse } from "../types";

/**
 * Service to handle Gemini API interactions for thumbnail analysis and image generation.
 */

// Analyze script content to get thumbnail suggestions
export const analyzeScript = async (input: string, language: string = 'Vietnamese'): Promise<SuggestionResponse> => {
  // Always initialize a fresh client instance before making an API call to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this video script/description and suggest high-converting thumbnail elements. 
    IMPORTANT: You must provide all text (titles and image descriptions) in ${language}.
    
    Input content: "${input}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: `3-5 Short, punchy, click-worthy titles in ${language} (max 8 words each).`
          },
          imagePrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: `Exactly 3 highly descriptive prompts in ${language} for generating a background image. Each prompt should focus on different visual metaphors or cinematic styles relevant to the content.`
          }
        },
        required: ["titles", "imagePrompts"]
      }
    }
  });

  try {
    // Access the .text property directly from the response object.
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text.trim()) as SuggestionResponse;
  } catch (e) {
    throw new Error("Failed to parse AI response");
  }
};

// Generate background image for the thumbnail
export const generateThumbnailImage = async (prompt: string): Promise<string> => {
  // Always initialize a fresh client instance before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `High quality photorealistic youtube thumbnail background, professional lighting, no text, no logos, based on this concept: ${prompt}` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  // Correctly iterate through parts to find the image part, as it may not be the first one.
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  
  throw new Error("No image generated");
};

// Edit image to remove text
export const editImageToRemoveText = async (base64Image: string): Promise<string> => {
  // Always initialize a fresh client instance before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Extract mimeType and data from base64 string
  const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image format");
  const mimeType = matches[1];
  const data = matches[2];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data,
            mimeType,
          },
        },
        {
          text: 'Please remove all text, titles, and watermarks from this image. Fill in the areas where text was removed with realistic background textures that match the surroundings. The output should be a clean background image without any text.',
        },
      ],
    },
  });

  // Correctly iterate through parts to find the image part
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  
  throw new Error("Failed to edit image");
};
