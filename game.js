//game.js
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
const personalBestSound = new Audio('personalBest.mp3');
let librarySelect = document.getElementById('library-select');
let gameTitle = document.getElementById('game-title');
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
let currentLibrary = 'SetTheory';
let currentQuestions = [];
let answeredQuestions = [];

function toggleQRCode() {
    if (qrImage.classList.contains('hidden')) {
        qrImage.classList.remove('hidden');
        qrToggle.textContent = 'Hide QR';
    } else {
        qrImage.classList.add('hidden');
        qrToggle.textContent = 'Display QR';
    }
}

function getAvailableLibraries() {
    return Object.keys(allQuestions);
}

function populateLibrarySelect() {
    const libraries = getAvailableLibraries();
    librarySelect.innerHTML = libraries.map(lib => `<option value="${lib}">${lib.charAt(0).toUpperCase() + lib.slice(1)}</option>`).join('');
    librarySelect.value = currentLibrary;
    librarySelect.addEventListener('change', updateGameTitle);
}

function updateGameTitle() {
    currentLibrary = librarySelect.value;
    gameTitle.textContent = `Who Wants To Be A ${currentLibrary.charAt(0).toUpperCase() + currentLibrary.slice(1)} Buff?`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
    questionElement.textContent = question.question;
    categoryElement.textContent = `Category: ${question.category || 'N/A'}`;
    difficultyElement.textContent = `Difficulty: ${question.difficulty || 'N/A'}`;
    answersElement.innerHTML = '';

    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);

    shuffledAnswers.forEach((answer) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'w-full');
        button.addEventListener('click', () => {
            if (!isTransitioning) {
                checkAnswer(answer, question.correct);
            }
        });
        answersElement.appendChild(button);
    });

    resultElement.textContent = 'Good Luck!';
    resultElement.classList.add('text-blue-500');
}

function checkAnswer(selectedAnswer, correctAnswer) {
    isTransitioning = true;
    const buttons = answersElement.getElementsByTagName('button');

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        if (buttons[i].textContent === correctAnswer) {
            buttons[i].classList.remove('bg-blue-500', 'hover:bg-blue-600');
            buttons[i].classList.add('bg-green-500');
        } else if (buttons[i].textContent === selectedAnswer) {
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
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    timerElement.textContent = `Time left: ${timeLeft}s`;
    if (timeLeft <= 17) {
        timerElement.classList.add('timer-warning');
        timerElement.style.animation = 'timerPulse 1s ease-in-out infinite';
    } else {
        timerElement.classList.remove('timer-warning');
        timerElement.style.animation = 'none';
    }
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
    answeredQuestions.forEach((question, index) => {
        const questionReview = document.createElement('div');
        questionReview.classList.add('mb-4', 'p-4', 'border', 'rounded');
        questionReview.innerHTML = `
            <p class="font-semibold">${index + 1}. ${question.question}</p>
            <p>Your answer: ${question.userAnswer}</p>
            <p>Correct answer: ${question.correct}</p>
            <p>Explanation: ${question.explanation || 'Not provided'}</p>
            <button class="flag-question mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded" data-index="${index}">Flag Question</button>
        `;
        if (question.isCorrect) {
            questionReview.classList.add('bg-green-100');
        } else {
            questionReview.classList.add('bg-red-100');
        }
        reviewQuestionsElement.appendChild(questionReview);
    });

    const flagButtons = document.querySelectorAll('.flag-question');
    flagButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            flagQuestion(index);
        });
    });
}

function flagQuestion(index) {
    const questionToFlag = answeredQuestions[index];
    const feedbackPrompt = prompt('Please provide feedback for this question:');
    if (feedbackPrompt) {
        sendFeedbackToGoogleSheets(questionToFlag.questionId, feedbackPrompt);
    }
}

function sendFeedbackToGoogleSheets(questionId, feedback) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyFgKe0-xM0iUIjaYJ5KlqwN_Gbc6xw893PoHSoAAJ_e9KJGNLwrRGWr6h0wM1ErG9T/exec';
    const data = {
        questionId: questionId,
        feedback: feedback
    };

    fetch(scriptURL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    })
    .then(text => {
        console.log('Response:', text);
        alert('Feedback submitted successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`${error.message}. This feature is still under development.`);
    });
}

function showStartMenu() {
    reviewContainer.classList.add('hidden');
    startMenu.classList.remove('hidden');
    startMenu.innerHTML = `
        <select id="library-select" class="bg-white border border-gray-300 rounded-md py-2 px-4 mb-4 w-full md:w-1/2 mx-auto"></select>
        <button id="get-tutoring-button" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-4 w-full md:w-1/2 mx-auto">Get Free Tutoring</button>
        <br>
        <button id="start-button" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full md:w-1/2 mx-auto">Start Game</button>
    `;
    
    librarySelect = document.getElementById('library-select');
    gameTitle = document.getElementById('game-title');
    
    populateLibrarySelect();
    updateGameTitle();
    
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('get-tutoring-button').addEventListener('click', getTutoring);
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
    window.open('https://www.palmbeachstate.edu/slc/', '_blank');
}

// Initialize the game
showStartMenu();

// Event listeners
volumeToggle.addEventListener('click', toggleVolume);
finishReviewButton.addEventListener('click', showStartMenu);
qrToggle.addEventListener('click', toggleQRCode);
