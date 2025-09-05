document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const currentSectionTitle = document.getElementById('current-section-title');
    const userProfileDropdown = document.querySelector('.user-profile-dropdown');
    const noteDetailModal = document.getElementById('note-detail-modal');
    const closeModalButton = noteDetailModal.querySelector('.close-button');
    const mainContent = document.querySelector('.main-content');
    const welcomeMessage = document.getElementById('welcome-message');

    // --- AI Tutor Elements ---
    const chatToggle = document.getElementById('chat-toggle');
    const aiTutorChat = document.getElementById('ai-tutor-chat');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInputField = document.getElementById('chat-input-field');
    const chatMessages = document.getElementById('chat-messages');

    // --- Helper Functions ---
    const getAuthToken = () => localStorage.getItem('token'); // Assuming token is stored in localStorage

    async function fetchData(endpoint) {
        const token = getAuthToken();
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 401) { // Unauthorized
                    console.error('Unauthorized: Token might be invalid or expired. Redirecting to login.');
                    window.location.href = 'login.html'; // Redirect to login page
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    async function postData(endpoint, data) {
        const token = getAuthToken();
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                if (response.status === 401) { // Unauthorized
                    console.error('Unauthorized: Token might be invalid or expired. Redirecting to login.');
                    window.location.href = 'login.html'; // Redirect to login page
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error posting to ${endpoint}:`, error);
            return null;
        }
    }

    // --- User Profile & Logout ---
    const profileNameNav = document.getElementById('profile-name-nav');
    const logoutBtn = document.getElementById('logout-btn');

    async function loadUserProfile() {
        const user = await fetchData('/api/users/profile');
        if (user) {
            const name = user.full_name || user.username || 'Student';
            if (profileNameNav) {
                profileNameNav.textContent = name;
            }
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${name}!`;
            }
        } else {
            if (profileNameNav) {
                profileNameNav.textContent = 'User'; // Fallback
            }
            if (welcomeMessage) {
                welcomeMessage.textContent = 'Welcome, Student!'; // Fallback
            }
        }
    }

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const response = await postData('/api/logout', {});
        if (response && response.message === 'Logged out successfully') {
            localStorage.removeItem('token');
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            console.error('Logout failed:', response);
            alert('Logout failed. Please try again.');
        }
    });

    // --- Sidebar & Navigation ---
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        });
    });

    profileDropdownBtn.addEventListener('click', () => {
        profileDropdownMenu.classList.toggle('active');
    });

    window.addEventListener('click', (e) => {
        if (!profileDropdownBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
            profileDropdownMenu.classList.remove('active');
        }
    });

    // Close modal when close button is clicked
    closeModalButton.addEventListener('click', () => {
        noteDetailModal.style.display = 'none';
        mainContent.style.pointerEvents = 'auto'; // Enable interaction with main content
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === noteDetailModal) {
            noteDetailModal.style.display = 'none';
        }
    });

    // --- Dynamic Content & Filtering ---
    const renderQuizzes = async (filter = {}) => {
        const list = document.getElementById('quizzes-list');
        const response = await fetchData('/api/quizzes?sort=newest&limit=3'); // Endpoint for recent quizzes

        // Accommodate both direct array response and object-wrapped response
        const quizzes = Array.isArray(response) ? response : (response && Array.isArray(response.data)) ? response.data : [];

        if (quizzes.length === 0) {
            list.innerHTML = '<p>No quizzes are available at this time.</p>';
            return;
        }

        let filteredQuizzes = quizzes;
        if (filter.subject) {
            filteredQuizzes = filteredQuizzes.filter(q => q.subject_name === filter.subject);
        }
        if (filter.sort === 'oldest') {
            filteredQuizzes.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        } else { // Default to newest first
            filteredQuizzes.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        }

        list.innerHTML = filteredQuizzes.map(quiz => `
            <div class="dashboard-item quiz-item">
                <h4>${quiz.title}</h4>
                <p>Subject: ${quiz.subject_name || 'General'}</p>
                <button class="btn take-quiz-btn" data-quiz-id="${quiz.quiz_id || quiz.id}">Take Quiz</button>
            </div>
        `).join('');

        // Re-attach event listeners
        document.querySelectorAll('.take-quiz-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const quizId = event.currentTarget.dataset.quizId;
                window.location.href = `take-quiz.html?quiz_id=${quizId}`;
            });
        });
    };

    const renderNotes = async (filter = {}) => {
        const list = document.getElementById('notes-list');
        list.innerHTML = '<p>Loading notes...</p>'; // Add loading indicator
        const notes = await fetchData('/api/notes'); // Assuming /api/notes is the endpoint
        console.log('Fetched notes for student:', notes); // Log fetched notes

        if (!notes || notes.length === 0) {
            list.innerHTML = '<p>No notes available at this time.</p>';
            return;
        }

        let filteredNotes = notes;
        if(filter.subject) filteredNotes = filteredNotes.filter(n => n.subject === filter.subject);
        if(filter.class) filteredNotes = filteredNotes.filter(n => n.class === filter.class);

        list.innerHTML = filteredNotes.map(n => `
            <div class="dashboard-item note-item">
                <h4>${n.title}</h4>
                <p>Subject: ${n.subject_name}</p>
                <button class="btn-view-note" data-note-id="${n.id}">View Note</button>
            </div>`).join('');

        document.querySelectorAll('.btn-view-note').forEach(button => {
            button.addEventListener('click', (event) => {
                const noteId = event.currentTarget.dataset.noteId;
                window.location.href = `professional-notes-viewer.html?noteId=${noteId}`;
            });
        });
    };

    const fetchAnnouncements = async () => {
        const announcements = await fetchData('/api/announcements?sort=newest&limit=3');
        const list = document.getElementById('announcements-list');
        if (announcements && list) {
            if (announcements.length > 0) {
                list.innerHTML = announcements.map(ann => `
                    <div class="announcement-item">
                        <strong>${ann.title}:</strong> ${ann.content}
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p>No new announcements.</p>';
            }
        }
    };

    const fetchEvents = async () => {
        const events = await fetchData('/api/events?status=upcoming&limit=3');
        const list = document.getElementById('events-list');
        if (events && list) {
            if (events.length > 0) {
                list.innerHTML = events.map(event => `
                    <div class="event-item">
                        <div class="event-date">${new Date(event.event_date).toLocaleDateString()}</div>
                        <div>${event.title}</div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p>No upcoming events.</p>';
            }
        }
    };

    const fetchLeaderboard = async () => {
        const leaderboard = await fetchData('/api/leaderboard/overall?limit=3');
        const list = document.getElementById('leaderboard-list');
        if (leaderboard && list) {
            if (leaderboard.length > 0) {
                list.innerHTML = leaderboard.map((entry, index) => `
                    <div class="leader-item">
                        <div>
                            <div class="leader-rank">${index + 1}</div>
                            <span style="margin-left: 10px;">${entry.student_name} - ${entry.total_score}%</span>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p>No leaderboard data available.</p>';
            }
        }
    };

    const fetchGospel = async () => {
        const gospelData = await fetchData('/api/gospel');
        const content = document.getElementById('gospel-content');
        if (gospelData && content) {
            content.innerHTML = `
                "${gospelData.text}"
                <div style="text-align: right; margin-top: 10px; font-weight: 600; color: #ff9800;">
                    - ${gospelData.reference}
                </div>
            `;
        } else if (content) {
            content.innerHTML = '<p>Could not load Gospel of the Day.</p>';
        }
    };

    const renderResults = async (filter = {}) => {
        const list = document.getElementById('quiz-results-list');
        const results = await fetchData('/api/quiz-results'); // Assuming /api/quiz-results is the endpoint
        if (!results) return;

        let filteredResults = results;
        // Add filtering and sorting logic here if needed

        if (filteredResults.length === 0) {
            list.innerHTML = '<p>No quiz results available yet.</p>';
            return;
        }

        list.innerHTML = filteredResults.map(result => `
            <div class="result-card">
                <h4>${result.quiz_title}</h4>
                <p>Score: ${result.score}%</p>
                <p>Date: ${new Date(result.date).toLocaleDateString()}</p>
            </div>
        `).join('');
    };

    

    const renderCourses = async () => {
        const list = document.getElementById('enrolled-courses-list');
        const courses = await fetchData('/api/courses'); // Assuming /api/courses is the endpoint
        if (!Array.isArray(courses)) {
            list.innerHTML = '<p>No courses available.</p>';
            return;
        }
        list.innerHTML = courses.map(course => `
            <div class="course-card">
                <h4>${course.title}</h4>
                <p>${course.description}</p>
                <button class="btn-view-course" data-course-id="${course.id}">View Course</button>
            </div>
        `).join('');
    };

    const renderClubs = async () => {
        const list = document.getElementById('clubs-section').querySelector('.clubs-grid') || document.createElement('div'); // Assuming a clubs-grid inside clubs-section
        if (!list.id) list.id = 'clubs-list'; // Give it an ID if it doesn't have one
        const clubs = await fetchData('/api/clubs'); // Assuming /api/clubs is the endpoint
        if (!Array.isArray(clubs)) {
            list.innerHTML = '<p>No clubs available.</p>';
            return;
        }
        list.innerHTML = clubs.map(club => `
            <div class="club-card">
                <h4>${club.name}</h4>
                <p>${club.description}</p>
                <button class="btn-view-club" data-club-id="${club.id}">View Club</button>
            </div>
        `).join('');
    };

    const renderVaticanNews = async () => {
        const list = document.getElementById('vatican-news-section'); // Assuming a section with this ID
        if (!list) return;
        list.innerHTML = '<h2>Vatican News</h2><p>Loading Vatican News...</p>';
        const news = await fetchData('/api/vatican-news'); // Assuming /api/vatican-news endpoint
        if (!Array.isArray(news)) {
            list.innerHTML = '<h2>Vatican News</h2><p>No news available.</p>';
            return;
        }
        list.innerHTML = '<h2>Vatican News</h2>' + news.map(item => `
            <div class="news-item">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <a href="${item.link}" target="_blank">Read More</a>
            </div>
        `).join('');
    };

    const renderSpiritual = async () => {
        const list = document.getElementById('spiritual-section'); // Assuming a section with this ID
        if (!list) return;
        list.innerHTML = '<h2>Spiritual Content</h2><p>Loading spiritual content...</p>';
        // You might fetch content from an API or load static content here
        const spiritualContent = await fetchData('/api/spiritual'); // Example endpoint
        if (!spiritualContent) {
            list.innerHTML = '<h2>Spiritual Content</h2><p>No spiritual content available.</p>';
            return;
        }
        list.innerHTML = '<h2>Spiritual Content</h2>' + `<p>${spiritualContent.text}</p>`;
    };

    // Function to update current date and time
    function updateDateTime() {
        const now = new Date();
        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };

        document.getElementById('current-date').textContent = now.toLocaleDateString(undefined, optionsDate);
        document.getElementById('current-time').textContent = now.toLocaleTimeString(undefined, optionsTime);
    }

    // Initial calls and set interval for updating time
    updateDateTime();
    setInterval(updateDateTime, 1000);

    loadUserProfile();
    renderQuizzes();
    
    fetchAnnouncements();
    fetchEvents();
    fetchLeaderboard();
    fetchGospel();
    renderResults();
    renderCourses();
    renderClubs();
    renderVaticanNews();
    renderSpiritual();
});