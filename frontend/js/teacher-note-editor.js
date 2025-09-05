document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const noteForm = document.getElementById('note-form');
    const editorTitle = document.getElementById('editor-title');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    const noteVisibilitySelect = document.getElementById('note-visibility');
    const noteClassNameInput = document.getElementById('note-class-name');
    const noteSubjectSelect = document.getElementById('note-subject');

    // Input fields
    const noteIdInput = document.getElementById('note-id');
    const noteTitleInput = document.getElementById('note-title');
    const noteDescriptionInput = document.getElementById('note-description');
    const noteTagsInput = document.getElementById('note-tags');
    const noteEstimatedDurationInput = document.getElementById('note-estimated-duration');
    const noteStatusSelect = document.getElementById('note-status');
    const notePublishAtInput = document.getElementById('note-publish-at');
    const noteExpiresAtInput = document.getElementById('note-expires-at');

    // New feature fields
    const shareWithTeachersInput = document.getElementById('share-with-teachers');
    const studentSuggestionsSelect = document.getElementById('student-suggestions');
    const pointsPerSectionInput = document.getElementById('points-per-section');
    const badgeForCompletionInput = document.getElementById('badge-for-completion');
    const studentCommentsSelect = document.getElementById('student-comments');
    const studentAnnotationsSelect = document.getElementById('student-annotations');
    const studentQaSelect = document.getElementById('student-qa');

    // Templates
    const sectionTemplate = document.getElementById('section-template');
    const questionTemplate = document.getElementById('question-template');
    const optionTemplate = document.getElementById('option-template');
    const matchingPairTemplate = document.getElementById('matching-pair-template');
    const fillInTheBlanksTemplate = document.getElementById('fill-in-the-blanks-template');
    const correctAnswerTemplate = document.getElementById('correct-answer-template');

    const apiBaseUrl = '/api/notes';
    let editingNoteId = null;

    // --- Utility Functions ---
    const getNoteIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('noteId');
    };

    // --- API Functions ---
    const authenticatedFetch = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        };

        // Conditionally set Content-Type for JSON bodies
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) return;
        return response.json();
    };

    const getNoteDetails = async (noteId) => {
        try {
            const note = await authenticatedFetch(`${apiBaseUrl}/${noteId}`);
            populateForm(note);
        } catch (error) {
            console.error('Error fetching note details:', error);
            alert('Could not load note for editing.');
            window.location.href = 'teacher-mynotes.html';
        }
    };

    const getSubjects = async () => {
        try {
            const subjects = await authenticatedFetch('/api/subjects');
            noteSubjectSelect.innerHTML = '<option value="">Select a subject</option>';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.name;
                option.textContent = subject.name;
                noteSubjectSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching subjects:', error);
            noteSubjectSelect.innerHTML = '<option value="">Could not load subjects</option>';
        }
    };

    // --- Form Population ---
    const populateForm = (note) => {
        editorTitle.textContent = 'Edit Note';
        noteIdInput.value = note.id;
        noteTitleInput.value = note.title;
        noteDescriptionInput.value = note.description;
        noteSubjectSelect.value = note.subject_name;
        noteVisibilitySelect.value = note.visibility;
        noteTagsInput.value = note.tags || '';
        noteEstimatedDurationInput.value = note.estimated_duration || '';
        noteStatusSelect.value = note.status || 'draft';
        notePublishAtInput.value = note.publish_at ? new Date(note.publish_at).toISOString().slice(0, 16) : '';
        noteExpiresAtInput.value = note.expires_at ? new Date(note.expires_at).toISOString().slice(0, 16) : '';

        // Populate new feature fields
        shareWithTeachersInput.value = note.shared_with || '';
        studentSuggestionsSelect.value = note.student_suggestions || 'disabled';
        pointsPerSectionInput.value = note.points_per_section || '';
        badgeForCompletionInput.value = note.badge_for_completion || '';
        studentCommentsSelect.value = note.student_comments || 'enabled';
        studentAnnotationsSelect.value = note.student_annotations || 'enabled';
        studentQaSelect.value = note.student_qa || 'enabled';

        if (note.visibility === 'class') {
            noteClassNameInput.value = note.class_name;
            noteClassNameInput.classList.remove('hidden');
        }

        if (note.sections && note.sections.length > 0) {
            note.sections.forEach(addSection);
        } else {
            addSection(); // Add a default empty section if none exist
        }
    };

    // --- Dynamic Form Element Functions (Sections, Questions, Options) ---
    const addSection = (sectionData = null) => {
        const sectionNode = sectionTemplate.content.cloneNode(true);
        const sectionElement = sectionNode.querySelector('.section-item');
        const knowledgeCheckContainer = sectionElement.querySelector('.knowledge-check-container');

        if (sectionData) {
            sectionElement.querySelector('.section-title').value = sectionData.title;
            sectionElement.querySelector('.section-content').value = sectionData.content;
            sectionElement.querySelector('.section-time').value = sectionData.estimated_time || '';
            if (sectionData.knowledge_check && sectionData.knowledge_check.length > 0) {
                sectionData.knowledge_check.forEach(q => addQuestion(knowledgeCheckContainer, q));
            }
        }

        sectionsContainer.appendChild(sectionNode);
    };

    const addQuestion = (container, questionData = null) => {
        const questionNode = questionTemplate.content.cloneNode(true);
        const questionElement = questionNode.querySelector('.question-item');
        const questionTypeSelect = questionElement.querySelector('.question-type');
        const optionsContainer = questionElement.querySelector('.options-container');

        if (questionData) {
            questionTypeSelect.value = questionData.question_type;
            if(questionData.question_text) {
                questionElement.querySelector('.question-text').value = questionData.question_text;
            }
            if(questionData.explanation) {
                questionElement.querySelector('.question-explanation').value = questionData.explanation;
            }
            if(questionData.correct_answer) {
                const correctAnswerNode = correctAnswerTemplate.content.cloneNode(true);
                correctAnswerNode.querySelector('.correct-answer-input').value = questionData.correct_answer;
                optionsContainer.parentNode.insertBefore(correctAnswerNode, optionsContainer.nextSibling);
            }

            if (questionData.question_type === 'Matching' && questionData.matching_pairs) {
                questionData.matching_pairs.forEach(pair => addMatchingPair(optionsContainer, pair));
            } else if (questionData.options && questionData.options.length > 0) {
                questionData.options.forEach(opt => addOption(optionsContainer, opt));
            }
        }

        updateQuestionUI(questionElement);
        container.appendChild(questionNode);
    };

    const addOption = (container, optionData = null) => {
        if (!container) {
            console.error('addOption: container is null');
            return;
        }
        const optionNode = optionTemplate.content.cloneNode(true);
        const optionElement = optionNode.querySelector('.option-item');
        const radio = optionElement.querySelector('.correct-option-radio');

        const questionElement = container.closest('.question-item');
        if (!questionElement) {
            console.error('addOption: questionElement is null');
            return;
        }
        const questionId = questionElement.dataset.questionId;
        radio.name = `correct-option-group-${questionId}`;

        if (optionData) {
            optionElement.querySelector('.option-text').value = optionData.option_text;
            if (optionData.is_correct) {
                radio.checked = true;
            }
        }
        container.appendChild(optionNode);
    };

    const addMatchingPair = (container, pairData = null) => {
        const pairNode = matchingPairTemplate.content.cloneNode(true);
        if (pairData) {
            pairNode.querySelector('.matching-term').value = pairData.term;
            pairNode.querySelector('.matching-definition').value = pairData.definition;
        }
        container.appendChild(pairNode);
    };

    const updateQuestionUI = (questionElement) => {
        if (!questionElement) {
            console.error('updateQuestionUI: questionElement is null');
            return;
        }
        const type = questionElement.querySelector('.question-type').value;
        const optionsContainer = questionElement.querySelector('.options-container');
        const addOptionBtn = questionElement.querySelector('.add-option-btn');
        const correctAnswerInput = questionElement.querySelector('.correct-answer-input');

        if (!optionsContainer) {
            console.error('updateQuestionUI: optionsContainer not found');
            return;
        }

        // Clear existing options and correct answer input
        optionsContainer.innerHTML = '';
        if (correctAnswerInput) correctAnswerInput.closest('.correct-answer-item').remove();

        if (type === 'MCQ') {
            optionsContainer.style.display = 'block';
            if (addOptionBtn) {
                addOptionBtn.style.display = 'block';
                addOptionBtn.textContent = 'Add Option';
            }
            addOption(optionsContainer); // Add a few default options
            addOption(optionsContainer);
        } else if (type === 'True/False') {
            optionsContainer.style.display = 'block';
            if (addOptionBtn) addOptionBtn.style.display = 'none';
            addOption(optionsContainer, { option_text: 'True', is_correct: false });
            addOption(optionsContainer, { option_text: 'False', is_correct: false });
        } else if (type === 'Matching') {
            optionsContainer.style.display = 'block';
            if (addOptionBtn) {
                addOptionBtn.style.display = 'block';
                addOptionBtn.textContent = 'Add Pair';
            }
            addMatchingPair(optionsContainer);
            addMatchingPair(optionsContainer);
        } else if (type === 'FillInTheBlanks' || type === 'ShortAnswer' || type === 'Open-ended' || type === 'Peer-Graded' || type === 'Video') {
            optionsContainer.style.display = 'none';
            if (addOptionBtn) addOptionBtn.style.display = 'none';
            const correctAnswerNode = correctAnswerTemplate.content.cloneNode(true);
            optionsContainer.parentNode.insertBefore(correctAnswerNode, optionsContainer.nextSibling);

            if (type === 'FillInTheBlanks') {
                const fillInTheBlanksNode = fillInTheBlanksTemplate.content.cloneNode(true);
                optionsContainer.parentNode.insertBefore(fillInTheBlanksNode, optionsContainer.nextSibling);
            }
        } else { // Default case, e.g., if a new type is added without specific UI
            optionsContainer.style.display = 'none';
            if (addOptionBtn) addOptionBtn.style.display = 'none';
        }
    };

    // --- Event Listeners ---
    addSectionBtn.addEventListener('click', () => addSection());

    noteVisibilitySelect.addEventListener('change', (e) => {
        noteClassNameInput.classList.toggle('hidden', e.target.value !== 'class');
    });

    // Event delegation for the whole form
    noteForm.addEventListener('click', (e) => {
        const { target } = e;

        if (target.closest('.add-question-dropdown-toggle')) {
            const menu = target.closest('.relative').querySelector('.add-question-menu');
            menu.classList.toggle('hidden');
        }

        if (target.classList.contains('delete-section-btn')) {
            target.closest('.section-item').remove();
            // Ensure at least one section remains
            if (sectionsContainer.children.length === 0) {
                addSection();
            }
        }
        if (target.classList.contains('add-question-btn')) {
            e.preventDefault();
            const container = target.closest('.knowledge-check-wrapper').querySelector('.knowledge-check-container');
            addQuestion(container, { question_type: target.dataset.type });
            target.closest('.add-question-menu').classList.add('hidden');
        }
        if (target.classList.contains('delete-question-btn')) {
            target.closest('.question-item').remove();
        }
        if (target.classList.contains('add-option-btn')) {
            const questionElement = target.closest('.question-item');
            const type = questionElement.querySelector('.question-type').value;
            const container = questionElement.querySelector('.options-container');
            if (type === 'MCQ') {
                addOption(container);
            } else if (type === 'Matching') {
                addMatchingPair(container);
            }
        }
        if (target.classList.contains('delete-option-btn')) {
            target.closest('.option-item').remove();
        }
        if (target.classList.contains('delete-matching-pair-btn')) {
            target.closest('.matching-pair-item').remove();
        }
        if (target.classList.contains('move-section-up-btn')) {
            const sectionItem = target.closest('.section-item');
            const previousSection = sectionItem.previousElementSibling;
            if (previousSection) {
                sectionsContainer.insertBefore(sectionItem, previousSection);
            }
        }
        if (target.classList.contains('move-section-down-btn')) {
            const sectionItem = target.closest('.section-item');
            const nextSection = sectionItem.nextElementSibling;
            if (nextSection) {
                sectionsContainer.insertBefore(nextSection, sectionItem);
            }
        }
    });

    noteForm.addEventListener('change', (e) => {
        if (e.target.classList.contains('question-type')) {
            updateQuestionUI(e.target.closest('.question-item'));
        }
    });

    // Handle form submission
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Defensive check: Ensure at least one section element exists in the DOM
        const existingSectionElements = document.querySelectorAll('#sections-container .section-item');
        if (existingSectionElements.length === 0) {
            addSection(); // Add a default empty section if none exist
            alert('A note must have at least one section. An empty section has been added for you.');
            return; // Stop submission and let the user fill the new section
        }

        const sections = [];
        existingSectionElements.forEach(sectionEl => {
            const knowledge_check = [];
            sectionEl.querySelectorAll('.question-item').forEach(questionEl => {
                let options = [];
                let matching_pairs = [];
                let correct_answer = null;

                const question_type = questionEl.querySelector('.question-type').value;
                
                if (question_type === 'MCQ' || question_type === 'True/False') {
                    questionEl.querySelectorAll('.option-item').forEach(optionEl => {
                        options.push({
                            option_text: optionEl.querySelector('.option-text').value,
                            is_correct: optionEl.querySelector('.correct-option-radio').checked,
                        });
                    });
                } else if (question_type === 'Matching') {
                    questionEl.querySelectorAll('.matching-pair-item').forEach(pairEl => {
                        matching_pairs.push({
                            prompt: pairEl.querySelector('.matching-term').value,
                            correct_match: pairEl.querySelector('.matching-definition').value,
                        });
                    });
                } else if (question_type === 'FillInTheBlanks' || question_type === 'ShortAnswer' || question_type === 'Open-ended' || question_type === 'Peer-Graded' || question_type === 'Video') {
                    correct_answer = questionEl.querySelector('.correct-answer-input').value;
                }

                knowledge_check.push({
                    question_text: questionEl.querySelector('.question-text').value,
                    question_type: question_type,
                    explanation: questionEl.querySelector('.question-explanation').value,
                    options: options,
                    matching_pairs: matching_pairs,
                    correct_answer: correct_answer,
                });
            });

            sections.push({
                title: sectionEl.querySelector('.section-title').value,
                content: sectionEl.querySelector('.section-content').value,
                estimated_time: sectionEl.querySelector('.section-time').value || null,
                knowledge_check: knowledge_check,
            });
        });

        // Client-side validation for sections
        if (sections.length === 0) {
            alert('At least one section is required for the note.');
            return;
        }
        for (const section of sections) {
            if (!section.title || section.title.trim() === '') {
                alert('All sections must have a title.');
                return;
            }
        }

        const noteData = {
            title: noteTitleInput.value,
            description: noteDescriptionInput.value,
            subject_name: noteSubjectSelect.value,
            visibility: noteVisibilitySelect.value,
            class_name: noteVisibilitySelect.value === 'class' ? noteClassNameInput.value : null,
            sections: sections,
            tags: noteTagsInput.value,
            estimated_duration: noteEstimatedDurationInput.value || null,
            status: noteStatusSelect.value,
            publish_at: notePublishAtInput.value || null,
            expires_at: noteExpiresAtInput.value || null,
            // New feature data
            shared_with: shareWithTeachersInput.value,
            student_suggestions: studentSuggestionsSelect.value,
            points_per_section: pointsPerSectionInput.value || null,
            badge_for_completion: badgeForCompletionInput.value,
            student_comments: studentCommentsSelect.value,
            student_annotations: studentAnnotationsSelect.value,
            student_qa: studentQaSelect.value,
        };

        try {
            const url = editingNoteId ? `${apiBaseUrl}/${editingNoteId}` : apiBaseUrl;
            const method = editingNoteId ? 'PUT' : 'POST';

            const formData = new FormData();
            // Append all text fields
            for (const key in noteData) {
                if (key !== 'sections') { // Sections will be handled separately
                    formData.append(key, noteData[key]);
                }
            }

            // Append sections and their knowledge checks
            sections.forEach((section, sectionIndex) => {
                formData.append(`sections[${sectionIndex}][title]`, section.title);
                formData.append(`sections[${sectionIndex}][content]`, section.content);
                formData.append(`sections[${sectionIndex}][estimated_time]`, section.estimated_time || '');

                section.knowledge_check.forEach((question, questionIndex) => {
                    formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][question_text]`, question.question_text);
                    formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][question_type]`, question.question_type);
                    formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][explanation]`, question.explanation);

                    if (question.correct_answer) {
                        formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][correct_answer]`, question.correct_answer);
                    }

                    if (question.options && question.options.length > 0) {
                        question.options.forEach((option, optionIndex) => {
                            formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][options][${optionIndex}][option_text]`, option.option_text);
                            formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][options][${optionIndex}][is_correct]`, option.is_correct);
                            if (option.term) formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][options][${optionIndex}][term]`, option.term);
                            if (option.definition) formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][options][${optionIndex}][definition]`, option.definition);
                        });
                    }

                    if (question.matching_pairs && question.matching_pairs.length > 0) {
                        question.matching_pairs.forEach((pair, pairIndex) => {
                            formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][matching_pairs][${pairIndex}][prompt]`, pair.prompt);
                            formData.append(`sections[${sectionIndex}][knowledge_check][${questionIndex}][matching_pairs][${pairIndex}][correct_match]`, pair.correct_match);
                        });
                    }
                });
            });

            // Append files
            document.querySelectorAll('.section-attachments').forEach(input => {
                for (let i = 0; i < input.files.length; i++) {
                    formData.append('attachments', input.files[i]);
                }
            });
            
            await authenticatedFetch(url, {
                method,
                body: formData,
                headers: {
                    // Content-Type header is automatically set to multipart/form-data when using FormData
                    // Do NOT set it manually, or boundary will be missing
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            alert('Note saved successfully!');
            window.location.href = 'teacher-mynotes.html';
        } catch (error) {
            console.error('Error saving note:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // --- Initial Load ---
    const initialize = async () => {
        await getSubjects(); // Wait for subjects to load before populating form
        editingNoteId = getNoteIdFromUrl();
        if (editingNoteId) {
            getNoteDetails(editingNoteId);
        } else {
            editorTitle.textContent = 'Create Note';
            addSection(); // Add one empty section for new notes
        }
    };

    initialize();
});