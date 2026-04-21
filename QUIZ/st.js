const questions = [
{
    question: "Who is Mr.ipl",
    options: [
        { text: "Virat kohli", isCorrect: false },
        { text: "Suresh raina", isCorrect: true },
        { text: "Gill", isCorrect: false },
        { text: "Abiskek sharma", isCorrect: false }
    ]
},
{
    question: "Who is the best captain",
    options: [
        { text: "Virat Kolhi", isCorrect: false },
        { text: "Rohith sharma", isCorrect: false },
        { text: "Sanju samson", isCorrect: false },
        { text: "MS Dhoni", isCorrect: true }
    ]
},
{
    question: "No 1 player in the World",
    options: [
        { text: "Virat Kohli", isCorrect: true },
        { text: "AB De villiers", isCorrect: false },
        { text: "Chris Gayel", isCorrect: false },
        { text: "MS Dhoni", isCorrect: false }
    ]
},
{
    question: "Best all Rounder in Test matches",
    options: [
        { text: "Marco jansen", isCorrect: false },
        { text: "Ravindra Jadeja", isCorrect: true },
        { text: "Bens Stocks", isCorrect: false },
        { text: "Hardik pandya", isCorrect: false }
    ]
},
{
    question: "Who own the 3 international Tropies",
    options: [
        { text: "MS Dhoni", isCorrect: true },
        { text: "Kapil Dev", isCorrect: false },
        { text: "Rohith sharma", isCorrect: false },
        { text: "Ricky Ponting", isCorrect: false }
    ]
},
{
    question: "Fastest Bowler in the world",
    options: [
        { text: "Jasprit Bumrah", isCorrect: false },
        { text: "Shaun Tait", isCorrect: false },
        { text: "Mitchell Starc", isCorrect: false },
        { text: "Shoaib Akhtar", isCorrect: true }
    ]
},
{
    question: "Which is NOT a data Type",
    options: [
        { text: "Integer", isCorrect: false },
        { text: "float", isCorrect: false },
        { text: "char", isCorrect: false },
        { text: "repeat", isCorrect: true }
    ]
},
{
    question: "Which Keyword is used to define a function",
    options: [
        { text: "func", isCorrect: false },
        { text: "define", isCorrect: false },
        { text: "def", isCorrect: true },
        { text: "function", isCorrect: false }
    ]
},
{
    question: "Python is a.......",
    options: [
        { text: "Complied only", isCorrect: false },
        { text: "Interpreted", isCorrect: true },
        { text: "Assembly Language", isCorrect: false },
        { text: "Machine Language", isCorrect: false }

    ]
},
{
    question: "Which package is important",
    options: [
        { text: "java.lang", isCorrect: true },
        { text: "java.util", isCorrect: false },
        { text: "java.io", isCorrect: false },
        { text: "java.net", isCorrect: false }
    ]
},
{
    question: "Java program run on",
    options: [
        { text: "Compiler", isCorrect: false },
        { text: "JVM", isCorrect: true },
        { text: "OS directly", isCorrect: false },
        { text: "BIOS", isCorrect: false }
    ]
}
];

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
let time = 30;
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
    time = 30;
    timerEl.classList.remove("warning");

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
    sounds.click.play();

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
        sounds.correct.play();
    } else {
        btn.classList.add("wrong");
        sounds.wrong.play();
    }

    scoreEl.textContent = "Score: " + score;

    setTimeout(nextQuestion, 800);
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
            const buttons = document.querySelectorAll(".option-btn");
            buttons.forEach(b => b.disabled = true);
            nextQuestion();
        }
    }, 1000);
}
 
 
function showResult() {
    document.getElementById("quiz").classList.add("hidden");
    resultBox.classList.remove("hidden");

    const percent = Math.round((score / questions.length) * 100);
    finalScore.textContent = "Score: " + percent + "%";

    if (percent >= 60) {
        feedback.textContent = " Congratulations U Won!";
        sounds.win.play();
    } else {
        feedback.textContent = "Try Again";
        sounds.lose.play();
    }
}


function restartQuiz() {
    current = 0;
    score = 0;
    scoreEl.textContent = "Score: " + score;
    timerEl.textContent = "30s";
    resultBox.classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");
    loadQuestion();
}



loadQuestion();