const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://127.0.0.1:5000'
    : window.location.origin;
let questions = [];  
let defaultTime = 30;

const sounds = {
    correct: new Audio("sounds/correct.mp3"),
    wrong: new Audio("sounds/wrong.mp3"),
    click: new Audio("sounds/click.mp3"),
    warning: new Audio("sounds/warning.mp3"),
    win: new Audio("sounds/win.mp3"),
    lose: new Audio("sounds/lose.mp3")
};

let current = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let unansweredCount = 0;
let time;
let timer;


const qEl = document.getElementById("question");
const optEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const resultBox = document.getElementById("result");
const finalScore = document.getElementById("final-score");
const feedback = document.getElementById("feedback");


function loadQuestion() {
    clearInterval(timer);
    time = defaultTime;
    timerEl.classList.remove("warning");
    
    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.classList.add("hidden");

    const q = questions[current];
    qEl.textContent = q.question;
    optEl.innerHTML = "";

    startTimer();

    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt.text;

        btn.onclick = () => handleAnswer(btn, opt.isCorrect);

        optEl.appendChild(btn);
    });
}


function handleAnswer(btn, isCorrect) {
    clearInterval(timer);
    sounds.click.play().catch(e => console.log('Sound error:', e));

    const buttons = document.querySelectorAll(".option-btn");
    const correctOpt = questions[current].options.find(o => o.isCorrect);

    buttons.forEach(b => {
        b.disabled = true;
        if (b.textContent === correctOpt.text) {
            b.classList.add("correct");
        }
    });

    if (isCorrect) {
        score++;
        correctCount++;
        sounds.correct.play().catch(e => console.log('Sound error:', e));
    } else {
        wrongCount++;
        btn.classList.add("wrong");
        sounds.wrong.play().catch(e => console.log('Sound error:', e));
    }

    scoreEl.textContent = "Score: " + score;

    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.classList.remove("hidden");
}


function nextQuestion() {
    current++;
    if (current < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}


function startTimer() {
    timer = setInterval(() => {
        time--;
        timerEl.textContent = time + "s";

        if (time <= 10) {
            timerEl.classList.add("warning");
            if (time === 10) {
                sounds.warning.play().catch(e => console.log(e)); // Catch to avoid DOMException if page hasn't been interacted with
            }
        }

        if (time <= 0) {
            clearInterval(timer);
            unansweredCount++;
            const buttons = document.querySelectorAll(".option-btn");
            buttons.forEach(b => b.disabled = true);
            const nextBtn = document.getElementById("next-btn");
            if (nextBtn) nextBtn.classList.remove("hidden");
        }
    }, 1000);
}
 
 
async function showResult() {
    document.getElementById("quiz").classList.add("hidden");
    resultBox.classList.remove("hidden");

    const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    finalScore.textContent = "Score: " + percent + "%";

    document.getElementById("correct-count").textContent = correctCount;
    document.getElementById("wrong-count").textContent = wrongCount;
    document.getElementById("unanswered-count").textContent = unansweredCount;

    if (percent >= 60) {
        feedback.textContent = " Congratulations U Won!";
        sounds.win.play().catch(e => console.log('Sound error:', e));
    } else {
        feedback.textContent = "Try Again";
        sounds.lose.play().catch(e => console.log('Sound error:', e));
    }

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        const startTime = localStorage.getItem('assessmentStartTime') || Date.now();
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        try {
            await fetch(`${API_BASE}/api/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    score: percent,
                    timeSpent: timeSpent,
                    correct: correctCount,
                    wrong: wrongCount,
                    unanswered: unansweredCount
                })
            });
        } catch(e) {
            console.error("Failed to save result", e);
        }
    }
}


function restartQuiz() {
    window.location.href = 'dashboard.html';
}



async function initQuiz() {
    try {
        const response = await fetch(`${API_BASE}/api/quiz-data`);
        const data = await response.json();
        questions = data.questions;
        defaultTime = data.time || 30;
    } catch (e) {
        console.error("Failed to load from backend:", e);
    }
    
    if (questions && questions.length > 0) {
        loadQuestion();
    } else {
        qEl.textContent = "No questions available. Please configure in Admin.";
    }
}

initQuiz();