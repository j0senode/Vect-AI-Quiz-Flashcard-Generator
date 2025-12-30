let questions = [];
let currentIndex = 0;
let correctCount = 0;
let userAnswers = [];
let mode = 'quiz';
let isFlashcardRevealed = false;
let reviewIndex = 0;

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
    errorEl.textContent='❌ Failed to connect to server.';
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
      btn.onclick = () => selectAnswer(opt, q.answer, q.question);
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

function selectAnswer(selected, correct, question) {
  const isCorrect = selected === correct;
  if(isCorrect) correctCount++;
  userAnswers.push({
    question: question,
    selected: selected,
    correct: correct,
    isCorrect: isCorrect
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

  const resultContainer = document.getElementById('result-container');
  resultContainer.innerHTML = '';

  if(mode === 'quiz') {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const incorrectAnswers = userAnswers.filter(a => !a.isCorrect);

    resultContainer.innerHTML = `
      <h2 style="font-size:2rem; margin-bottom:20px;">Quiz Complete! 🎉</h2>
      <div class="score-summary" style="text-align:center; margin:30px 0; font-size:1.2rem;">
        <div>You scored</div>
        <strong style="font-size:2rem; display:block; margin:10px 0;">${correctCount} / ${questions.length}</strong>
        <div>${percentage}% Correct</div>
      </div>
      <div class="pie-container" style="max-width:400px; margin:30px auto;">
        <canvas id="resultChart"></canvas>
      </div>
    `;

    // Render pie chart
    setTimeout(() => {
      const ctx = document.getElementById('resultChart').getContext('2d');
      new Chart(ctx, {
        type:'doughnut',
        data:{
          labels:['Correct', 'Incorrect'],
          datasets:[{
            data:[correctCount, questions.length - correctCount],
            backgroundColor:['#22c55e', '#ef4444'],
            borderWidth: 3,
            borderColor: '#fff'
          }]
        },
        options:{
          responsive: true,
          cutout: '70%',
          plugins:{
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: { size: 14, weight: '600' },
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
    }, 100);

    // Detailed review section
    const reviewSection = document.createElement('div');
    reviewSection.style.marginTop = '50px';
    reviewSection.style.textAlign = 'left';
    
    reviewSection.innerHTML = `<h3 style="font-size:1.8rem; margin-bottom:20px; font-weight:600;">📝 Review Your Answers</h3>`;

    // All answers
    const answersContainer = document.createElement('div');
    answersContainer.style.display = 'flex';
    answersContainer.style.flexDirection = 'column';
    answersContainer.style.gap = '15px';

    userAnswers.forEach((answer, index) => {
      const answerCard = document.createElement('div');
      answerCard.style.padding = '20px';
      answerCard.style.borderRadius = '12px';
      answerCard.style.border = answer.isCorrect ? '2px solid #22c55e' : '2px solid #ef4444';
      answerCard.style.backgroundColor = answer.isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      
      answerCard.innerHTML = `
        <div style="display:flex; align-items:start; gap:10px; margin-bottom:10px;">
          <span style="font-size:1.5rem;">${answer.isCorrect ? '✅' : '❌'}</span>
          <div style="flex:1;">
            <div style="font-weight:600; margin-bottom:8px; font-size:1.1rem;">
              ${index + 1}. ${answer.question}
            </div>
            <div style="font-size:0.95rem;">
              <div style="margin-bottom:5px;">
                <strong style="color:${answer.isCorrect ? '#22c55e' : '#ef4444'};">Your answer:</strong> 
                ${answer.selected}
              </div>
              ${!answer.isCorrect ? `
                <div>
                  <strong style="color:#22c55e;">Correct answer:</strong> 
                  ${answer.correct}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      answersContainer.appendChild(answerCard);
    });

    reviewSection.appendChild(answersContainer);

    // Areas to focus on
    if (incorrectAnswers.length > 0) {
      const focusSection = document.createElement('div');
      focusSection.style.marginTop = '30px';
      focusSection.style.padding = '25px';
      focusSection.style.borderRadius = '12px';
      focusSection.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
      focusSection.style.border = '2px solid #fbbf24';
      
      focusSection.innerHTML = `
        <h4 style="font-size:1.4rem; font-weight:600; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
          <span>💡</span>
          <span>Areas to Focus On</span>
        </h4>
        <p style="margin-bottom:15px; font-size:1rem;">
          You got ${incorrectAnswers.length} question${incorrectAnswers.length > 1 ? 's' : ''} wrong. 
          Review these topics from your notes:
        </p>
        <ul style="list-style:none; padding:0;">
          ${incorrectAnswers.map(a => `
            <li style="margin-bottom:10px; display:flex; gap:8px;">
              <span>•</span>
              <span>${a.question}</span>
            </li>
          `).join('')}
        </ul>
        <p style="margin-top:15px; font-size:0.9rem; font-style:italic;">
          💪 Tip: Review these specific concepts in your study notes and try the quiz again!
        </p>
      `;
      reviewSection.appendChild(focusSection);

      // Review Incorrect Answers Button
      const reviewBtn = document.createElement('button');
      reviewBtn.textContent = '🔄 Review Incorrect Answers';
      reviewBtn.style.width = '100%';
      reviewBtn.style.padding = '16px';
      reviewBtn.style.marginTop = '20px';
      reviewBtn.style.fontSize = '1.1rem';
      reviewBtn.style.fontWeight = '600';
      reviewBtn.style.border = 'none';
      reviewBtn.style.borderRadius = '8px';
      reviewBtn.style.cursor = 'pointer';
      reviewBtn.style.transition = '0.2s';
      
      if(document.body.classList.contains('light-mode')) {
        reviewBtn.style.background = '#fbbf24';
        reviewBtn.style.color = '#000';
      } else {
        reviewBtn.style.background = '#fbbf24';
        reviewBtn.style.color = '#000';
      }
      
      reviewBtn.onclick = () => startReviewMode();
      focusSection.appendChild(reviewBtn);
    } else {
      const perfectSection = document.createElement('div');
      perfectSection.style.marginTop = '30px';
      perfectSection.style.padding = '25px';
      perfectSection.style.borderRadius = '12px';
      perfectSection.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      perfectSection.style.border = '2px solid #22c55e';
      perfectSection.style.textAlign = 'center';
      
      perfectSection.innerHTML = `
        <div style="font-size:3rem; margin-bottom:10px;">🎉</div>
        <h4 style="font-size:1.4rem; font-weight:600; margin-bottom:10px;">Perfect Score!</h4>
        <p style="font-size:1rem;">
          You've mastered this material! Keep up the excellent work!
        </p>
      `;
      reviewSection.appendChild(perfectSection);
    }

    resultContainer.appendChild(reviewSection);

    // Restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Start New Quiz';
    restartBtn.style.width = '100%';
    restartBtn.style.padding = '16px';
    restartBtn.style.marginTop = '30px';
    restartBtn.style.fontSize = '1.1rem';
    restartBtn.style.fontWeight = '600';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '8px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.transition = '0.2s';
    
    if(document.body.classList.contains('light-mode')) {
      restartBtn.style.background = '#000';
      restartBtn.style.color = '#fff';
    } else {
      restartBtn.style.background = '#fff';
      restartBtn.style.color = '#000';
    }
    
    restartBtn.onclick = restartQuiz;
    resultContainer.appendChild(restartBtn);

  } else {
    resultContainer.innerHTML = `
      <h2 style="font-size:2rem; margin-bottom:20px;">Flashcards Complete! 🎉</h2>
      <div class="score-summary" style="text-align:center; margin:30px 0; font-size:1.2rem;">
        <div>You reviewed</div>
        <strong style="font-size:2rem; display:block; margin:10px 0;">${questions.length}</strong>
        <div>Flashcards</div>
      </div>
    `;

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Start New Quiz';
    restartBtn.onclick = restartQuiz;
    resultContainer.appendChild(restartBtn);
  }
}

function startReviewMode() {
  reviewIndex = 0;
  const incorrectAnswers = userAnswers.filter(a => !a.isCorrect);
  
  if (incorrectAnswers.length === 0) return;

  document.getElementById('result-container').style.display='none';
  document.getElementById('quiz-container').style.display='block';
  
  showReviewQuestion(incorrectAnswers);
}

function showReviewQuestion(incorrectAnswers) {
  if (reviewIndex >= incorrectAnswers.length) {
    showResults();
    return;
  }

  const answer = incorrectAnswers[reviewIndex];
  const card = document.getElementById('question-card');
  card.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'question-header';
  header.innerHTML = `
    <div class="question-number">Review ${reviewIndex + 1} of ${incorrectAnswers.length}</div>
    <div style="font-size:0.9rem; opacity:0.7;">❌ Incorrect Answer</div>
  `;
  card.appendChild(header);

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = answer.question;
  card.appendChild(qText);

  const reviewInfo = document.createElement('div');
  reviewInfo.style.marginTop = '20px';
  reviewInfo.style.padding = '20px';
  reviewInfo.style.borderRadius = '12px';
  reviewInfo.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
  reviewInfo.style.border = '2px solid #ef4444';
  
  reviewInfo.innerHTML = `
    <div style="margin-bottom:15px;">
      <strong style="color:#ef4444;">Your Answer:</strong>
      <div style="margin-top:5px; font-size:1.1rem;">${answer.selected}</div>
    </div>
    <div>
      <strong style="color:#22c55e;">Correct Answer:</strong>
      <div style="margin-top:5px; font-size:1.1rem; font-weight:600;">${answer.correct}</div>
    </div>
  `;
  card.appendChild(reviewInfo);

  const navButtons = document.createElement('div');
  navButtons.style.display = 'flex';
  navButtons.style.gap = '10px';
  navButtons.style.marginTop = '30px';

  if (reviewIndex > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.style.flex = '1';
    prevBtn.onclick = () => {
      reviewIndex--;
      showReviewQuestion(incorrectAnswers);
    };
    navButtons.appendChild(prevBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = reviewIndex < incorrectAnswers.length - 1 ? 'Next →' : 'Back to Results';
  nextBtn.style.flex = '1';
  nextBtn.onclick = () => {
    if (reviewIndex < incorrectAnswers.length - 1) {
      reviewIndex++;
      showReviewQuestion(incorrectAnswers);
    } else {
      showResults();
    }
  };
  navButtons.appendChild(nextBtn);

  card.appendChild(navButtons);
}

function restartQuiz() {
  document.getElementById('result-container').style.display='none';
  document.getElementById('start-container').style.display='block';
  document.getElementById('notes').value = '';
  document.getElementById('error').textContent = '';
  questions = [];
  currentIndex = 0;
  correctCount = 0;
  userAnswers = [];
  reviewIndex = 0;
}
