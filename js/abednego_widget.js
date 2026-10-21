// js/abednego_widget.js - Abednego (አብደናጎ) Floating Web Assistant

document.addEventListener('DOMContentLoaded', () => {
  // 1. Create Floating Button & Chat Box HTML dynamically
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'abednego-widget-container';
  widgetContainer.innerHTML = `
    <!-- Floating Toggle Button -->
    <button id="abednego-chat-toggle" class="fixed bottom-5 right-5 bg-blue-700 hover:bg-blue-800 text-white rounded-full p-4 shadow-xl flex items-center gap-2 z-50 transition-all duration-300">
      <span class="text-xl">💬</span>
      <span class="font-bold text-sm hidden md:inline">አብደናጎ (Abednego AI)</span>
    </button>

    <!-- Chat Window Modal -->
    <div id="abednego-chat-box" class="fixed bottom-20 right-5 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 hidden flex-col z-50 overflow-hidden transition-all duration-300 max-h-[500px]">
      <!-- Header -->
      <div class="bg-blue-800 text-white p-4 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-base flex items-center gap-2">
            <span>✨</span> አብደናጎ (Abednego AI)
          </h3>
          <p class="text-xs text-blue-200">ACE-USF Digital Assistant</p>
        </div>
        <button id="abednego-close-btn" class="text-gray-200 hover:text-white text-xl font-bold">&times;</button>
      </div>

      <!-- Messages Display Area -->
      <div id="abednego-messages" class="p-4 overflow-y-auto flex-1 space-y-3 text-sm max-h-[340px]">
        <div class="bg-blue-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-3 rounded-lg max-w-[85%]">
          በጌታ በኢየሱስ ስም ሰላም! 👋<br>I am <b>Abednego (አብደናጎ)</b>. How can I assist you with campus fellowship contacts, advice, or meeting details today?
        </div>
      </div>

      <!-- Input Bar -->
      <form id="abednego-form" class="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-900">
        <input type="text" id="abednego-input" placeholder="Ask Abednego / አብደናጎን ጠይቅ..." class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-600" required />
        <button type="submit" class="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition">
          Send
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 2. DOM Elements & Toggle Handlers
  const toggleBtn = document.getElementById('abednego-chat-toggle');
  const closeBtn = document.getElementById('abednego-close-btn');
  const chatBox = document.getElementById('abednego-chat-box');
  const chatForm = document.getElementById('abednego-form');
  const chatInput = document.getElementById('abednego-input');
  const messagesContainer = document.getElementById('abednego-messages');

  toggleBtn.addEventListener('click', () => chatBox.classList.toggle('hidden'));
  closeBtn.addEventListener('click', () => chatBox.classList.add('hidden'));

  // 3. Handle Message Submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;

    // Append User Message
    appendMessage(userText, 'user');
    chatInput.value = '';

    // Append Loading Indicator
    const loadingId = appendMessage("አብደናጎ በማሰብ ላይ ነው... (Thinking...)", 'ai', true);

    try {
      const response = await fetch('/api/abednego_web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();
      removeLoading(loadingId);

      if (data.reply) {
        appendMessage(data.reply, 'ai');
      } else {
        appendMessage("ይቅርታ፣ መልስ ለማዘጋጀት አልተቻለም።", 'ai');
      }
    } catch (err) {
      removeLoading(loadingId);
      appendMessage("ግንኙነት አልተሳካም። እባክዎን ደግመው ይሞክሩ።", 'ai');
    }
  });

  function appendMessage(text, sender, isLoading = false) {
    const msgDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now();
    msgDiv.id = msgId;

    if (sender === 'user') {
      msgDiv.className = 'bg-blue-700 text-white p-3 rounded-lg max-w-[85%] ml-auto text-right';
    } else {
      msgDiv.className = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 p-3 rounded-lg max-w-[85%]';
    }

    if (isLoading) msgDiv.classList.add('animate-pulse', 'italic');

    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgId;
  }

  function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
});