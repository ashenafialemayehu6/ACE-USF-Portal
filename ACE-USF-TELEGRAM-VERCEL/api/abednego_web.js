import { GoogleGenAI } from '@google/genai';
import { ABEDNEGO_SYSTEM_INSTRUCTION } from './abednego_prompt.js';

const ai = new GoogleGenAI(); // Securely reads GEMINI_API_KEY from Vercel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: ABEDNEGO_SYSTEM_INSTRUCTION,
        temperature: 0.3
      }
    });

    return res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Abednego Web API Error:", error);
    return res.status(500).json({ error: 'Could not communicate with Abednego.' });
  }
}