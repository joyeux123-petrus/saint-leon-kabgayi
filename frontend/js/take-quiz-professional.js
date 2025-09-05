document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizTitleElement = document.getElementById('quiz-title');
    const timeLeftElement = document.getElementById('time-left');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const stepIndicator = document.getElementById('step-indicator');
    const completionPercentage = document.getElementById('completion-percentage');
    const progressBar = document.getElementById('progress-bar');
    const quizContent = document.getElementById('quiz-content');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');

    // --- State ---
    let quizData = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let timeLeft = 0; // in seconds
    let timerInterval;
    let attemptId = null;

    // --- Helper Functions ---
    const getAuthToken = () => localStorage.getItem('token');

    async function fetchData(endpoint, options = {}) {}

    const startQuizAttempt = async (quizId) => {
        try {
            const response = await fetchData(`/api/quizzes/${quizId}/start`, {
                method: 'POST'
            });
            console.log('Response from startQuizAttempt backend:', response); // Added this line
            if (response && response.attemptId) {
                attemptId = response.attemptId;
                console.log('Quiz attempt started with ID:', attemptId);
            } else {
                console.error('Failed to start quiz attempt: No attempt_id returned.');
            }
        } catch (error) {
            console.error('Error starting quiz attempt:', error);
        }
    };

    async function fetchData(endpoint, options = {}) {
        const token = getAuthToken();
        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'No error details' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            quizContent.innerHTML = `<p class="error">Failed to load quiz data. Please check the console and try again.</p>`;
        }
    }

    // --- UI & Theme ---
    const setupTheme = () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    };

    const updateProgress = () => {
        if (!quizData) return;
        const totalQuestions = quizData.questions.length;
        const currentStep = currentQuestionIndex + 1;
        const percentage = totalQuestions > 0 ? (currentStep / totalQuestions) * 100 : 0;

        stepIndicator.textContent = `Question ${currentStep} of ${totalQuestions}`;
        completionPercentage.textContent = `${Math.round(percentage)}%`;
        progressBar.style.width = `${percentage}%`;
    };

    // --- Quiz Logic ---
    const getQuizIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('quiz_id');
    };

    const fetchQuizData = async (quizId) => {
        const response = await fetchData(`/api/quizzes/${quizId}`);
        if (response && response.data) {
            quizData = response.data;
            quizTitleElement.textContent = quizData.title || 'Quiz';
            timeLeft = quizData.time_limit * 60 || 3600; // Assuming time_limit is in minutes
            startTimer();
            renderQuestion();
            requestFullScreen();
            startQuizAttempt(quizId);
        } else {
            quizContent.innerHTML = '<p class="error">Could not load quiz. The quiz might not exist or is no longer available.</p>';
        }
    };

    

    const renderQuestion = () => {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            quizContent.innerHTML = '<p>No questions available for this quiz.</p>';
            return;
        }

        const question = quizData.questions[currentQuestionIndex];
        quizContent.innerHTML = renderQuestionCard(question);

        // Restore and add event listeners for answer selection
        const questionId = question.question_id;
        if (question.question_type === 'mcq' || question.question_type === 'true_false') {
            const selectedValue = userAnswers[questionId];
            if (selectedValue) {
                const selectedInput = document.querySelector(`input[name="question-${questionId}"][value="${selectedValue}"]`);
                if(selectedInput) selectedInput.checked = true;
            }
            document.querySelectorAll(`input[name="question-${questionId}"]`).forEach(input => {
                input.addEventListener('change', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            });
        } else if (question.question_type === 'fill_in_the_blanks') {
            const inputs = document.querySelectorAll(`.question-card[data-question-id="${questionId}"] .fill-in-blank-input`);
            if (userAnswers[questionId]) {
                inputs.forEach(input => {
                    const index = input.dataset.blankIndex;
                    input.value = userAnswers[questionId][index] || '';
                });
            }
            inputs.forEach(input => {
                input.addEventListener('input', (event) => {
                    if (!userAnswers[questionId]) {
                        userAnswers[questionId] = {};
                    }
                    userAnswers[questionId][event.target.dataset.blankIndex] = event.target.value;
                });
            });
        } else if (question.question_type === 'short_answer' || question.question_type === 'open_ended' || question.question_type === 'peer_graded') {
            const textarea = document.querySelector(`.question-card[data-question-id="${questionId}"] .short-answer-input`);
            if (textarea) {
                textarea.value = userAnswers[questionId] || '';
                textarea.addEventListener('input', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            }
        } else if (question.question_type === 'matching') {
            document.querySelectorAll(`.question-card[data-question-id="${questionId}"] .phrase2-select`).forEach(select => {
                select.addEventListener('change', (event) => {
                    const phrase1Id = event.target.dataset.phrase1Id;
                    const selectedPhrase2Id = event.target.value;
                    if (!userAnswers[questionId]) {
                        userAnswers[questionId] = {};
                    }
                    userAnswers[questionId][phrase1Id] = selectedPhrase2Id;
                });
                // Set initial selection if already answered
                if (userAnswers[questionId] && userAnswers[questionId][select.dataset.phrase1Id]) {
                    select.value = userAnswers[questionId][select.dataset.phrase1Id];
                }
            });
        } else if (question.question_type === 'video' || question.question_type === 'audio') {
            // For video/audio, sub-questions will have their own event listeners
            // If there's a direct answer to the media question itself, handle it here
            const mediaAnswerInput = document.querySelector(`.question-card[data-question-id="${questionId}"] .media-answer-input`);
            if (mediaAnswerInput) {
                mediaAnswerInput.value = userAnswers[questionId] || '';
                mediaAnswerInput.addEventListener('input', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            }
            // Recursively set up listeners for sub-questions
            if (question.sub_questions && question.sub_questions.length > 0) {
                question.sub_questions.forEach(subQ => {
                    setupQuestionEventListeners(subQ);
                });
            }
        }

        updateProgress();
        updateNavigationButtons();
    };

    // Helper function to render a single question card (including sub-questions)
    const renderQuestionCard = (question, isSubQuestion = false) => {
        let optionsHtml = '';
        let mediaHtml = '';
        let subQuestionsHtml = '';

        if (question.media_url) {
            const fileExtension = question.media_url.split('.').pop().toLowerCase();
            if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
                mediaHtml = `<audio controls src="${question.media_url}" class="question-media"></audio>`;
            } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                mediaHtml = `<video controls src="${question.media_url}" class="question-media"></video>`;
            }
        }

        if (question.question_type === 'mcq' || question.question_type === 'MCQ_single_answer') {
            if (Array.isArray(question.options) && question.options.length > 0) {
                optionsHtml = question.options.map(option => `
                    <label class="quiz-option">
                        <input type="radio" name="question-${question.question_id}" value="${option.option_id}">
                        <span>${option.option_text}</span>
                    </label>
                `).join('');
            } else {
                optionsHtml = '<p class="error">No options provided for this multiple choice question. Please contact the administrator.</p>';
            }
        } else if (question.question_type === 'true_false') {
            optionsHtml = `
                <label class="quiz-option">
                    <input type="radio" name="question-${question.question_id}" value="true">
                    <span>True</span>
                </label>
                <label class="quiz-option">
                    <input type="radio" name="question-${question.question_id}" value="false">
                    <span>False</span>
                </label>
            `;
        } else if (question.question_type === 'fill_in_the_blanks') {
            const parts = question.question_text.split('[BLANK]');
            let blankIndex = 0;
            optionsHtml = parts.map((part, index) => {
                if (index < parts.length - 1) {
                    return `<span>${part}</span><input type="text" class="fill-in-blank-input" data-blank-index="${blankIndex++}" placeholder="Fill in the blank">`;
                } else {
                    return `<span>${part}</span>`;
                }
            }).join('');
        } else if (question.question_type === 'short_answer' || question.question_type === 'open_ended' || question.question_type === 'peer_graded') {
            optionsHtml = `<textarea class="short-answer-input" placeholder="Type your answer here..."></textarea>`;
        } else if (question.question_type === 'matching') {
            // We need to ensure phrase2_options are unique and shuffled for display
            const phrase2Options = question.matching_pairs.map(pair => ({ id: pair.phrase2_id, text: pair.phrase2_text }));
            phrase2Options.sort(() => Math.random() - 0.5); // Shuffle for display

            optionsHtml = `
                <div class="matching-pairs-container">
                    ${question.matching_pairs.map(pair => `
                        <div class="matching-pair-item">
                            <div class="phrase1-display">${pair.phrase1_text}</div>
                            <select class="phrase2-select" data-phrase1-id="${pair.phrase1_id}">
                                <option value="">Select a match</option>
                                ${phrase2Options.map(opt => `<option value="${opt.id}">${opt.text}</option>`).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.question_type === 'video' || question.question_type === 'audio') {
            // If the media question itself has a direct answer field
            if (!isSubQuestion) { // Only show direct answer for the main media question
                optionsHtml = `<textarea class="media-answer-input" placeholder="Type your answer here..."></textarea>`;
            }
            // Render sub-questions recursively
            if (question.sub_questions && question.sub_questions.length > 0) {
                subQuestionsHtml = `
                    <div class="sub-questions-container">
                        <h4>Questions related to the media:</h4>
                        ${question.sub_questions.map(subQ => renderQuestionCard(subQ, true)).join('')}
                    </div>
                `;
            }
        } else {
            optionsHtml = `<p class="error">Unsupported question type: ${question.question_type}. Please contact support.</p>`;
            console.error('Unsupported question type:', question.question_type);
        }

        return `
            <div class="question-card ${isSubQuestion ? 'sub-question-card' : ''}" data-question-id="${question.question_id}">
                ${isSubQuestion ? `<h3 class="sub-question-number">Sub-Question: ${question.question_text}</h3>` : `<h2 class="question-text">${question.question_text}</h2>`}}
                ${mediaHtml}
                <div class="question-options">
                    ${optionsHtml}
                </div>
                ${subQuestionsHtml}
            </div>
        `;
    };

    // Helper function to set up event listeners for a question (and its sub-questions)
    const setupQuestionEventListeners = (question) => {
        const questionId = question.question_id;
        if (question.question_type === 'mcq' || question.question_type === 'MCQ_single_answer' || question.question_type === 'true_false') {
            const selectedValue = userAnswers[questionId];
            if (selectedValue) {
                const selectedInput = document.querySelector(`input[name="question-${questionId}"][value="${selectedValue}"]`);
                if(selectedInput) selectedInput.checked = true;
            }
            document.querySelectorAll(`input[name="question-${questionId}"]`).forEach(input => {
                input.addEventListener('change', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            });
        } else if (question.question_type === 'fill_in_the_blanks' || question.question_type === 'short_answer' || question.question_type === 'open_ended' || question.question_type === 'peer_graded') {
            const textarea = document.querySelector(`.question-card[data-question-id="${questionId}"] .short-answer-input`);
            if (textarea) {
                textarea.value = userAnswers[questionId] || '';
                textarea.addEventListener('input', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            }
        } else if (question.question_type === 'matching') {
            document.querySelectorAll(`.question-card[data-question-id="${questionId}"] .phrase2-select`).forEach(select => {
                select.addEventListener('change', (event) => {
                    const phrase1Id = event.target.dataset.phrase1Id;
                    const selectedPhrase2Id = event.target.value;
                    if (!userAnswers[questionId]) {
                        userAnswers[questionId] = {};
                    }
                    userAnswers[questionId][phrase1Id] = selectedPhrase2Id;
                });
                // Set initial selection if already answered
                if (userAnswers[questionId] && userAnswers[questionId][select.dataset.phrase1Id]) {
                    select.value = userAnswers[questionId][select.dataset.phrase1Id];
                }
            });
        } else if (question.question_type === 'video' || question.question_type === 'audio') {
            const mediaAnswerInput = document.querySelector(`.question-card[data-question-id="${questionId}"] .media-answer-input`);
            if (mediaAnswerInput) {
                mediaAnswerInput.value = userAnswers[questionId] || '';
                mediaAnswerInput.addEventListener('input', (event) => {
                    userAnswers[questionId] = event.target.value;
                });
            }
            if (question.sub_questions && question.sub_questions.length > 0) {
                question.sub_questions.forEach(subQ => {
                    setupQuestionEventListeners(subQ);
                });
            }
        }
    };

    const submitQuiz = async () => {
        clearInterval(timerInterval);
        prevQuestionBtn.disabled = true;
        nextQuestionBtn.disabled = true;
        submitQuizBtn.disabled = true;

        // Flatten userAnswers for submission, including sub-questions
        const answersToSubmit = [];
        const collectAnswers = (question, answersObj) => {
            if (answersObj) {
                if (question.question_type === 'mcq' || question.question_type === 'MCQ_single_answer' || question.question_type === 'true_false') {
                    // For MCQ and True/False, answersObj is the selected_option_id (or 'true'/'false')
                    answersToSubmit.push({
                        question_id: question.question_id,
                        question_type: question.question_type, // Added question_type
                        selected_option_id: answersObj, // This will be the option_id or 'true'/'false' string
                        answer_text: null // No free-form text for these types
                    });
                } else if (question.question_type === 'matching') {
                    // For matching, answersObj is an object of {phrase1_id: selected_phrase2_id}
                    answersToSubmit.push({
                        question_id: question.question_id,
                        question_type: question.question_type, // Added question_type
                        selected_option_id: null, // No single selected option ID
                        answer_text: JSON.stringify(answersObj) // Store as JSON string
                    });
                } else if (question.question_type === 'fill_in_the_blanks') {
                    // For fill_in_the_blanks, answersObj is an object of {blankIndex: answerText}
                    answersToSubmit.push({
                        question_id: question.question_id,
                        question_type: question.question_type, // Added question_type
                        selected_option_id: null, // No selected option ID
                        answer_text: JSON.stringify(answersObj) // Store as JSON string
                    });
                } else if (question.question_type === 'video' || question.question_type === 'audio') {
                    // For video/audio, answersObj can be a string (direct answer) or an object (sub-questions)
                    answersToSubmit.push({
                        question_id: question.question_id,
                        question_type: question.question_type, // Added question_type
                        selected_option_id: null, // No selected option ID
                        answer_text: typeof answersObj === 'object' ? JSON.stringify(answersObj) : answersObj
                    });
                } else {
                    // For other types (short_answer, open_ended, peer_graded), answersObj is direct text
                    answersToSubmit.push({
                        question_id: question.question_id,
                        question_type: question.question_type, // Added question_type
                        selected_option_id: null, // No selected option ID
                        answer_text: answersObj
                    });
                }
            }
        };

        // Collect answers for main questions
        quizData.questions.forEach(q => {
            collectAnswers(q, userAnswers[q.question_id]);
            // Collect answers for sub-questions if they exist
            if (q.sub_questions && q.sub_questions.length > 0) {
                q.sub_questions.forEach(subQ => {
                    collectAnswers(subQ, userAnswers[subQ.question_id]);
                });
            }
        });

        try {
            const response = await fetchData(`/api/quizzes/attempts/${attemptId}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers: answersToSubmit })
            });

            if (response) {
                quizContent.innerHTML = `
                    <div class="question-card text-center">
                        <h2>Quiz Submitted!</h2>
                        <p>Your score: <strong>${response.totalScore} / ${quizData.questions.length}</strong></p>
                        <p>You will be redirected to your dashboard shortly.</p>
                    </div>
                `;
                setTimeout(() => {
                    window.location.href = 'student_dashboard_new.html#my-results-section';
                }, 5000);
            } else {
                alert('Failed to submit quiz. Please check your connection.');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('An error occurred during submission. Please contact support.');
        }
    };

    const updateNavigationButtons = () => {
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        
        if (currentQuestionIndex === quizData.questions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitQuizBtn.style.display = 'inline-flex';
        } else {
            nextQuestionBtn.style.display = 'inline-flex';
            submitQuizBtn.style.display = 'none';
        }
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timeLeftElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                submitQuiz();
                alert('Time is up! Your quiz has been submitted automatically.');
            }
        }, 1000);
    };

    

    // --- Event Listeners ---
    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });

    submitQuizBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to submit your quiz?')){
            submitQuiz();
        }
    });

    // --- Anti-Cheating (Optional but recommended) ---
    const requestFullScreen = () => {
        // Fullscreen can be intrusive; enable if strictly required.
        /*
        const element = document.documentElement;
        if (element.requestFullscreen) element.requestFullscreen();
        */
    };

    // --- Initialization ---
    const init = () => {
        setupTheme();
        const quizId = getQuizIdFromUrl();
        if (quizId) {
            fetchQuizData(quizId);
        } else {
            quizContent.innerHTML = '<p class="error">No quiz ID found in URL. Please return to the dashboard and select a quiz.</p>';
        }
    };

    init();
});