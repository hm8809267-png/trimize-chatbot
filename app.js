let knowledgeBase = {};
let lastQuestion = '';

// حمل الداتا من JSON
fetch('data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    knowledgeBase = data;

    addMessage(
      'bot',
      'أهلاً بيك في تريمايز! 👋\n\n' +
      'أنا مساعد تريمايز الذكي، أقدر أساعدك في:\n' +
      '• منتجات T1 والعناية الشخصية للرجال\n' +
      '• الأسعار والباندلز\n' +
      '• وسائل الدفع\n' +
      '• الشحن والتوصيل\n' +
      '• طريقة عمل الأوردر\n' +
      '• الأسئلة الشائعة\n\n' +
      'قولي محتاج تعرف إيه وأنا هساعدك.'
    );
  })
  .catch(error => {
    console.error('Error loading data.json:', error);

    addMessage(
      'bot',
      '❌ حدث خطأ في تحميل البيانات.\n\n' +
      'جرب تاني أو تواصل معنا: 01034472705'
    );
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
      addMessage(
        'bot',
        'عذراً، مش قادر أجاوب على السؤال ده. 😕\n\n' +
        'عايز أسيب بياناتك لفريق الدعم يساعدك؟\n' +
        '<button class="escalate-btn" onclick="openModal()">📩 نعم، تواصل معي</button>'
      );
    }
  }, 600);
}


/*
  البحث داخل data.json

  ملف data.json الحالي عبارة عن:

  {
    "greetings": {...},
    "prices": {...},
    "payment": {...},
    "order": {...}
  }

  لذلك نستخدم Object.values بدل knowledgeBase.intents
*/
function findAnswer(q) {

  q = q.toLowerCase().trim();

  const sections = Object.values(knowledgeBase);

  for (const intent of sections) {

    if (!intent || !Array.isArray(intent.keywords)) {
      continue;
    }

    for (const keyword of intent.keywords) {

      if (!keyword) continue;

      if (q.includes(keyword.toLowerCase())) {
        return intent.response;
      }

    }
  }

  return null;
}


input.addEventListener('keypress', (e) => {

  if (e.key === 'Enter') {
    sendMessage();
  }

});


// =========================
// Modal functions
// =========================

function openModal() {

  document.getElementById('escalationModal').style.display = 'flex';

}


function closeModal() {

  document.getElementById('escalationModal').style.display = 'none';

}


// =========================
// Formspree submission
// =========================

const form = document.getElementById('escalationForm');


if (form) {

  form.onsubmit = async (e) => {

    e.preventDefault();

    const formData = new FormData(form);

    formData.append('original_question', lastQuestion);

    /*
      مهم:
      استبدل YOUR_FORM_ID بالـ ID الحقيقي من Formspree
    */

    const response = await fetch(
      'https://formspree.io/f/YOUR_FORM_ID',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (response.ok) {

      closeModal();

      addMessage(
        'bot',
        '✅ تم إرسال بياناتك بنجاح!\n\n' +
        'فريق الدعم هيتواصل معك قريب.'
      );

      form.reset();

    } else {

      alert('حدث خطأ، حاول مرة أخرى.');

    }

  };

}
