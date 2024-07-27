export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function getAvailableLibraries(allQuestions) {
    return Object.keys(allQuestions);
}

export function updateGameTitle(librarySelect, gameTitle) {
    const currentLibrary = librarySelect.value;
    gameTitle.textContent = `Who Wants To Be A ${currentLibrary.charAt(0).toUpperCase() + currentLibrary.slice(1)} Buff?`;
    return currentLibrary;
}

export function updateTimerDisplay(timerElement, timeLeft) {
    timerElement.textContent = `Time left: ${timeLeft}s`;
    if (timeLeft <= 17) {
        timerElement.classList.add('timer-warning');
        timerElement.style.animation = 'timerPulse 1s ease-in-out infinite';
    } else {
        timerElement.classList.remove('timer-warning');
        timerElement.style.animation = 'none';
    }
}

export function toggleQRCode(qrImage, qrToggle) {
    if (qrImage.classList.contains('hidden')) {
        qrImage.classList.remove('hidden');
        qrToggle.textContent = 'Hide QR';
    } else {
        qrImage.classList.add('hidden');
        qrToggle.textContent = 'Display QR';
    }
}
