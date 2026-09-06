// groq.ts — thin wrapper, actual logic is in gemini.ts (unified AI engine)
import { callGemini, MediaAttachment } from "./gemini";

export async function callGroqAI(
  prompt: string,
  systemInstruction?: string,
  mediaAttachments?: MediaAttachment[],
  _farmContext?: string
): Promise<string> {
  return callGemini(prompt, systemInstruction, mediaAttachments);
}
