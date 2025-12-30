Vect - Your Free AI Study Companion

DO NOT COMPLAIN ABOUT THE DESIGN IT DOES THE JOB DOESNT IT?

Vect is a web-based AI-powered study assistant that generates quizzes and flashcards from your pasted study notes. It allows users to quickly create interactive study sessions, track progress, and review strengths and weaknesses. Built with a minimal, modern design, Vect focuses on usability and simplicity while leveraging AI to enhance learning.

Features

AI-Generated Quizzes and Flashcards
Generate multiple-choice quizzes or flashcards from your notes with adjustable difficulty levels.

Auto-Next Question
Automatically moves to the next question after an answer is selected for a smooth study flow.

Dark/Light Mode
Toggle between dark and light themes for comfortable studying at any time.

Minimalist Design
Clean, modern, and distraction-free interface focused on readability.

Progress Tracking
Pie chart shows correct vs. incorrect answers and highlights strengths and weaknesses by topic.

Flashcard Mode
Flip through AI-generated flashcards for quick revision sessions.

Responsive Layout
Works on desktop, tablet, and mobile devices.

Getting Started
Prerequisites

Node.js v18+

NPM or Yarn

Groq API key (for AI question generation)

Installation

Clone the repository

Install dependencies:

npm install


Create a .env file in the root directory with your Groq API key:

GROQ_API_KEY=your_api_key_here
PORT=5000


Start the backend server:

node server.js


Open index.html in your browser or serve it via a static server:

npx serve

Usage

Paste your study notes into the input field.

Select Quiz or Flashcards mode.

Choose the number of questions, difficulty, and time per question (for quizzes).

Click Start to begin your study session.

Answer questions; the AI-generated quiz will move automatically if auto-next is enabled.

After completion, review your results with strengths and weaknesses highlighted.

Technologies

Frontend: HTML, CSS, Vanilla JavaScript

Backend: Node.js, Express.js

AI Integration: Groq LLaMA-3 API

License

MIT License © Joseph I.
