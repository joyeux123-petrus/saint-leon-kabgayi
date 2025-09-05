document.addEventListener('DOMContentLoaded', () => {
    const quizForm = document.getElementById('quiz-form');
    const subjectSelect = document.getElementById('subject-select');
    const classSelect = document.getElementById('class-select');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsSection = document.getElementById('questions-section');
    const questionTemplate = document.getElementById('question-template');
    const subQuestionTemplate = document.getElementById('sub-question-template');
    const mcqOptionsTemplate = document.getElementById('mcq-options-template');
    const tfOptionsTemplate = document.getElementById('tf-options-template');
    const saOptionsTemplate = document.getElementById('sa-options-template');
    const fillInTheBlankOptionsTemplate = document.getElementById('fill-in-the-blank-options-template');
    const matchingOptionsTemplate = document.getElementById('matching-options-template');
    const videoOptionsTemplate = document.getElementById('video-options-template');

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');

    let currentQuizData = null; // To store quiz data if editing

    // Function to fetch quiz data for editing
    const fetchQuizForEdit = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/quizzes/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch quiz for editing');
            }
            currentQuizData = await response.json();
            console.log('Fetched quiz for editing:', currentQuizData);
            populateQuizForm(currentQuizData);
        } catch (error) {
            console.error('Error fetching quiz for editing:', error);
            alert('Failed to load quiz for editing. Please try again.');
        }
    };

    // Function to populate the form
    const populateQuizForm = (quiz) => {
        document.getElementById('quiz-title').value = quiz.title;
        document.getElementById('quiz-description').value = quiz.description;
        document.getElementById('time-limit').value = quiz.time_limit;
        document.getElementById('start-time').value = quiz.start_time ? new Date(quiz.start_time).toISOString().slice(0, 16) : '';
        document.getElementById('end-time').value = quiz.end_time ? new Date(quiz.end_time).toISOString().slice(0, 16) : '';
        document.getElementById('randomize-questions').checked = quiz.randomize_questions;
        document.getElementById('is-active').checked = quiz.is_active;
        document.getElementById('is-team-based').checked = quiz.is_team_based;

        // Populate subject
        if (quiz.subject_name) {
            subjectSelect.value = quiz.subject_name;
        }

        // Populate class
        if (quiz.class_name) {
            classSelect.value = quiz.class_name;
        }

        // Clear existing questions
        questionsSection.innerHTML = '';

        // Populate questions
        quiz.questions.forEach(question => {
            addQuestionToForm(question); // New helper function
        });
    };

    // Helper function to add a question to the form
    const addQuestionToForm = (questionData) => {
        const clone = questionTemplate.content.cloneNode(true);
        const questionItem = clone.querySelector('.question-item');
        const questionOptionsContainer = clone.querySelector('.question-options');

        questionItem.querySelector('.question-text').value = questionData.question_text;
        questionItem.querySelector('.question-points').value = questionData.points || 1; // Populate points, default to 1
        questionItem.querySelector('.question-type').value = questionData.question_type;
        questionItem.querySelector('.question-time-limit').value = questionData.time_limit;

        // Trigger change event to load correct options template
        const event = new Event('change');
        questionItem.querySelector('.question-type').dispatchEvent(event);

        // Populate options based on type
        switch (questionData.question_type) {
            case 'MCQ_single_answer':
            case 'MCQ_multiple_answers':
                questionData.options.forEach((option, index) => {
                    const optionItem = document.createElement('div');
                    optionItem.classList.add('option-item');
                    optionItem.innerHTML = `
                        <input type="text" placeholder="Option ${index + 1}" class="option-text" value="${option.option_text}" />
                        <input type="radio" name="correct-option-${questionsSection.children.length}" value="${index}" ${option.is_correct ? 'checked' : ''} /> Correct
                    `;
                    questionOptionsContainer.querySelector('.mcq-options-section').insertBefore(optionItem, questionOptionsContainer.querySelector('.add-option-btn'));
                });
                break;
            case 'True/False':
                if (questionData.options.length > 0) {
                    questionOptionsContainer.querySelector(`input[value="${questionData.options[0].option_text}"]`).checked = questionData.options[0].is_correct;
                }
                break;
            case 'Short_Answer':
            case 'Fill-in-the-Blank':
                questionOptionsContainer.querySelector('textarea, .correct-answer').value = questionData.correct_answer;
                break;
            case 'Matching':
                questionData.matching_pairs.forEach(pair => {
                    const matchingPair = document.createElement('div');
                    matchingPair.classList.add('matching-pair');
                    matchingPair.innerHTML = `
                        <input type="text" placeholder="Prompt" class="prompt" value="${pair.prompt}" />
                        <input type="text" placeholder="Correct Match" class="correct-match" value="${pair.correct_match}" />
                    `;
                    questionOptionsContainer.querySelector('.matching-section').insertBefore(matchingPair, questionOptionsContainer.querySelector('.add-matching-pair-btn'));
                });
                break;
            case 'Video':
                questionOptionsContainer.querySelector('.video-url').value = questionData.media_url;
                questionData.sub_questions.forEach(subQuestion => {
                    // This will be more complex, similar to addQuestionToForm
                    // For now, just a placeholder
                    console.log('Populating sub-question:', subQuestion);
                });
                break;
        }

        questionsSection.appendChild(clone);
    };

    // Call fetchQuizForEdit if quizId exists
    if (quizId) {
        fetchQuizForEdit(quizId);
    }

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/subjects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch subjects');
            }
            const subjects = await response.json();
            console.log('Fetched subjects:', subjects);
            console.log('Subject select element:', subjectSelect);
            if (subjects && subjects.length > 0) {
                console.log('Populating dropdown with subjects.');
            } else {
                console.log('No subjects found to populate dropdown.');
            }
            subjectSelect.innerHTML = '<option value="" disabled selected>Please select a subject</option>'; // Start with disabled option
            subjects.forEach(subject => {
                console.log('Processing subject:', subject);
                const option = document.createElement('option');
                option.value = subject.name;  // Use name, NOT ID
                option.textContent = subject.name;
                console.log('Created option:', option);
                subjectSelect.appendChild(option);
            });

            // Optional "No Subject"
            const noSubject = document.createElement('option');
            noSubject.value = "";
            noSubject.textContent = "No Subject";
            subjectSelect.appendChild(noSubject);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
        }
    };

    const addQuestion = () => {
        const clone = questionTemplate.content.cloneNode(true);
        const questionOptions = clone.querySelector('.question-options');
        const mcqClone = mcqOptionsTemplate.content.cloneNode(true);
        questionOptions.appendChild(mcqClone);
        questionsSection.appendChild(clone);
    };

    addQuestionBtn.addEventListener('click', addQuestion);

    questionsSection.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-question-btn')) {
            if (e.target.closest('.sub-question-item')) {
                e.target.closest('.sub-question-item').remove();
            } else {
                e.target.closest('.question-item').remove();
            }
        }
        if (e.target.classList.contains('add-option-btn')) {
            const mcqOptionsSection = e.target.closest('.mcq-options-section');
            const optionItem = document.createElement('div');
            optionItem.classList.add('option-item');
            const optionIndex = mcqOptionsSection.querySelectorAll('.option-item').length;
            optionItem.innerHTML = `
                <input type="text" placeholder="Option ${optionIndex + 1}" class="option-text" />
                <input type="radio" name="correct-option-${questionsSection.children.length}" value="${optionIndex}" /> Correct
            `;
            mcqOptionsSection.insertBefore(optionItem, e.target);
        }
        if (e.target.classList.contains('add-matching-pair-btn')) {
            const matchingSection = e.target.closest('.matching-section');
            const matchingPair = document.createElement('div');
            matchingPair.classList.add('matching-pair');
            matchingPair.innerHTML = `
                <input type="text" placeholder="Prompt" class="prompt" />
                <input type="text" placeholder="Correct Match" class="correct-match" />
            `;
            matchingSection.insertBefore(matchingPair, e.target);
        }
        if (e.target.classList.contains('add-sub-question-btn')) {
            const subQuestionsSection = e.target.closest('.video-section').querySelector('.sub-questions-section');
            const clone = subQuestionTemplate.content.cloneNode(true);
            subQuestionsSection.appendChild(clone);
        }
    });

    questionsSection.addEventListener('change', (e) => {
        if (e.target.classList.contains('question-type')) {
            const questionItem = e.target.closest('.question-item, .sub-question-item');
            const questionOptions = questionItem.querySelector('.question-options');
            questionOptions.innerHTML = '';
            switch (e.target.value) {
                case 'MCQ_single_answer':
                case 'MCQ_multiple_answers':
                    questionOptions.appendChild(mcqOptionsTemplate.content.cloneNode(true));
                    break;
                case 'True/False':
                    questionOptions.appendChild(tfOptionsTemplate.content.cloneNode(true));
                    break;
                case 'Short_Answer':
                    questionOptions.appendChild(saOptionsTemplate.content.cloneNode(true));
                    break;
                case 'fill_in_the_blanks':
                    questionOptions.appendChild(fillInTheBlankOptionsTemplate.content.cloneNode(true));
                    break;
                case 'Matching':
                    questionOptions.appendChild(matchingOptionsTemplate.content.cloneNode(true));
                    break;
                case 'Video':
                    questionOptions.appendChild(videoOptionsTemplate.content.cloneNode(true));
                    break;
            }
        }
    });

    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const className = classSelect.value;
        if (!className) {
            alert('Please select a class before submitting the quiz.');
            return;
        }

        const quizData = {
            subject_name: subjectSelect.value || null, // This is just informational
            class_name: className,
            title: document.getElementById('quiz-title').value,
            description: document.getElementById('quiz-description').value,
            time_limit: parseInt(document.getElementById('time-limit').value),
            start_time: document.getElementById('start-time').value,
            end_time: document.getElementById('end-time').value,
            randomize_questions: document.getElementById('randomize-questions').checked,
            is_active: document.getElementById('is-active').checked,
            is_team_based: document.getElementById('is-team-based').checked, // Added this line
            questions: []
        };

        questionsSection.querySelectorAll('.question-item').forEach((questionItem, index) => {
            const questionType = questionItem.querySelector('.question-type').value;
            const questionText = questionItem.querySelector('.question-text').value;
            const questionPoints = parseInt(questionItem.querySelector('.question-points').value);

            if (!questionText.trim()) {
                alert(`Question ${index + 1}: Question text cannot be empty.`);
                e.preventDefault(); // Stop form submission
                return;
            }

            if (isNaN(questionPoints) || questionPoints <= 0) {
                alert(`Question ${index + 1}: Points must be a positive number.`);
                e.preventDefault(); // Stop form submission
                return;
            }

            const question = {
                question_text: questionText,
                question_type: questionType,
                points: questionPoints, // Add points here
                time_limit: parseInt(questionItem.querySelector('.question-time-limit').value),
                order: index,
                options: [],
                matching_pairs: [],
                correct_answer: ''
            };

            if (questionType === 'MCQ_single_answer' || questionType === 'MCQ_multiple_answers') {
                questionItem.querySelectorAll('.option-item').forEach((option, optionIndex) => {
                    question.options.push({ 
                        option_text: option.querySelector('.option-text').value,
                        is_correct: option.querySelector('input[type="radio"], input[type="checkbox"]').checked
                    });
                });
            } else if (questionType === 'True/False') {
                question.options = [
                    { option_text: 'True', is_correct: questionItem.querySelector('input[value="True"]').checked },
                    { option_text: 'False', is_correct: questionItem.querySelector('input[value="False"]').checked }
                ];
            } else if (questionType === 'Short_Answer') {
                question.correct_answer = questionItem.querySelector('textarea').value;
            } else if (questionType === 'fill_in_the_blanks') {
                question.correct_answer = questionItem.querySelector('.correct-answer').value;
            } else if (questionType === 'Matching') {
                questionItem.querySelectorAll('.matching-pair').forEach(pair => {
                    question.matching_pairs.push({
                        prompt: pair.querySelector('.prompt').value,
                        correct_match: pair.querySelector('.correct-match').value
                    });
                });
            } else if (questionType === 'Video') {
                question.media_url = questionItem.querySelector('.video-url').value;
                question.sub_questions = [];
                const subQuestionsSection = questionItem.querySelector('.sub-questions-section');
                subQuestionsSection.querySelectorAll('.sub-question-item').forEach((subQuestionItem, subIndex) => {
                    const subQuestionType = subQuestionItem.querySelector('.question-type').value;
                    const subQuestion = {
                        question_text: subQuestionItem.querySelector('.question-text').value,
                        question_type: subQuestionType,
                        order: subIndex,
                        options: [],
                        correct_answer: ''
                    };

                    if (subQuestionType === 'MCQ_single_answer' || subQuestionType === 'MCQ_multiple_answers') {
                        subQuestionItem.querySelectorAll('.option-item').forEach((option, optionIndex) => {
                            subQuestion.options.push({ 
                                option_text: option.querySelector('.option-text').value,
                                is_correct: option.querySelector('input[type="radio"], input[type="checkbox"]').checked
                            });
                        });
                    } else if (subQuestionType === 'True/False') {
                        subQuestion.options = [
                            { option_text: 'True', is_correct: subQuestionItem.querySelector('input[value="True"]').checked },
                            { option_text: 'False', is_correct: subQuestionItem.querySelector('input[value="False"]').checked }
                        ];
                    } else if (subQuestionType === 'Short_Answer') {
                        subQuestion.correct_answer = subQuestionItem.querySelector('textarea').value;
                    } else if (subQuestionType === 'Fill-in-the-Blank') {
                        subQuestion.correct_answer = subQuestionItem.querySelector('.correct-answer').value;
                    }
                    question.sub_questions.push(subQuestion);
                });
            }

            quizData.questions.push(question);
        });

        try {
            console.log('=== FRONTEND: Sending quiz data ===');
            console.log('Quiz data being sent:', quizData);
            console.log('Subject ID being sent:', quizData.subject_id);
            console.log('Subject ID type:', typeof quizData.subject_id);
            
            const token = localStorage.getItem('token');
            let response;
            let method;
            let url;

            if (quizId) {
                // Editing existing quiz
                method = 'PATCH';
                url = `http://localhost:3001/api/quizzes/${quizId}`;
            } else {
                // Creating new quiz
                method = 'POST';
                url = 'http://localhost:3001/api/quizzes';
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(quizData)
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response from server:', result);
            
            if (response.ok) {
                alert(`Quiz ${quizId ? 'updated' : 'created'} successfully!`);
                if (!quizId) { // Only reset form if it's a new quiz
                    quizForm.reset();
                    questionsSection.innerHTML = '';
                    addQuestion();
                }
            } else {
                alert(`Failed to ${quizId ? 'update' : 'create'} quiz: ${result.message || result.error}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert(`Failed to ${quizId ? 'update' : 'create'} quiz due to network error.`);
        }
    });

    fetchSubjects();
    if (!quizId) { // Only add a default question if creating a new quiz
        addQuestion();
    }
});
