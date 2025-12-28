let questions = [];
let currentIndex = 0;
let correctCount = 0;
let userAnswers = [];
let mode = 'quiz';
let isFlashcardRevealed = false;

function toggleTheme() {
  const body = document.body;
  if(body.classList.contains('light-mode')){
    body.classList.remove('light-mode'); 
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode'); 
    body.classList.add('light-mode');
  }
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

  if(!notes) {
    errorEl.textContent = '⚠️ Please enter your study notes';
    return;
  }

  if(!numQuestions || numQuestions < 1 || numQuestions > 20) {
    errorEl.textContent = '⚠️ Please enter a number between 1 and 20';
    return;
  }

  loadingEl.style.display = 'block';

  try {
    const res = await fetch('https://vect-backendd.onrender.com/api/generate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({notes, mode, difficulty, numQuestions})
    });
    
    const data = await res.json();
    loadingEl.style.display = 'none';

    if(res.status !== 200){ 
      errorEl.textContent = '❌ ' + (data.error || 'Failed to generate content'); 
      return; 
    }

    if(!Array.isArray(data) || data.length === 0) {
      errorEl.textContent = '⚠️ No questions generated. Try different notes.';
      return;
    }

    questions = data;
    currentIndex = 0; 
    correctCount = 0;
    userAnswers = [];
    isFlashcardRevealed = false;
    
    document.getElementById('start-container').style.display='none';
    document.getElementById('quiz-container').style.display='block';
    showQuestion();
  } catch(err) {
    loadingEl.style.display = 'none';
    errorEl.textContent='❌ Failed to connect to server. Is it running on port 5000?';
    console.error('Error:', err);
  }
}

function showQuestion() {
  if(currentIndex >= questions.length){
    showResults(); 
    return;
  }

  const q = questions[currentIndex];
  const card = document.getElementById('question-card');
  card.innerHTML = '';
  isFlashcardRevealed = false;

  const header = document.createElement('div');
  header.className = 'question-header';
  const qNum = document.createElement('div');
  qNum.className = 'question-number';
  qNum.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  header.appendChild(qNum);
  card.appendChild(header);

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = q.question || q.front || '';
  card.appendChild(qText);

  if(mode === 'quiz' && q.options && Array.isArray(q.options)) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => selectAnswer(opt, q.answer);
      optionsDiv.appendChild(btn);
    });
    
    card.appendChild(optionsDiv);
  } 
  else if(mode === 'flashcards' && q.back) {
    const revealBtn = document.createElement('button');
    revealBtn.textContent = 'Reveal Answer';
    revealBtn.onclick = () => revealFlashcard(q.back);
    card.appendChild(revealBtn);
  }
}

function selectAnswer(selected, correct) {
  const isCorrect = selected === correct;
  if(isCorrect) correctCount++;
  userAnswers.push({
    question: questions[currentIndex].question,
    selected,
    correct,
    isCorrect
  });

  currentIndex++;
  setTimeout(showQuestion, 300);
}

function revealFlashcard(answer) {
  if(isFlashcardRevealed) return;
  isFlashcardRevealed = true;

  const card = document.getElementById('question-card');

  const answerDiv = document.createElement('div');
  answerDiv.className = 'flashcard-back';
  answerDiv.innerHTML = `<strong>Answer:</strong><br>${answer}`;
  card.appendChild(answerDiv);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = currentIndex < questions.length - 1 ? 'Next Flashcard →' : 'Finish';
  nextBtn.onclick = () => {
    currentIndex++;
    showQuestion();
  };
  card.appendChild(nextBtn);
}

function showResults() {
  document.getElementById('quiz-container').style.display='none';
  document.getElementById('result-container').style.display='block';

  if(mode === 'quiz') {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const summary = document.getElementById('score-summary');
    summary.innerHTML = `
      <div>You scored</div>
      <strong>${correctCount} / ${questions.length}</strong>
      <div>${percentage}% Correct</div>
    `;

    const ctx = document.getElementById('resultChart').getContext('2d');
    new Chart(ctx, {
      type:'pie',
      data:{
        labels:['Correct', 'Incorrect'],
        datasets:[{
          data:[correctCount, questions.length - correctCount],
          backgroundColor:['#ff3b3f', '#cccccc'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options:{
        responsive: true,
        plugins:{
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 14 },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } else {
    document.getElementById('score-summary').innerHTML = `
      <div>You reviewed</div>
      <strong>${questions.length}</strong>
      <div>Flashcards</div>
    `;
    document.querySelector('.pie-container').style.display = 'none';
  }
}

function restartQuiz() {
  document.getElementById('result-container').style.display='none';
  document.getElementById('start-container').style.display='block';
  document.getElementById('notes').value = '';
  document.getElementById('error').textContent = '';
  document.querySelector('.pie-container').style.display = 'block';
  questions = [];
  currentIndex = 0;
  correctCount = 0;
  userAnswers = [];
}
