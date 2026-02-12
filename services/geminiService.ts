
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Assume process.env.API_KEY is available in the execution environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this environment, we assume it's always present.
  console.warn("API_KEY is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

function handleGeminiError(error: any): never {
    console.error("Error calling Gemini API:", error);
    const errorMessageString = String(error?.message || error);
    
    if (errorMessageString.includes('429') || errorMessageString.includes('RESOURCE_EXHAUSTED') || errorMessageString.includes('exceeded your current quota')) {
        throw new Error("quotaExceeded");
    }
    
    throw new Error("aiProcessingError");
}

export async function classifyImageType(base64ImageData: string, mimeType: string): Promise<'logo' | 'packshot'> {
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze this image. Is it a 'logo' or a 'packshot'? 
- A 'logo' is a simple graphic symbol, icon, or stylized text, often on a plain or transparent background.
- A 'packshot' is a photograph of a physical product, such as a bottle, can, box, or other item.
Respond in JSON format with your classification.`;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        image_type: {
                            type: Type.STRING,
                            description: 'Must be either "logo" or "packshot".'
                        }
                    }
                }
            },
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result.image_type === 'logo' || result.image_type === 'packshot') {
            return result.image_type;
        } else {
            console.warn(`Unexpected image_type from Gemini: ${result.image_type}. Defaulting to 'packshot'.`);
            return 'packshot';
        }

    } catch (error) {
        console.error("Error in classifyImageType:", error);
        // Default to the more complex 'packshot' processing in case of an error.
        return 'packshot';
    }
}


export async function autoWhiteBalance(base64ImageData: string, mimeType: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    const prompt = "Perform an automatic white balance correction on this image. Adjust the colors to make the whites appear pure white and remove any color cast. The output must be the color-corrected image. Crucially, do not crop, resize, rotate, or alter the composition in any way. Maintain the high resolution and quality of the input image. The output image must have the exact same dimensions as the input image.";

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            return firstPart.inlineData.data;
        } else {
            throw new Error("noImageDataBalance");
        }

    } catch (error) {
        handleGeminiError(error);
    }
}

export async function removeBackground(base64ImageData: string, mimeType: string, customInstruction?: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    let prompt = `Remove the background completely, making it white.
    
    CRITICAL INSTRUCTIONS:
    1. WATERMARKS: Aggressively detect and remove any watermarks, text overlays, or logos that are not part of the physical product itself. Reconstruct the underlying surface naturally.
    2. QUALITY PRESERVATION: The product image MUST NOT lose quality. Preserve all original details, textures, and sharpness. Do not blur or oversmooth the product.
    3. LIGHT UPSCALE: Perform a light upscale (enhance resolution and clarity) on the subject to ensure it looks high-definition and crisp.
    4. EDGES: Ensure the edges of the product are clean, sharp, and natural-looking against the white background.
    `;

    if (customInstruction && customInstruction.trim() !== "") {
        prompt += `\n\n5. CUSTOM USER INSTRUCTION: ${customInstruction}\nIf this instruction conflicts with "making it white", prioritize the user instruction for the background appearance, but keep watermark removal and quality preservation enabled.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            return firstPart.inlineData.data;
        } else {
            throw new Error("noImageData");
        }

    } catch (error) {
        handleGeminiError(error);
    }
}
