document.addEventListener('DOMContentLoaded', () => {
    const getAuthToken = () => localStorage.getItem('token');

    // --- UI Elements ---
    const welcomeMessage = document.getElementById('welcome-message');
    const eventsList = document.getElementById('events-list');
    const announcementsList = document.getElementById('announcements-list');
    const leaderboardList = document.getElementById('leaderboard-list');
    const recentQuizzesList = document.getElementById('recent-quizzes-list');
    const gospelContent = document.getElementById('gospel-content');
    const logoutBtn = document.getElementById('logout-btn');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const profileNameNav = document.getElementById('profile-name-nav');

    // --- Stat Elements ---
    const totalStudentsEl = document.getElementById('total-students');
    const averageGradeEl = document.getElementById('average-grade');
    const quizzesGradedEl = document.getElementById('quizzes-graded');
    const pendingSubmissionsEl = document.getElementById('pending-submissions');

    // --- Navigation ---
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // Profile Dropdown Logic
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', () => {
            profileDropdownMenu.classList.toggle('active');
        });

        window.addEventListener('click', (e) => {
            if (!profileDropdownBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
                profileDropdownMenu.classList.remove('active');
            }
        });
    }

    // --- Logout ---
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    // --- Date & Time ---
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
        document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // --- Data Fetching Functions ---
    const fetchData = async (url, options = {}) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            return null;
        }
    };

    const fetchAndDisplayTeacherName = async (token) => {
        const userData = await fetchData('/api/users/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userData) {
            const name = userData.full_name || userData.username || 'Teacher';
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${name}!`;
            }
            if (profileNameNav) {
                profileNameNav.textContent = name;
            }
        }
    };

    const fetchEvents = async (token) => {
        const events = await fetchData('/api/events?status=upcoming&limit=3', { headers: { 'Authorization': `Bearer ${token}` } });
        if (events && eventsList) {
            if (events.length > 0) {
                eventsList.innerHTML = events.map(event => `
                    <div class="event-item">
                        <div class="event-date">${new Date(event.event_date).toLocaleDateString()}</div>
                        <div>${event.title}</div>
                    </div>
                `).join('');
            } else {
                eventsList.innerHTML = '<p>No upcoming events.</p>';
            }
        }
    };

    const fetchAnnouncements = async (token) => {
        const announcements = await fetchData('/api/announcements?sort=newest&limit=3', { headers: { 'Authorization': `Bearer ${token}` } });
        if (announcements && announcementsList) {
            if (announcements.length > 0) {
                announcementsList.innerHTML = announcements.map(ann => `
                    <div class="announcement-item">
                        <strong>${ann.title}:</strong> ${ann.content}
                    </div>
                `).join('');
            } else {
                announcementsList.innerHTML = '<p>No new announcements.</p>';
            }
        }
    };

    const fetchLeaderboard = async (token) => {
        const leaderboard = await fetchData('/api/leaderboard/overall?limit=3', { headers: { 'Authorization': `Bearer ${token}` } });
        if (leaderboard && leaderboardList) {
            if (leaderboard.length > 0) {
                leaderboardList.innerHTML = leaderboard.map((entry, index) => `
                    <div class="leader-item">
                        <div>
                            <div class="leader-rank">${index + 1}</div>
                            <span style="margin-left: 10px;">${entry.student_name} - ${entry.total_score}%</span>
                        </div>
                    </div>
                `).join('');
            } else {
                leaderboardList.innerHTML = '<p>No leaderboard data available.</p>';
            }
        }
    };

    const fetchRecentQuizzes = async (token) => {
        const quizzes = await fetchData('/api/quizzes?sort=newest&limit=2', { headers: { 'Authorization': `Bearer ${token}` } });
        if (quizzes && recentQuizzesList) {
            if (quizzes.length > 0) {
                recentQuizzesList.innerHTML = quizzes.map(quiz => `
                    <div class="quiz-item">
                        <div><strong>${quiz.title}</strong></div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">Subject: ${quiz.subject_name || 'N/A'}</div>
                    </div>
                `).join('');
            } else {
                recentQuizzesList.innerHTML = '<p>No recent quizzes found.</p>';
            }
        }
    };

    const fetchGospel = async () => {
        const gospelData = await fetchData('/api/gospel');
        if (gospelData && gospelContent) {
            gospelContent.innerHTML = `
                "${gospelData.text}"
                <div style="text-align: right; margin-top: 10px; font-weight: 600; color: #ff9800;">
                    - ${gospelData.reference}
                </div>
            `;
        } else if (gospelContent) {
            gospelContent.innerHTML = '<p>Could not load Gospel of the Day.</p>';
        }
    };

    const fetchDashboardStats = async (token) => {
        // These would ideally come from a dedicated stats endpoint, 
        // but we can simulate or fetch from different sources for now.
        const analytics = await fetchData('/api/analytics/teacher-summary', { headers: { 'Authorization': `Bearer ${token}` } });
        if(analytics) {
            if(totalStudentsEl) totalStudentsEl.textContent = analytics.total_students || 0;
            if(averageGradeEl) averageGradeEl.textContent = `${analytics.average_grade || 0}%`;
            if(quizzesGradedEl) quizzesGradedEl.textContent = analytics.quizzes_graded || 0;
            if(pendingSubmissionsEl) pendingSubmissionsEl.textContent = analytics.pending_submissions || 0;
        }
    };

    // --- Initial Load ---
    const initializeDashboard = () => {
        const token = getAuthToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        fetchAndDisplayTeacherName(token);
        fetchEvents(token);
        fetchAnnouncements(token);
        fetchLeaderboard(token);
        fetchRecentQuizzes(token);
        fetchGospel();
        fetchDashboardStats(token); // This is a new function that needs a new endpoint
    };

    initializeDashboard();
});
