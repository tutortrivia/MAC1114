const allQuestions = {
    SetTheory: null,
    Logic: null,
    Numeration: null
};

async function loadQuestionLibrary(libraryName) {
    if (allQuestions[libraryName] === null) {
        try {
            const response = await fetch(`data/${libraryName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const questions = await response.json();
            allQuestions[libraryName] = questions;
        } catch (error) {
            console.error(`Could not load the ${libraryName} question library:`, error);
            return null;
        }
    }
    return allQuestions[libraryName];
}

export { loadQuestionLibrary, allQuestions };
