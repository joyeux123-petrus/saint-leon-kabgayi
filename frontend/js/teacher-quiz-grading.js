document.addEventListener('DOMContentLoaded', async () => {
    const mainOptionsMenu = document.getElementById('main-options-menu');
    const markStudentsBtn = document.getElementById('mark-students-btn');
    const pendingAttemptsListContainer = document.getElementById('pending-attempts-list-container');
    const pendingAttemptsList = document.getElementById('pending-attempts-list');

    const getToken = () => localStorage.getItem('token');

    const authenticatedFetch = async (url, options = {}) => {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            // Add other headers if necessary, e.g., 'Accept': 'application/json'
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
        // Check for non-OK responses and throw error with message
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
        }
        return response;
    };

    const fetchPendingAttempts = async () => {
        pendingAttemptsList.innerHTML = '<p>Loading pending attempts...</p>'; // Show loading message
        try {
            const response = await authenticatedFetch('/api/quizzes/attempts/teacher/pending-review');
            const attempts = await response.json();

            if (attempts.length === 0) {
                pendingAttemptsList.innerHTML = '<p>No quiz attempts currently require manual grading.</p>';
                return;
            }

            pendingAttemptsList.innerHTML = attempts.map(attempt => `
                <div class="attempt-card">
                    <div class="attempt-card-info">
                        <p><strong>Quiz:</strong> ${attempt.quiz_title}</p>
                        <p><strong>Student:</strong> ${attempt.student_name} (${attempt.student_class})</p>
                        <p><strong>Submitted:</strong> ${new Date(attempt.submitted_at).toLocaleString()}</p>
                    </div>
                    <div class="attempt-card-actions">
                        <button onclick="viewAttemptDetails(${attempt.attempt_id})">View & Grade</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error fetching pending attempts:', error);
            pendingAttemptsList.innerHTML = `<p>Error loading pending attempts: ${error.message}.</p>`;
        }
    };

    // Global function to navigate to attempt details
    window.viewAttemptDetails = (attemptId) => {
        window.location.href = `quiz-attempt-details.html?attemptId=${attemptId}&teacherView=true`;
    };

    // Event listener for "Mark Students" button
    markStudentsBtn.addEventListener('click', () => {
        mainOptionsMenu.style.display = 'none'; // Hide the main options
        pendingAttemptsListContainer.style.display = 'block'; // Show the pending attempts list
        fetchPendingAttempts(); // Fetch and display pending attempts
    });

    // Initially, hide the pending attempts list until "Mark Students" is clicked
    pendingAttemptsListContainer.style.display = 'none';
});