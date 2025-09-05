document.addEventListener('DOMContentLoaded', () => {
    const quizTitleElement = document.getElementById('quiz-title');
    const quizSubjectElement = document.getElementById('quiz-subject');
    const quizClassElement = document.getElementById('quiz-class');
    const quizStartTimeElement = document.getElementById('quiz-start-time');
    const quizEndTimeElement = document.getElementById('quiz-end-time');
    const timeLeftElement = document.getElementById('time-left');
    const questionDisplay = document.getElementById('question-display');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');

    let quizData = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let timeLeft = 0; // in seconds
    let timerInterval;
    let attemptId = null;

    // --- Helper Functions ---
    const getAuthToken = () => localStorage.getItem('token');

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

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
            quizSubjectElement.textContent = quizData.subject_name || 'N/A';
            quizClassElement.textContent = quizData.class_name || 'N/A';
            quizStartTimeElement.textContent = new Date(quizData.start_time).toLocaleString();
            quizEndTimeElement.textContent = new Date(quizData.end_time).toLocaleString();
            timeLeft = quizData.time_limit || 3600;
            startTimer();
            renderQuestion();
            requestFullScreen();
            startQuizAttempt(quizId);
        } else {
            questionDisplay.innerHTML = '<p>Could not load quiz. Please try again.</p>';
        }
    };

    const startQuizAttempt = async (quizId) => {
        const response = await fetchData(`/api/quizzes/${quizId}/start`, { method: 'POST' });
        if (response && response.attemptId) {
            attemptId = response.attemptId;
        } else {
            console.error('Failed to start quiz attempt');
            questionDisplay.innerHTML = '<p>Could not start quiz attempt. Please try again.</p>';
        }
    };

    const renderQuestion = () => {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            questionDisplay.innerHTML = '<p>No questions available for this quiz.</p>';
            return;
        }

        const question = quizData.questions[currentQuestionIndex];
        let optionsHtml = '';

        if (question.question_type === 'mcq' || question.question_type === 'MCQ_single_answer') {
            optionsHtml = question.options.map(option => `
                <label class="quiz-option">
                    <input type="radio" name="question-${question.id}" value="${option.id}" ${userAnswers[question.id] === option.id ? 'checked' : ''}>
                    <span>${option.option_text}</span>
                </label>
            `).join('');
        } else if (question.question_type === 'true_false') {
            optionsHtml = `
                <label class="quiz-option">
                    <input type="radio" name="question-${question.id}" value="true" ${userAnswers[question.id] === 'true' ? 'checked' : ''}>
                    <span>True</span>
                </label>
                <label class="quiz-option">
                    <input type="radio" name="question-${question.id}" value="false" ${userAnswers[question.id] === 'false' ? 'checked' : ''}>
                    <span>False</span>
                </label>
            `;
        } else if (question.question_type === 'fill_in_the_blanks' || question.question_type === 'short_answer' || question.question_type === 'open_ended' || question.question_type === 'peer_graded') {
            optionsHtml = `
                <textarea class="short-answer-input" placeholder="Type your answer here..." data-question-id="${question.id}">${userAnswers[question.id] || ''}</textarea>
            `;
        } else if (question.question_type === 'video' || question.question_type === 'matching') {
            optionsHtml = `<p class="error">Unsupported question type: ${question.question_type}. Please contact support.</p>`;
        }

        questionDisplay.innerHTML = `
            <div class="question-card">
                <p class="question-number">Question ${currentQuestionIndex + 1} of ${quizData.questions.length}</p>
                <h3 class="question-text">${question.question_text}</h3>
                <div class="question-options">
                    ${optionsHtml}
                </div>
            </div>
        `;

        // Add event listeners for answer selection
        if (question.question_type === 'mcq' || question.question_type === 'true_false' || question.question_type === 'MCQ_single_answer') {
            document.querySelectorAll(`input[name="question-${question.id}"]`).forEach(input => {
                input.addEventListener('change', (event) => {
                    userAnswers[question.id] = event.target.value;
                });
            });
        } else if (question.question_type === 'fill_in_the_blanks' || question.question_type === 'short_answer' || question.question_type === 'open_ended' || question.question_type === 'peer_graded') {
            document.querySelector(`.short-answer-input`).addEventListener('input', (event) => {
                userAnswers[question.id] = event.target.value;
            });
        }

        updateNavigationButtons();
    };

    const updateNavigationButtons = () => {
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        nextQuestionBtn.disabled = currentQuestionIndex === quizData.questions.length - 1;

        if (currentQuestionIndex === quizData.questions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitQuizBtn.style.display = 'inline-block';
        } else {
            nextQuestionBtn.style.display = 'inline-block';
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
                submitQuiz(); // Auto-submit when time runs out
                alert('Time is up! Your quiz has been submitted.');
            }
        }, 1000);
    };

    const submitQuiz = async () => {
        clearInterval(timerInterval);
        prevQuestionBtn.disabled = true;
        nextQuestionBtn.disabled = true;
        submitQuizBtn.disabled = true;

        const answers = Object.keys(userAnswers).map(questionId => {
            return {
                question_id: questionId,
                answer_text: userAnswers[questionId]
            };
        });

        const submissionData = {
            answers: answers,
        };

        try {
            const response = await fetchData(`/api/quizzes/attempts/${attemptId}/submit`, {
                method: 'POST',
                body: JSON.stringify(submissionData)
            });

            if (response) {
                alert('Quiz submitted successfully! Your score: ' + response.totalScore);
                window.location.href = 'student_dashboard_new.html#my-results-section';
            } else {
                alert('Failed to submit quiz.');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('An error occurred during quiz submission.');
        }
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

    submitQuizBtn.addEventListener('click', submitQuiz);

    // --- Anti-Cheating Measures ---
    const requestFullScreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
    };

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            alert('Exiting full-screen mode is not allowed during the quiz. Your quiz will be submitted.');
            submitQuiz();
        }
    });

    document.addEventListener('mozfullscreenchange', () => {
        if (!document.mozFullScreen) {
            alert('Exiting full-screen mode is not allowed during the quiz. Your quiz will be submitted.');
            submitQuiz();
        }
    });

    document.addEventListener('webkitfullscreenchange', () => {
        if (!document.webkitIsFullScreen) {
            alert('Exiting full-screen mode is not allowed during the quiz. Your quiz will be submitted.');
            submitQuiz();
        }
    });

    document.addEventListener('msfullscreenchange', () => {
        if (!document.msFullscreenElement) {
            alert('Exiting full-screen mode is not allowed during the quiz. Your quiz will be submitted.');
            submitQuiz();
        }
    });

    let tabSwitchCount = 0;
    const MAX_TAB_SWITCHES = 2;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            tabSwitchCount++;
            if (tabSwitchCount > MAX_TAB_SWITCHES) {
                alert('Multiple tab switches detected! Your quiz will be submitted.');
                submitQuiz();
            } else {
                alert(`Warning: Do not switch tabs during the quiz. You have ${MAX_TAB_SWITCHES - tabSwitchCount} warnings left.`);
            }
        }
    });

    window.addEventListener('blur', () => {
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('cut', e => e.preventDefault());
    document.addEventListener('paste', e => e.preventDefault());

    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            alert('Developer tools are disabled during the quiz.');
        }
    });

    // --- Initialization ---
    const quizId = getQuizIdFromUrl();
    if (quizId) {
        fetchQuizData(quizId);
    } else {
        questionDisplay.innerHTML = '<p>No quiz ID provided. Please go back to the dashboard.</p>';
    }
});