
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.sidebar-nav-item a');
    const contentSections = document.querySelectorAll('.content-section');
    const userProfileDropdown = document.querySelector('.user-profile-dropdown');

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    // User Profile Dropdown
    if (userProfileDropdown) {
        const userProfile = userProfileDropdown.querySelector('.user-profile');
        userProfile.addEventListener('click', () => {
            userProfileDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userProfileDropdown.contains(e.target)) {
                userProfileDropdown.classList.remove('active');
            }
        });
    }

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            // Update active link
            navLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');

            // Show target content section
            contentSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            if (targetId === 'user-management') {
                fetchPendingUsers();
            }
            if (targetId === 'quiz-learning') {
                fetchAdminQuizzes();
            }
            if (targetId === 'clubs-activities') {
                fetchClubs();
            }
            if (targetId === 'events-announcements') {
                document.querySelector('#events-announcements .primary').addEventListener('click', () => {
                    console.log('Create Event button clicked');
                });
                document.querySelector('#events-announcements .secondary').addEventListener('click', () => {
                    console.log('Post Announcement button clicked');
                });
            }
            if (targetId === 'holy-gospel') {
                document.querySelector('#holy-gospel .primary').addEventListener('click', () => {
                    const content = document.querySelector('#holy-gospel textarea').value;
                    publishGospel(content);
                });
            }
            if (targetId === 'leaderboard-performance') {
                fetchLeaderboard();
            }
        });
    });

    async function fetchLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const { leaderboard } = await response.json();
            const leaderboardContainer = document.querySelector('.leaderboard-top-students');
            leaderboardContainer.innerHTML = ''; // Clear existing content

            leaderboard.forEach((student, index) => {
                const rank = index + 1;
                let badgeClass = '';
                let icon = '';
                if (rank === 1) {
                    badgeClass = 'gold';
                    icon = 'fas fa-trophy';
                } else if (rank === 2) {
                    badgeClass = 'silver';
                    icon = 'fas fa-medal';
                } else if (rank === 3) {
                    badgeClass = 'bronze';
                    icon = 'fas fa-medal';
                }

                const studentCard = document.createElement('div');
                studentCard.className = `student-badge-card ${badgeClass}`;
                studentCard.innerHTML = `
                    <i class="${icon} rank-icon"></i>
                    <h4>${student.name}</h4>
                    <p>Rank ${rank}</p>
                `;
                leaderboardContainer.appendChild(studentCard);
            });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }

    async function publishGospel(content) {
        try {
            const response = await fetch('/api/gospel/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            if (!response.ok) {
                throw new Error('Failed to publish gospel');
            }
            document.querySelector('#holy-gospel textarea').value = '';
            alert('Gospel published successfully');
        } catch (error) {
            console.error('Error publishing gospel:', error);
        }
    }

    async function fetchClubs() {
        try {
            const response = await fetch('/api/clubs');
            if (!response.ok) {
                throw new Error('Failed to fetch clubs');
            }
            const { clubs } = await response.json();
            const tbody = document.querySelector('#clubs-activities .table tbody');
            tbody.innerHTML = ''; // Clear existing rows
            clubs.forEach(club => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${club.name}</td>
                    <td>${club.leader}</td>
                    <td>${club.members}</td>
                    <td>
                        <button class="action-btn reject" data-club-id="${club.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to the new delete buttons
            document.querySelectorAll('#clubs-activities .reject').forEach(button => {
                button.addEventListener('click', (e) => {
                    const clubId = e.target.dataset.clubId;
                    deleteClub(clubId);
                });
            });

        } catch (error) {
            console.error('Error fetching clubs:', error);
        }
    }

    async function deleteClub(clubId) {
        try {
            const response = await fetch(`/api/clubs/${clubId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to delete club');
            }
            fetchClubs(); // Refresh the list
        } catch (error) {
            console.error('Error deleting club:', error);
        }
    }

    async function fetchAdminQuizzes() {
        try {
            const response = await fetch('/api/quizzes/admin');
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            const { quizzes } = await response.json();
            const tbody = document.querySelector('#quiz-learning .table tbody');
            tbody.innerHTML = ''; // Clear existing rows
            quizzes.forEach(quiz => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${quiz.title}</td>
                    <td>${quiz.subject}</td>
                    <td>${quiz.teacher}</td>
                    <td>${new Date(quiz.date_created).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn secondary">Edit</button>
                        <button class="action-btn reject" data-quiz-id="${quiz.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to the new delete buttons
            document.querySelectorAll('#quiz-learning .reject').forEach(button => {
                button.addEventListener('click', (e) => {
                    const quizId = e.target.dataset.quizId;
                    deleteQuiz(quizId);
                });
            });

        } catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    }

    async function deleteQuiz(quizId) {
        try {
            const response = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to delete quiz');
            }
            fetchAdminQuizzes(); // Refresh the list
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    }

    // Timeline Animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    timelineItems.forEach(item => {
        observer.observe(item);
    });

    // Accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    // Chart.js Example
    const userReportCtx = document.getElementById('user-report-chart');
    if (userReportCtx) {
        new Chart(userReportCtx, {
            type: 'bar',
            data: {
                labels: ['Students', 'Teachers', 'Admins'],
                datasets: [{
                    label: '# of Users',
                    data: [1250, 50, 3],
                    backgroundColor: [
                        'rgba(26, 188, 156, 0.7)',
                        'rgba(212, 175, 55, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        '#1ABC9C',
                        '#D4AF37',
                        '#FF6384'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async function fetchPendingUsers() {
        try {
            const response = await fetch('/api/users/pending');
            if (!response.ok) {
                throw new Error('Failed to fetch pending users');
            }
            const users = await response.json();
            const tbody = document.querySelector('#user-management .table tbody');
            tbody.innerHTML = ''; // Clear existing rows
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.class || 'N/A'}</td>
                    <td>${user.district || 'N/A'}</td>
                    <td>${user.parish || 'N/A'}</td>
                    <td>
                        <button class="action-btn approve" data-user-id="${user.id}">Approve</button>
                        <button class="action-btn reject" data-user-id="${user.id}">Reject</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add event listeners to the new buttons
            document.querySelectorAll('.approve').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.dataset.userId;
                    approveUser(userId);
                });
            });

            document.querySelectorAll('.reject').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.dataset.userId;
                    rejectUser(userId);
                });
            });

        } catch (error) {
            console.error('Error fetching pending users:', error);
        }
    }

    async function approveUser(userId) {
        try {
            const response = await fetch(`/api/users/approve/${userId}`, { method: 'PUT' });
            if (!response.ok) {
                throw new Error('Failed to approve user');
            }
            fetchPendingUsers(); // Refresh the list
        } catch (error) {
            console.error('Error approving user:', error);
        }
    }

    async function rejectUser(userId) {
        try {
            const response = await fetch(`/api/users/reject/${userId}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to reject user');
            }
            fetchPendingUsers(); // Refresh the list
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    }

    // Initially load pending users if the user management section is active
    if (document.querySelector('#user-management.active')) {
        fetchPendingUsers();
    }

    async function fetchDashboardStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            const stats = await response.json();

            document.querySelector('#dashboard-overview .stat-card:nth-child(1) .stat-number').textContent = stats.totalStudents;
            document.querySelector('#dashboard-overview .stat-card:nth-child(2) .stat-number').textContent = stats.totalTeachers;
            document.querySelector('#dashboard-overview .stat-card:nth-child(3) .stat-number').textContent = stats.pendingSignups;
            document.querySelector('#dashboard-overview .stat-card:nth-child(4) .stat-number').textContent = stats.totalQuizzes;
            document.querySelector('#dashboard-overview .stat-card:nth-child(5) .stat-number').textContent = stats.totalClubs;
            document.querySelector('#dashboard-overview .stat-card:nth-child(6) .stat-number').textContent = stats.upcomingEvents;

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }

    fetchDashboardStats();
});
