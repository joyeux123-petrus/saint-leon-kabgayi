    const getAuthToken = () => localStorage.getItem('token');
    const getStudentId = () => localStorage.getItem('student_id'); // Assuming student_id is stored here

    const quizzesList = document.getElementById('quizzes-list');
    const quizResultsList = document.getElementById('quiz-results-list');
    const leaderboardTableBody = document.getElementById('leaderboard-table-body');

    const fetchQuizzes = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch('/api/quizzes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const quizzes = await response.json();
            renderQuizzes(quizzes);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    };

    const renderQuizzes = (quizzes) => {
        quizzesList.innerHTML = '';
        if (!quizzes || quizzes.length === 0) {
            quizzesList.innerHTML = '<p>No quizzes available.</p>';
            return;
        }
        quizzes.forEach(quiz => {
            const quizCard = document.createElement('div');
            quizCard.className = 'bg-white p-4 rounded-lg shadow-md';
            quizCard.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">${quiz.title}</h3>
                <p class="text-sm text-gray-600">Subject: ${quiz.subject_name}</p>
                <p class="text-sm text-gray-600">Teacher: ${quiz.teacher_name}</p>
                <button class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 take-quiz-btn" data-id="${quiz.id}">Take Quiz</button>
            `;
            quizzesList.appendChild(quizCard);
        });
    };

    const fetchStudentQuizAttempts = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch('/api/quizzes/attempts/student', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const attempts = await response.json();
            renderQuizAttempts(attempts);
        } catch (error) {
            console.error('Error fetching student quiz attempts:', error);
        }
    };

    const renderQuizAttempts = (attempts) => {
        quizResultsList.innerHTML = '';
        if (!attempts || attempts.length === 0) {
            quizResultsList.innerHTML = '<p>No quiz results available.</p>';
            return;
        }
        attempts.forEach(attempt => {
            const attemptCard = document.createElement('div');
            attemptCard.className = 'bg-white p-4 rounded-lg shadow-md';
            attemptCard.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">${attempt.quiz_title}</h3>
                <p class="text-sm text-gray-600">Score: ${attempt.score !== null ? attempt.score : 'N/A'}</p>
                <p class="text-sm text-gray-600">Date: ${new Date(attempt.attempt_date).toLocaleDateString()}</p>
                <button class="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 view-attempt-details-btn" data-id="${attempt.id}">View Details</button>
            `;
            quizResultsList.appendChild(attemptCard);
        });
    };

    const fetchOverallLeaderboard = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch('/api/leaderboard/overall', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const leaderboardData = await response.json();
            renderOverallLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching overall leaderboard:', error);
        }
    };

    const renderOverallLeaderboard = (data) => {
        leaderboardTableBody.innerHTML = '';
        if (!data || data.length === 0) {
            leaderboardTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">No leaderboard data available.</td></tr>';
            return;
        }
        data.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4 border-b border-gray-200">${entry.rank}</td>
                <td class="py-2 px-4 border-b border-gray-200">${entry.student_name}</td>
                <td class="py-2 px-4 border-b border-gray-200">${entry.total_score}</td>
            `;
            leaderboardTableBody.appendChild(row);
        });
    };

    const showSection = (sectionId) => {
        document.querySelectorAll('main .content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';

        // Update active link in sidebar
        document.querySelectorAll('.sidebar .menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.sidebar .menu-item[data-section="${sectionId.replace('-section', '')}"]`).classList.add('active');


        if (sectionId === 'my-quizzes-section') {
            fetchQuizzes();
        } else if (sectionId === 'my-results-section') {
            fetchStudentQuizAttempts();
        } else if (sectionId === 'leaderboard') { // This is still 'leaderboard' in HTML
            fetchOverallLeaderboard();
        } else if (sectionId === 'dashboard') { // Ensure dashboard loads its initial data
            fetchStudentPerformanceAnalytics();
            // Potentially fetch mini-leaderboard, notifications, gospel, events here
        }
    };

    // Event listener for sidebar navigation
    document.querySelectorAll('.sidebar .menu-item').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = item.dataset.section;
            // Special handling for sections that are not directly mapped to an ID
            // For example, if 'quizzes' in sidebar maps to 'my-quizzes-section'
            let targetSectionId = sectionId;
            if (sectionId === 'my-quizzes') {
                targetSectionId = 'my-quizzes-section';
            } else if (sectionId === 'my-results') {
                targetSectionId = 'my-results-section';
            }
            showSection(targetSectionId);
        });
    });

    // Initial load
    showSection('dashboard'); // Show dashboard by default

    // Existing code for notes and analytics
    const searchStudentNotesInput = document.getElementById('search-student-notes-input');
    const studentSubjectFilter = document.getElementById('student-subject-filter');
    const studentClassFilter = document.getElementById('student-class-filter');
    const studentSortFilter = document.getElementById('student-sort-filter');
    const studentNotesList = document.getElementById('student-notes-list');
    const studentNoteDetailModal = document.getElementById('student-note-detail-modal');
    const studentNoteDetailTitle = document.getElementById('student-note-detail-title');
    const studentNoteDetailContent = document.getElementById('student-note-detail-content');
    const closeStudentDetailModal = document.getElementById('close-student-detail-modal');
    let currentNoteId = null;

    const fetchStudentNotes = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            let url = '/api/notes';
            const params = new URLSearchParams();
            if (searchStudentNotesInput.value) params.append('q', searchStudentNotesInput.value);
            if (studentSubjectFilter.value) params.append('subject', studentSubjectFilter.value);
            if (studentClassFilter.value) params.append('class', studentClassFilter.value);
            if (studentSortFilter.value) params.append('sort', studentSortFilter.value);
            if (params.toString()) url = `/api/notes/search?${params.toString()}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const notes = await response.json();
            renderStudentNotes(notes);
        } catch (error) {
            console.error('Error fetching student notes:', error);
        }
    };

    const renderStudentNotes = (notes) => {
        studentNotesList.innerHTML = '';
        if (!notes || notes.length === 0) {
            studentNotesList.innerHTML = '<p>No notes found.</p>';
            return;
        }
        notes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.innerHTML = `
                <h3 class="note-card-title">${note.title}</h3>
                <p class="note-card-description">${note.description || ''}</p>
                <div class="note-card-footer">
                    <span>${note.class_name}</span>
                    <span>${new Date(note.upload_date).toLocaleDateString()}</span>
                </div>
                <div class="note-card-actions">
                    <button class="btn view-btn" data-id="${note.id}">View</button>
                </div>
            `;
            studentNotesList.appendChild(noteCard);
        });
    };

    const openStudentDetailModal = async (noteId) => {
        currentNoteId = noteId;
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/notes/${noteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const note = await response.json();
            studentNoteDetailTitle.textContent = note.title;
            let content = `
                <p><strong>Description:</strong> ${note.description}</p>
                <p><strong>File:</strong> <a href="/backend${note.file_url}" target="_blank">View File</a></p>
                <h4>AI Enhancements</h4>
                <div id="student-ai-enhancements-content"></div>
                <h4>My Annotations</h4>
                <div id="student-note-annotations-content"></div>
                <h4>Interactions</h4>
                <div id="student-note-interactions-content"></div>
                <h4>AI Q&A</h4>
                <div id="student-ai-qna-content">
                    <textarea id="qna-question-input" class="form-control" rows="3" placeholder="Ask a question about the note..."></textarea>
                    <button id="ask-qna-btn" class="btn">Ask Question</button>
                    <div id="qna-answer-output"></div>
                </div>
            `;
            studentNoteDetailContent.innerHTML = content;
            studentNoteDetailModal.style.display = 'block';

            // Add event listener for the new ask button
            document.getElementById('ask-qna-btn').addEventListener('click', handleAskQuestion);

        } catch (error) {
            console.error('Error fetching note details:', error);
        }
    };

    const closeStudentDetailModalHandler = () => {
        studentNoteDetailModal.style.display = 'none';
    };

    const handleAskQuestion = async () => {
        const question = document.getElementById('qna-question-input').value;
        if (!question) return;

        const qnaAnswerOutput = document.getElementById('qna-answer-output');
        qnaAnswerOutput.textContent = 'Thinking...';

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/notes/${currentNoteId}/qna`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question })
            });
            const data = await response.json();
            qnaAnswerOutput.textContent = data.answer;
        } catch (error) {
            console.error('Error asking AI question:', error);
            qnaAnswerOutput.textContent = 'Failed to get an answer.';
        }
    };

    const fetchSubjects = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/subjects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const subjects = await response.json();
            populateSubjectDropdown(subjects, studentSubjectFilter);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const populateSubjectDropdown = (subjects, dropdown) => {
        dropdown.innerHTML = '<option value="">All Subjects</option>';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            dropdown.appendChild(option);
        });
    };

    const fetchStudentPerformanceAnalytics = async () => {
        const studentId = getStudentId();
        const token = getAuthToken();

        if (!studentId || !token) {
            console.warn('Student ID or token not found. Cannot fetch performance analytics.');
            return;
        }

        try {
            const response = await fetch(`/api/analytics/student-performance/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch student performance analytics.');
            }H

            const analyticsData = await response.json();
            document.getElementById('avg-score').textContent = analyticsData.average_score ? analyticsData.average_score.toFixed(2) : 'N/A';
            document.getElementById('total-attempts').textContent = analyticsData.num_attempts || '0';

        } catch (error) {
            console.error('Error fetching student performance analytics:', error);
            document.getElementById('avg-score').textContent = 'Error';
            document.getElementById('total-attempts').textContent = 'Error';
        }
    };

    studentNotesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            openStudentDetailModal(e.target.dataset.id);
        }
    });

    // Event listener for "Take Quiz" buttons
    quizzesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('take-quiz-btn')) {
            const quizId = e.target.dataset.id;
            window.location.href = `take-quiz.html?quizId=${quizId}`;
        }
    });

    // Event listener for "View Details" buttons
    quizResultsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-attempt-details-btn')) {
            const attemptId = e.target.dataset.id;
            window.location.href = `quiz-attempt-details-student.html?attemptId=${attemptId}`;
        }
    });

    closeStudentDetailModal.addEventListener('click', closeStudentDetailModalHandler);
    searchStudentNotesInput.addEventListener('input', fetchStudentNotes);
    studentSubjectFilter.addEventListener('change', fetchStudentNotes);
    studentClassFilter.addEventListener('change', fetchStudentNotes);
    studentSortFilter.addEventListener('change', fetchStudentNotes);

    fetchSubjects();
    fetchStudentNotes();
    fetchStudentPerformanceAnalytics(); // Call the new function
});