let knowledgeBase = {};
let lastQuestion = '';

// حمل الداتا من JSON
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    knowledgeBase = data;
    addMessage('bot', 'أهلاً بك في تريمايز! 👋\n\nأنا هنا أساعدك في:\n• منتجاتنا (ماكينة T1، العناية الشخصية)\n• الشحن والتوصيل\n• الأسئلة الشائعة\n\nاسألني أي حاجة!');
  });

const messagesDiv = document.getElementById('messages');
const input = document.getElementById('userInput');

function addMessage(sender, text) {
  const div = document.createElement('div');
  div.className = `message ${sender}-msg`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = '';
  lastQuestion = text;
  
  setTimeout(() => {
    const answer = findAnswer(text);
    if (answer) {
      addMessage('bot', answer);
    } else {
      addMessage('bot', 'عذراً، مش قادر أجاوب على السؤال ده. 😕<br><br>عايز أسيب بياناتك لفريق الدعم يساعدك؟<br><button class="escalate-btn" onclick="openModal()">📩 نعم، تواصل معي</button>');
    }
  }, 600);
}

function findAnswer(q) {
  q = q.toLowerCase();
  for (const intent of knowledgeBase.intents) {
    for (const keyword of intent.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        return intent.response;
      }
    }
  }
  return null;
}

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Modal functions
function openModal() {
  document.getElementById('escalationModal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('escalationModal').style.display = 'none';
}

// Formspree submission
const form = document.getElementById('escalationForm');
form.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  formData.append('original_question', lastQuestion);
  
  // 🔴 استبدل YOUR_FORM_ID باللي هتجيبه من Formspree
  const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  });
  
  if (response.ok) {
    closeModal();
    addMessage('bot', '✅ تم إرسال بياناتك بنجاح! فريق الدعم هيتواصل معك قريب.');
    form.reset();
  } else {
    alert('حدث خطأ، حاول مرة أخرى.');
  }
};
