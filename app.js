let knowledgeBase = {};
let lastQuestion = '';

const messagesDiv = document.getElementById('messages');
const input = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function addMessage(sender, text, allowHtml = false) {
  const div = document.createElement('div');
  div.className = `message ${sender}-msg`;
  if (allowHtml) {
    div.innerHTML = String(text).replace(/\n/g, '<br>');
  } else {
    div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  }
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function setLoading(show) {
  if (loading) loading.style.display = show ? 'block' : 'none';
  if (sendButton) sendButton.disabled = show;
  if (input) input.disabled = show;
}

function normalizeArabic(text) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْـ]/g, '');
}

async function loadKnowledgeBase() {
  try {
    const response = await fetch('./data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    knowledgeBase = data;

    addMessage(
      'bot',
      'أهلاً بيك! أنا مساعد تريمايز الذكي 👋\n\nأقدر أساعدك في:\n• منتجات T1 والعناية الشخصية\n• الأسعار والباندلز\n• وسائل الدفع والشحن\n\nقولي محتاج تعرف إيه وأنا هساعدك.'
    );
  } catch (error) {
    console.error('Error loading data.json:', error);
    addMessage('bot', '❌ حدث خطأ في تحميل البيانات. تأكد من وجود ملف data.json.');
  }
}

function findAnswer(question) {
  const normalizedQuestion = normalizeArabic(question);
  const sections = Object.values(knowledgeBase).filter(s => s && Array.isArray(s.keywords) && typeof s.response === 'string');

  const matches = [];
  for (const section of sections) {
    for (const keyword of section.keywords) {
      const normalizedKeyword = normalizeArabic(keyword);
      if (!normalizedKeyword) continue;

      if (normalizedQuestion.includes(normalizedKeyword)) {
        matches.push({
          keywordLength: normalizedKeyword.length,
          response: section.response
        });
      }
    }
  }

  matches.sort((a, b) => b.keywordLength - a.keywordLength);
  return matches.length ? matches[0].response : null;
}

function sendMessage() {
  if (!input || !input.value.trim() || !Object.keys(knowledgeBase).length) return;

  const text = input.value.trim();
  addMessage('user', text);
  input.value = '';
  lastQuestion = text;

  setLoading(true);

  setTimeout(() => {
    const answer = findAnswer(text);
    if (answer) {
      addMessage('bot', answer, true);
    } else {
      addMessage(
        'bot',
        'عذراً، مش قادر أجاوب على السؤال ده. 😕\n\nعايز تسيب بياناتك لفريق الدعم يساعدك؟\n\n<button class="escalate-btn" onclick="openModal()">📩 نعم، تواصل معي</button>',
        true
      );
    }
    setLoading(false);
    input.focus();
  }, 500);
}

function openModal() {
  const modal = document.getElementById('escalationModal');
  if (modal) modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('escalationModal');
  if (modal) modal.style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;

// Event Listeners
if (input) {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
}

if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}

// Start
loadKnowledgeBase();
