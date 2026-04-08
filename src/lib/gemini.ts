import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Exercise, ValidationResult, RuleInfo } from "../types";

const STORAGE_KEY_API = "germanTutor_apiKey";
const STORAGE_KEY_MODEL = "germanTutor_model";
const STORAGE_KEY_BASE_URL = "germanTutor_baseUrl";

const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";

export { DEFAULT_MODEL, DEFAULT_BASE_URL };

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY_API) || process.env.CUSTOM_API_KEY || "";
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY_API, key);
}

export function getStoredModel(): string {
  return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;
}

export function setStoredModel(model: string) {
  localStorage.setItem(STORAGE_KEY_MODEL, model);
}

export function getStoredBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEY_BASE_URL) || DEFAULT_BASE_URL;
}

export function setStoredBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY_BASE_URL, url);
}

function getAI(): GoogleGenAI {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error("API key not configured. Please set your Gemini API key in Settings.");
  }
  const baseUrl = getStoredBaseUrl();
  return new GoogleGenAI({
    apiKey,
    httpOptions: baseUrl !== DEFAULT_BASE_URL ? { baseUrl } : undefined,
  });
}

function getModel(): string {
  return getStoredModel();
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [1000, 3000, 10000];
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      let isRateLimit = false;
      try {
        const errObj = typeof error === 'string' ? JSON.parse(error) : error;
        if (errObj?.error?.code === 429 || errObj?.status === 429) {
          isRateLimit = true;
        }
      } catch (e) {
        // Not JSON, check status directly if possible
        if (error?.status === 429 || error?.code === 429) {
          isRateLimit = true;
        }
      }

      if (isRateLimit && attempt < delays.length) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

export async function generateRuleInfo(topic: string): Promise<RuleInfo> {
  const prompt = `
    Generate a detailed grammar rule description and exercise design for the German grammar topic: "${topic}".
    
    Include:
    1. A short cheat sheet (use cases, nuances, common pitfalls).
    2. 3 clear examples (German, English, and a short note).
    3. An exercise design plan (focus areas like "singular form", "plural", "no article", etc., and a difficulty progression).
    
    The output must be a JSON object.
  `;

  const response = await callWithRetry(() => getAI().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          cheatSheet: {
            type: Type.OBJECT,
            properties: {
              useCases: { type: Type.ARRAY, items: { type: Type.STRING } },
              nuances: { type: Type.ARRAY, items: { type: Type.STRING } },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    de: { type: Type.STRING },
                    en: { type: Type.STRING },
                    note: { type: Type.STRING }
                  }
                }
              }
            }
          },
          exerciseDesign: {
            type: Type.OBJECT,
            properties: {
              focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficultyProgression: { type: Type.STRING }
            }
          }
        },
        required: ["title", "cheatSheet", "exerciseDesign"]
      }
    }
  }));

  return JSON.parse(response.text || "{}");
}

export async function generateExercise(topic: string, usedSentences: string[] = [], count: number = 3, ruleInfo?: RuleInfo): Promise<Exercise[]> {
  const designContext = ruleInfo ? `
    The exercises MUST specifically target these focus areas: ${ruleInfo.exerciseDesign.focusAreas.join(', ')}.
    Adhere to this difficulty progression: ${ruleInfo.exerciseDesign.difficultyProgression}.
  ` : '';

  const prompt = `
    Generate ${count} diverse German grammar exercises for the topic: "${topic}".
    ${designContext}
    
    CRITICAL RULES:
    - Do NOT use any of these previously used sentences: ${JSON.stringify(usedSentences)}.
    - Vary the sentence structure (e.g., statements, questions, imperative).
    
    For each exercise, provide:
    1. "english": A natural English sentence.
    2. "german": Its accurate German translation.
    3. "distractors": An array with EXACTLY the same number of sub-arrays as there are words in the German translation (split by spaces).
       - Each sub-array MUST contain exactly 5 strings.
       - Each distractor must be a single German word.
       - Distractors should be plausible wrong choices: wrong case/gender forms, similar-sounding words, common learner mistakes, or words from the same category but grammatically incorrect for that position.
       - The correct word MUST NOT appear in its own distractor sub-array.
    
    Example: If german is "Ich gehe nach Hause.", distractors must have exactly 4 sub-arrays of 5 words each.
    
    The output must be a JSON array of objects.
  `;

  const response = await callWithRetry(() => getAI().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        minItems: count,
        maxItems: count,
        items: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            german: { type: Type.STRING },
            distractors: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                // Require exactly 5 distractors for each word
                minItems: 5,
                maxItems: 5,
                description: "Array of 5 distractors for the word at this position."
              }
            }
          },
          required: ["english", "german", "distractors"]
        }
      }
    }
  }));

  const data = JSON.parse(response.text || "[]");
  
  const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const stripPunctuation = (s: string) => s.replace(/[.,!?;:"""''`…–—]/g, '').trim();

  return data.map((item: any) => {
    // Strip trailing punctuation from the full German sentence
    const cleanGerman = item.german.replace(/[.!?]+$/, '').trim();
    const words = cleanGerman.split(/\s+/).filter(Boolean).map(stripPunctuation).filter(Boolean);

    // Build candidates: correct word + distractors, with safety fallbacks
    const candidates = words.map((word: string, i: number) => {
      let dists: string[] = (item.distractors?.[i] || [])
        .map(stripPunctuation)
        .filter((d: string) => d && d !== word); // remove empty and duplicates of the correct word

      // Pad to 5 if AI returned fewer
      while (dists.length < 5) dists.push(`${word}x${dists.length + 1}`);
      dists = dists.slice(0, 5);
      
      return shuffle([word, ...dists]);
    });

    return {
      english: item.english,
      german: cleanGerman,
      topic,
      words,
      candidates
    };
  });
}

export async function validateTranslation(topic: string, english: string, userGerman: string, expectedGerman: string): Promise<ValidationResult> {
  // Strip punctuation — the UI doesn't support punctuation input,
  // so the validator must never penalise missing commas, periods, etc.
  const stripPunct = (s: string) => s.replace(/[.,!?;:"""''`…–—]/g, '').replace(/\s+/g, ' ').trim();
  const cleanExpected = stripPunct(expectedGerman);
  const cleanUser = stripPunct(userGerman);

  // Short-circuit: if the words match exactly (ignoring punctuation & case), it's
  // definitively correct — skip the AI call entirely so it can't hallucinate
  // punctuation errors the user had no way to enter.

  const isExactMatch = cleanUser.toLowerCase() === cleanExpected.toLowerCase();

  if (isExactMatch) {
    return {
      isCorrect: true,
      correction: expectedGerman,
      explanation: '',
      highlightedErrors: [],
    };
  }

  const prompt = `
    Analyze the user's translation.
    Compare the user's answer against the expected translation. The user must use the same words as the expected translation. Ignore ALL punctuation and capitalization — do NOT mark missing commas, periods, or any punctuation as errors. Do NOT accept alternative translations that use different words.
    1. Is it correct? (Ignore punctuation and capitalization entirely — only check words and grammar).
    2. Explain the grammar rule applied here.
    4. Highlight specific errors (word by word if possible). Do NOT include punctuation-related errors.

    Topic: ${topic}
    English Sentence: "${english}"
    Expected German Translation: "${cleanExpected}"
    User's German Translation: "${userGerman}"
  `;

  const response = await callWithRetry(() => getAI().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING },
          highlightedErrors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                error: { type: Type.STRING }
              }
            }
          }
        },
        required: ["isCorrect", "explanation", "highlightedErrors"]
      }
    }
  }));

  const result: ValidationResult = JSON.parse(response.text || "{}");

  const grammarErrors = result.highlightedErrors.filter(err => {
    if (!err.error) return false;
    const msg = err.error.toLowerCase();
    return !/\b(comma|period|full stop|punctuation|komma|punkt|satzzeichen|interpunktion)\b/.test(msg);
  })

  return {
    highlightedErrors: grammarErrors,
    isCorrect: result.isCorrect || grammarErrors.length === 0, // If AI marked it incorrect but there are no grammar errors (only punctuation), treat as correct
    correction: expectedGerman,
    explanation: result.explanation || "No explanation provided.",
    transcription: result.transcription || undefined,
  }
}

export async function listAvailableModels(): Promise<string[]> {
  const ai = getAI();
  const pager = await ai.models.list({ config: { pageSize: 100 } });
  const models: string[] = [];
  for (const model of pager.page) {
    if (model.name) {
      // Strip "models/" prefix if present
      const id = model.name.replace(/^models\//, '');
      models.push(id);
    }
  }
  models.sort();
  return models;
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const response = await callWithRetry(() => getAI().models.generateContent({
    model: getModel(),
    contents: [
      { text: "Transcribe the German speech in this audio. Only return the transcription text." },
      { inlineData: { data: audioBase64, mimeType: "audio/webm" } }
    ]
  }));
  return response.text || "";
}
