document.addEventListener('DOMContentLoaded', async () => {
    const classSelect = document.getElementById('class-select');
    const subjectSelect = document.getElementById('subject-select');
    const marksDisplay = document.getElementById('marks-display');

    const getToken = () => localStorage.getItem('token');

    const authenticatedFetch = async (url, options = {}) => {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            alert('Session expired or unauthorized. Please log in again.');
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
        }
        return response;
    };

    // Function to fetch and populate subjects based on selected class
    const fetchAndPopulateSubjects = async (className) => {
        subjectSelect.innerHTML = '<option value="">-- Loading Subjects --</option>';
        subjectSelect.disabled = true;
        if (!className) {
            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
            return;
        }
        try {
            // Assuming an API endpoint like /api/subjects?class=Senior%201
            const response = await authenticatedFetch(`/api/subjects?class=${encodeURIComponent(className)}`);
            const subjects = await response.json();

            subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.name; // Assuming subject object has a 'name' property
                option.textContent = subject.name;
                subjectSelect.appendChild(option);
            });
            subjectSelect.disabled = false;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            subjectSelect.innerHTML = '<option value="">-- Error Loading Subjects --</option>';
            alert(`Failed to load subjects: ${error.message}`);
        }
    };

    // Function to fetch and display marks
    const fetchAndDisplayMarks = async (className, subjectName) => {
        marksDisplay.innerHTML = '<p class="no-data-message">Loading marks...</p>';
        if (!className || !subjectName) {
            marksDisplay.innerHTML = '<p class="no-data-message">Please select a class and subject to view marks.</p>';
            return;
        }
        try {
            // Assuming an API endpoint like /api/marks?class=Senior%201&subject=Mathematics
            const response = await authenticatedFetch(`/api/marks?class=${encodeURIComponent(className)}&subject=${encodeURIComponent(subjectName)}`);
            const marksData = await response.json();

            if (marksData.length === 0) {
                marksDisplay.innerHTML = '<p class="no-data-message">No marks found for the selected class and subject.</p>';
                return;
            }

            // Group marks by student and then by quiz date
            const groupedMarks = {};
            marksData.forEach(mark => {
                if (!groupedMarks[mark.student_id]) {
                    groupedMarks[mark.student_id] = {
                        student_name: mark.student_name,
                        quizzes: {}
                    };
                }
                const quizDate = new Date(mark.quiz_date).toLocaleDateString(); // Format date
                if (!groupedMarks[mark.student_id].quizzes[quizDate]) {
                    groupedMarks[mark.student_id].quizzes[quizDate] = [];
                }
                groupedMarks[mark.student_id].quizzes[quizDate].push({
                    quiz_title: mark.quiz_title,
                    score: mark.score,
                    total_score: mark.total_score
                });
            });

            let tableHtml = `
                <table class="marks-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
            `;
            // Dynamically add quiz date headers
            const allQuizDates = Array.from(new Set(marksData.map(mark => new Date(mark.quiz_date).toLocaleDateString()))).sort();
            allQuizDates.forEach(date => {
                tableHtml += `<th>${date}</th>`;
            });
            tableHtml += `
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const studentId in groupedMarks) {
                const student = groupedMarks[studentId];
                tableHtml += `
                    <tr>
                        <td>${student.student_name}</td>
                `;
                allQuizDates.forEach(date => {
                    const quizzesForDate = student.quizzes[date] || [];
                    if (quizzesForDate.length > 0) {
                        tableHtml += `<td>`;
                        quizzesForDate.forEach(quiz => {
                            tableHtml += `<div>${quiz.quiz_title}: ${quiz.score}/${quiz.total_score}</div>`;
                        });
                        tableHtml += `</td>`;
                    } else {
                        tableHtml += `<td>-</td>`; // No quiz for this date
                    }
                });
                tableHtml += `
                    </tr>
                `;
            }

            tableHtml += `
                    </tbody>
                </table>
            `;
            marksDisplay.innerHTML = tableHtml;

        } catch (error) {
            console.error('Error fetching marks:', error);
            marksDisplay.innerHTML = `<p class="no-data-message">Error loading marks: ${error.message}.</p>`;
        }
    };

    // Event Listeners
    classSelect.addEventListener('change', () => {
        const selectedClass = classSelect.value;
        fetchAndPopulateSubjects(selectedClass);
        // Clear marks display when class changes
        marksDisplay.innerHTML = '<p class="no-data-message">Please select a class and subject to view marks.</p>';
    });

    subjectSelect.addEventListener('change', () => {
        const selectedClass = classSelect.value;
        const selectedSubject = subjectSelect.value;
        fetchAndDisplayMarks(selectedClass, selectedSubject);
    });

    // Initial state: disable subject select and show prompt
    subjectSelect.disabled = true;
    marksDisplay.innerHTML = '<p class="no-data-message">Please select a class and subject to view marks.</p>';
});
