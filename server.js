let questions = [];
let currentIndex = 0;
let correctCount = 0;
let userAnswers = [];
let mode = 'quiz';
let isFlashcardRevealed = false;
let reviewIndex = 0;

function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-mode');
  body.classList.toggle('dark-mode');
}

async function startSession() {
  const notes = document.getElementById('notes').value.trim();
  mode = document.getElementById('mode').value;
  const difficulty = document.getElementById('difficulty').value;
  const numQuestions = parseInt(document.getElementById('numQuestions').value);

  const errorEl = document.getElementById('error');
  const loadingEl = document.getElementById('loading');
  errorEl.textContent = '';
  loadingEl.style.display = 'none';

  if (!notes) {
    errorEl.textContent = '⚠️ Please enter your study notes';
    return;
  }

  if (!numQuestions || numQuestions < 1 || numQuestions > 20) {
    errorEl.textContent = '⚠️ Please enter a number between 1 and 20';
    return;
  }

  loadingEl.style.display = 'block';

  try {
    const res = await fetch('https://vect-backendd.onrender.com/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, mode, difficulty, numQuestions })
    });

    const data = await res.json();
    loadingEl.style.display = 'none';

    if (res.status !== 200 || !Array.isArray(data)) {
      errorEl.textContent = '❌ Failed to generate questions';
      return;
    }

    questions = data;
    currentIndex = 0;
    correctCount = 0;
    userAnswers = [];
    isFlashcardRevealed = false;

    document.getElementById('start-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuestion();
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.textContent = '❌ Failed to connect to server';
    console.error(err);
  }
}

function showQuestion() {
  const card = document.getElementById('question-card');
  card.innerHTML = '';
  isFlashcardRevealed = false;

  const q = questions[currentIndex];

  const header = document.createElement('div');
  header.className = 'question-header';
  header.innerHTML = `
    <div class="question-number">
      Question ${currentIndex + 1} of ${questions.length}
    </div>
  `;
  card.appendChild(header);

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = q.question || q.front || '';
  card.appendChild(qText);

  if (mode === 'quiz' && q.options) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    const saved = userAnswers[currentIndex]?.selected;

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;

      if (saved === opt) {
        btn.classList.add('selected');
      }

      btn.onclick = () => selectAnswer(opt, q.answer, q.question);
      optionsDiv.appendChild(btn);
    });

    card.appendChild(optionsDiv);
    renderNavButtons(card);
  }

  if (mode === 'flashcards' && q.back) {
    const revealBtn = document.createElement('button');
    revealBtn.textContent = 'Reveal Answer';
    revealBtn.onclick = () => revealFlashcard(q.back);
    card.appendChild(revealBtn);
  }
}

function selectAnswer(selected, correct, question) {
  userAnswers[currentIndex] = {
    question,
    selected,
    correct,
    isCorrect: selected === correct
  };

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.textContent === selected);
  });
}

function renderNavButtons(card) {
  const nav = document.createElement('div');
  nav.className = 'nav-buttons';

  if (currentIndex > 0) {
    const prev = document.createElement('button');
    prev.textContent = '← Previous';
    prev.onclick = () => {
      currentIndex--;
      showQuestion();
    };
    nav.appendChild(prev);
  }

  const next = document.createElement('button');
  next.textContent =
    currentIndex === questions.length - 1 ? 'Submit Quiz' : 'Next →';

  next.onclick = () => {
    if (!userAnswers[currentIndex]) {
      alert('Answer the question first.');
      return;
    }

    if (currentIndex === questions.length - 1) {
      finalizeQuiz();
    } else {
      currentIndex++;
      showQuestion();
    }
  };

  nav.appendChild(next);
  card.appendChild(nav);
}

function finalizeQuiz() {
  correctCount = userAnswers.filter(a => a.isCorrect).length;
  showResults();
}

function revealFlashcard(answer) {
  if (isFlashcardRevealed) return;
  isFlashcardRevealed = true;

  const card = document.getElementById('question-card');
  const answerDiv = document.createElement('div');
  answerDiv.className = 'flashcard-back';
  answerDiv.innerHTML = `<strong>Answer:</strong><br>${answer}`;
  card.appendChild(answerDiv);

  const nextBtn = document.createElement('button');
  nextBtn.textContent =
    currentIndex < questions.length - 1 ? 'Next Flashcard →' : 'Finish';
  nextBtn.onclick = () => {
    currentIndex++;
    showQuestion();
  };
  card.appendChild(nextBtn);
}

function restartQuiz() {
  document.getElementById('result-container').style.display = 'none';
  document.getElementById('start-container').style.display = 'block';
  document.getElementById('notes').value = '';
  questions = [];
  userAnswers = [];
  currentIndex = 0;
  correctCount = 0;
}

