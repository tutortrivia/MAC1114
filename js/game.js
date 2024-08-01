import { shuffleArray, getAvailableLibraries, updateTimerDisplay, toggleQRCode, getGameImage } from './util.js';
import { loadQuestionLibrary, allQuestions } from './questions.js';

const startButton = document.getElementById('start-button');
const gameContent = document.getElementById('game-content');
const questionElement = document.getElementById('question');
const categoryElement = document.getElementById('category');
const difficultyElement = document.getElementById('difficulty');
const answersElement = document.getElementById('answers');
const resultElement = document.getElementById('result');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startMenu = document.getElementById('start-menu');
const volumeToggle = document.getElementById('volume-toggle');
const backgroundMusic = document.getElementById('backgroundMusic');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const personalBestSound = new Audio('assets/sounds/personalBest.mp3');
let librarySelect = document.getElementById('library-select');
const headerImage = document.getElementById('header-image');
const reviewContainer = document.getElementById('review-container');
const reviewQuestionsElement = document.getElementById('review-questions');
const finishReviewButton = document.getElementById('finish-review');
const qrToggle = document.getElementById('qr-toggle');
const qrImage = document.getElementById('qr-image');

let currentQuestionIndex = 0;
let score = 0;
let incorrectAnswers = 0;
let timer;
let timeLeft = 90;
let isMuted = false;
let isTransitioning = false;
let sessionBest = {
    attempted: 0,
    correct: 0,
    incorrect: 0,
    percentage: 0
};
let currentLibrary = 'UnitCircle';
let currentQuestions = [];
let answeredQuestions = [];

function populateLibrarySelect() {
    const libraries = getAvailableLibraries(allQuestions);
    librarySelect.innerHTML = libraries.map(lib => `<option value="${lib}">${lib.charAt(0).toUpperCase() + lib.slice(1)}</option>`).join('');
    librarySelect.value = currentLibrary;
    librarySelect.addEventListener('change', () => {
        currentLibrary = librarySelect.value;
        updateHeaderImage();
    });
    updateHeaderImage();
}

function updateHeaderImage() {
    const imageSrc = getGameImage(currentLibrary);
    headerImage.src = `assets/images/${imageSrc}`;
    headerImage.alt = `${currentLibrary} header image`;
}

async function startGame() {
    currentLibrary = librarySelect.value;
    currentQuestions = await loadQuestionLibrary(currentLibrary);
    if (!currentQuestions) {
        alert("Failed to load questions. Please try again.");
        return;
    }
    shuffleArray(currentQuestions);
    currentQuestionIndex = 0;
    score = 0;
    incorrectAnswers = 0;
    answeredQuestions = [];
    updateScore();
    timeLeft = 90;
    startMenu.classList.add('hidden');
    gameContent.classList.remove('hidden');
    displayQuestion();
    startTimer();
    if (!isMuted) {
        backgroundMusic.play();
    }
}

function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length || timeLeft <= 0) {
        endGame();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    questionElement.innerHTML = question.question;
    categoryElement.textContent = `Category: ${question.category || 'N/A'}`;
    difficultyElement.textContent = `Difficulty: ${question.difficulty || 'N/A'}`;
    answersElement.innerHTML = '';

    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);

    shuffledAnswers.forEach((answer) => {
        const button = document.createElement('button');
        const answerContent = document.createElement('span');
        answerContent.innerHTML = answer;

        button.appendChild(answerContent);
        button.classList.add(
            'bg-blue-500',
            'hover:bg-blue-600',
            'text-white',
            'font-bold',
            'py-4',
            'px-6',
            'rounded',
            'w-full',
            'mb-4',
            'text-lg'
        );
        button.addEventListener('click', () => {
            if (!isTransitioning) {
                checkAnswer(answer, question.correct);
            }
        });
        answersElement.appendChild(button);
    });

    resultElement.textContent = 'Good Luck!';
    resultElement.classList.add('text-blue-500');

    // Typeset the new content
    MathJax.typesetPromise([questionElement, answersElement]).then(() => {
        console.log('Question and answers typeset complete');
    });
}

function checkAnswer(selectedAnswer, correctAnswer) {
    console.log('checkAnswer called', selectedAnswer, correctAnswer);
    isTransitioning = true;
    const buttons = answersElement.getElementsByTagName('button');
    console.log('Buttons found:', buttons.length);
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        const answerContent = buttons[i].querySelector('span').innerHTML;
        if (answerContent === correctAnswer) {
            console.log('Correct button found, adding green class');
            buttons[i].classList.remove('bg-blue-500', 'hover:bg-blue-600');
            buttons[i].classList.add('bg-green-500');
        } else if (answerContent === selectedAnswer) {
            console.log('Incorrect button found, adding red class');
            buttons[i].classList.remove('bg-blue-500', 'hover:bg-blue-600');
            buttons[i].classList.add('bg-red-500');
        }
    }

    const isCorrect = selectedAnswer === correctAnswer;
    if (isCorrect) {
        score++;
        resultElement.textContent = 'Correct!';
        resultElement.classList.remove('text-blue-500');
        resultElement.classList.add('text-green-500');
        if (!isMuted) correctSound.play();
    } else {
        incorrectAnswers++;
        resultElement.textContent = 'Incorrect!';
        resultElement.classList.remove('text-blue-500');
        resultElement.classList.add('text-red-500');
        if (!isMuted) incorrectSound.play();
    }

    answeredQuestions.push({
        ...currentQuestions[currentQuestionIndex],
        userAnswer: selectedAnswer,
        isCorrect: isCorrect
    });

    updateScore();

    setTimeout(() => {
        resultElement.textContent = 'Good Luck!';
        resultElement.classList.remove('text-green-500', 'text-red-500');
        resultElement.classList.add('text-blue-500');
        currentQuestionIndex++;
        displayQuestion();
        isTransitioning = false;
    }, 1500);
}

function updateScore() {
    scoreElement.textContent = `Score: ${score} | Incorrect: ${incorrectAnswers}`;
}

function startTimer() {
    updateTimerDisplay(timerElement, timeLeft);
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timerElement, timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    gameContent.classList.add('hidden');
    reviewContainer.classList.remove('hidden');

    const attempted = score + incorrectAnswers;
    const percentageCorrect = attempted > 0 ? (score / attempted * 100).toFixed(2) : 0;

    let resultsHTML = `
        <h2 class="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p>Topics Covered: ${currentLibrary.charAt(0).toUpperCase() + currentLibrary.slice(1)} Trivia</p>
        <p>Questions Attempted: ${attempted}</p>
        <p>Correct Answers: ${score}</p>
        <p>Incorrect Answers: ${incorrectAnswers}</p>
        <p>Percentage Correct: ${percentageCorrect}%</p>
    `;

    let personalBestAchieved = false;

    if (attempted > sessionBest.attempted) {
        sessionBest.attempted = attempted;
        resultsHTML += `<p class="text-green-500 font-bold outline-gold">Personal Best For This Session: Questions Attempted!</p>`;
        personalBestAchieved = true;
    }
    if (score > sessionBest.correct) {
        sessionBest.correct = score;
        resultsHTML += `<p class="text-green-500 font-bold outline-gold">Personal Best For This Session: Correct Answers!</p>`;
        personalBestAchieved = true;
    }
    if (incorrectAnswers > sessionBest.incorrect) {
        sessionBest.incorrect = incorrectAnswers;
    }
    if (parseFloat(percentageCorrect) > sessionBest.percentage) {
        sessionBest.percentage = parseFloat(percentageCorrect);
        resultsHTML += `<p class="text-green-500 font-bold outline-gold">Personal Best For This Session: Percentage Correct!</p>`;
        personalBestAchieved = true;
    }

    if (personalBestAchieved && !isMuted) {
        personalBestSound.play();
    }

    reviewQuestionsElement.innerHTML = resultsHTML;
    displayReviewQuestions();

    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function displayReviewQuestions() {
    reviewQuestionsElement.innerHTML = ''; // Clear previous content
    answeredQuestions.forEach((question, index) => {
        const questionReview = document.createElement('div');
        questionReview.classList.add('mb-4', 'p-4', 'border', 'rounded');
        questionReview.innerHTML = `
            <p class="font-semibold">${index + 1}. ${question.question}</p>
            <p>Your answer: ${question.userAnswer}</p>
            <p>Correct answer: ${question.correct}</p>
            <p>Explanation: ${question.explanation || 'Not provided'}</p>
        `;
        if (question.isCorrect) {
            questionReview.classList.add('bg-green-100');
        } else {
            questionReview.classList.add('bg-red-100');
        }
        reviewQuestionsElement.appendChild(questionReview);
    });

    // Typeset the review questions
    MathJax.typesetPromise([reviewQuestionsElement]).then(() => {
        console.log('Review questions typeset complete');
    });
}

function showStartMenu() {
    reviewContainer.classList.add('hidden');
    startMenu.classList.remove('hidden');
    populateLibrarySelect();
    updateHeaderImage();
}

function toggleVolume() {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;
    correctSound.muted = isMuted;
    incorrectSound.muted = isMuted;
    personalBestSound.muted = isMuted;
    volumeToggle.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
}

function getTutoring() {
    window.open('https://mindcraftmagazine.beehiiv.com/', '_blank');
}

// Event listeners
startButton.addEventListener('click', startGame);
volumeToggle.addEventListener('click', toggleVolume);
finishReviewButton.addEventListener('click', showStartMenu);
qrToggle.addEventListener('click', () => toggleQRCode(qrImage, qrToggle));
document.getElementById('get-tutoring-button').addEventListener('click', getTutoring);

// Initialize the game
showStartMenu();
