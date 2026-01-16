
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingSource } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getChatResponse(prompt: string, history: any[]) {
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
    });
    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return { text: response.text || "I'm sorry, I couldn't generate a response." };
}

export async function getGroundedResponse(prompt: string) {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        }))
        // filter unique uris
        .filter((source: GroundingSource, index: number, self: GroundingSource[]) =>
            index === self.findIndex((s) => s.uri === source.uri)
        );

    return {
        text: response.text || "I'm sorry, I couldn't generate a response.",
        sources: sources
    };
}

export async function getTextToSpeech(text: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Text-to-speech generation failed:", error);
        return null;
    }
}
