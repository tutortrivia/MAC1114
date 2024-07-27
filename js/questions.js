const allQuestions = {
    SetTheory: null,
    Logic: null,
    Numeration: null
};

async function loadQuestionLibrary(libraryName) {
    console.log(`Attempting to load library: ${libraryName}`);
    if (allQuestions[libraryName] === null) {
        try {
            const url = `data/${libraryName}.json`;
            console.log(`Fetching from URL: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const questions = await response.json();
            console.log(`Successfully loaded ${questions.length} questions for ${libraryName}`);
            allQuestions[libraryName] = questions;
        } catch (error) {
            console.error(`Could not load the ${libraryName} question library:`, error);
            return null;
        }
    } else {
        console.log(`Library ${libraryName} already loaded`);
    }
    return allQuestions[libraryName];
}

export { loadQuestionLibrary, allQuestions };
