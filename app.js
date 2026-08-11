let knowledgeBase = {};
let lastQuestion = '';

const messagesDiv = document.getElementById('messages');
const input = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');


/* =========================
   Security
========================= */

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}


/* =========================
   Add Message
========================= */

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


/* =========================
   Loading
========================= */

function setLoading(show) {
  if (loading) {
    loading.style.display = show ? 'block' : 'none';
  }
  if (sendButton) {
    sendButton.disabled = show;
  }
  if (input) {
    input.disabled = show;
  }
}


/* =========================
   Arabic Normalization
========================= */

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


/* =========================
   Send Quick Choice as User Message
========================= */

function sendChoice(text) {
  if (input) {
    input.value = text;
  }
  sendMessage();
}

window.sendChoice = sendChoice;


/* =========================
   Load JSON
========================= */

async function loadKnowledgeBase() {
  try {
    const response = await fetch('./data.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`data.json returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('data.json must contain a JSON object.');
    }

    knowledgeBase = data;

    // رسالة الترحيب الأولى مع الأزرار التفاعلية
    const welcomeHtml = 
      'أهلاً بيك في تريمايز! أنا مساعدك الذكي معاك لأي مساعدة أو استفسار.\n\n' +
      'اختر أحد الأسئلة الشائعة التالية أو اكتب سؤالك:\n\n' +
      '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">' +
        '<button class="choice-btn" onclick="sendChoice(\'ما هي أسعار ماكينة T1 ومنتجات العناية؟\')">💰 أسعار المنتجات والباندلز</button>' +
        '<button class="choice-btn" onclick="sendChoice(\'ما هي تفاصيل الشحن والتوصيل؟\')">🚚 تفاصيل الشحن والتوصيل</button>' +
        '<button class="choice-btn" onclick="sendChoice(\'ما هي وسائل الدفع المتاحة؟\')">💳 وسائل الدفع المتاحة</button>' +
        '<button class="choice-btn" onclick="sendChoice(\'كيفية استخدام ماكينة T1؟\')">📖 طريقة استخدام ماكينة T1</button>' +
      '</div>';

    addMessage('bot', welcomeHtml, true);

  } catch (error) {
    console.error('Error loading data.json:', error);

    addMessage(
      'bot',
      '❌ حدث خطأ في تحميل البيانات.\n\n' +
      'تأكد إن ملف data.json موجود في نفس مجلد الموقع وبصيغة JSON صحيحة.\n\n' +
      'لو المشكلة مستمرة تواصل معنا: 01034472705'
    );
  }
}


/* =========================
   Find Answer
========================= */

function findAnswer(question) {
  const normalizedQuestion = normalizeArabic(question);

  const sections = Object.values(knowledgeBase).filter(section =>
    section &&
    Array.isArray(section.keywords) &&
    typeof section.response === 'string'
  );

  const matches = [];

  for (const section of sections) {
    for (const keyword of section.keywords) {
      const normalizedKeyword = normalizeArabic(keyword);

      if (!normalizedKeyword) {
        continue;
      }

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


/* =========================
   Send Message
========================= */

function sendMessage() {
  if (!input || !input.value.trim() || !Object.keys(knowledgeBase).length) {
    return;
  }

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
        'عذراً، مش قادر أجاوب على السؤال ده. 😕\n\n' +
        'عايز تسيب بياناتك لفريق الدعم يساعدك؟\n\n' +
        '<button class="escalate-btn" onclick="openModal()">' +
        '📩 نعم، تواصل معي' +
        '</button>',
        true
      );
    }

    setLoading(false);
    input.focus();
  }, 500);
}


/* =========================
   Modal
========================= */

function openModal() {
  const modal = document.getElementById('escalationModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal() {
  const modal = document.getElementById('escalationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

window.openModal = openModal;
window.closeModal = closeModal;


/* =========================
   Formspree
========================= */

const form = document.getElementById('escalationForm');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    formData.append('original_question', lastQuestion);

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'جاري الإرسال...';
    }

    try {
      const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Form submission failed.');
      }

      closeModal();

      addMessage(
        'bot',
        '✅ تم إرسال بياناتك بنجاح!\n\n' +
        'فريق الدعم هيتواصل معك قريب.'
      );

      form.reset();

    } catch (error) {
      console.error('Formspree error:', error);
      alert('حدث خطأ أثناء إرسال البيانات. تأكد من Form ID وحاول مرة أخرى.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'إرسال';
      }
    }
  });
}


/* =========================
   Close Modal on Background
========================= */

document.addEventListener('click', (event) => {
  const modal = document.getElementById('escalationModal');
  if (modal && event.target === modal) {
    closeModal();
  }
});


/* =========================
   Enter Key
========================= */

if (input) {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
}


/* =========================
   Send Button
========================= */

if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}


/* =========================
   Start
========================= */

loadKnowledgeBase();
