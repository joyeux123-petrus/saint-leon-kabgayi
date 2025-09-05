document.addEventListener('DOMContentLoaded', () => {
    const quizzesList = document.getElementById('quizzes-list');

    const getAuthToken = () => localStorage.getItem('token');

    async function fetchData(endpoint, options = {}) {
        const token = getAuthToken();
        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error fetching from ${endpoint}:`, errorData); // Log the full error data
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    const renderQuizzes = async () => {
        quizzesList.innerHTML = '<p class="text-gray-500">Loading quizzes...</p>';
        try {
            // Fetch quizzes for the current teacher
            const quizzes = await fetchData('/api/quizzes/teacher'); // Backend should filter by teacher_id based on token
            console.log('Fetched quizzes for teacher:', quizzes);

            if (quizzes && quizzes.length > 0) {
                quizzesList.innerHTML = quizzes.map(quiz => `
                    <div class="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${quiz.title}</h3>
                            <p class="text-gray-600 text-sm">Subject: ${quiz.subject_name || 'N/A'} | Class: ${quiz.class_name || 'N/A'}</p>
                            <p class="text-gray-600 text-sm">Questions: ${quiz.questions ? quiz.questions.length : 0}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition edit-quiz-btn" data-quiz-id="${quiz.id}">Edit</button>
                            <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition delete-quiz-btn" data-quiz-id="${quiz.id}">Delete</button>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.edit-quiz-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const quizId = event.target.dataset.quizId;
                        window.location.href = `quiz.html?quizId=${quizId}`;
                    });
                });

                document.querySelectorAll('.delete-quiz-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const quizId = event.target.dataset.quizId;
                        if (confirm('Are you sure you want to delete this quiz?')) {
                            try {
                                await fetchData(`/api/quizzes/${quizId}`, { method: 'DELETE' });
                                alert('Quiz deleted successfully!');
                                renderQuizzes(); // Re-render the list after deletion
                            } catch (error) {
                                console.error('Error deleting quiz:', error);
                                alert('Failed to delete quiz. Please try again.');
                            }
                        }
                    });
                });

            } else {
                quizzesList.innerHTML = '<p class="text-gray-500">No quizzes created yet. Click "Create New Quiz" to get started.</p>';
            }
        } catch (error) {
            console.error('Error rendering quizzes:', error);
            quizzesList.innerHTML = '<p class="text-red-500">Error loading quizzes. Please try again.</p>';
        }
    };

    // Initial render of quizzes
    renderQuizzes();
});
