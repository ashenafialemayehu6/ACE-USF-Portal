import { GoogleGenAI } from '@google/genai';
import { ABEDNEGO_SYSTEM_INSTRUCTION } from './abednego_prompt.js';

const ai = new GoogleGenAI(); // Securely reads process.env.GEMINI_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Abednego Telegram Bot Engine is active.' });
  }

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const userText = message.text.trim();

  // Handle /start command
  if (userText === '/start') {
    const welcomeMessage = `በጌታ በኢየሱስ ስም ሰላም! 👋\n\nI am **Abednego (አብደናጎ)**, your official AI guide for the **ACE-USF Digital Space**.\n\nI am here to serve you with:\n1. 📍 **Campus Contacts:** Finding Apostolic fellowship leaders across 30+ Ethiopian universities.\n2. 💡 **Student Guidance:** Practical academic wisdom and spiritual encouragement in Jesus' Name.\n3. ⛪ **Fellowship Details:** Schedules and gathering locations.\n\nHow can I serve you today? / በምን ልረዳዎ?`;
    await sendTelegramMessage(chatId, welcomeMessage);
    return res.status(200).send('OK');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userText,
      config: {
        systemInstruction: ABEDNEGO_SYSTEM_INSTRUCTION,
        temperature: 0.3
      }
    });

    const reply = response.text || "I apologize, I could not generate a response right now.";
    await sendTelegramMessage(chatId, reply);

  } catch (err) {
    console.error("Abednego Error:", err);
    await sendTelegramMessage(chatId, "ይቅርታ፣ እባክዎን ትንሽ ቆይተው ደግመው ይሞክሩ።");
  }

  return res.status(200).send('OK');
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
  });
}