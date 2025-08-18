// student-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle'); // New sidebar toggle button
    const mobileMenuButtonMain = document.querySelector('.header .mobile-menu-button-main');
    const userProfileDropdown = document.querySelector('.user-profile-dropdown');
    const userProfileTrigger = document.querySelector('.user-profile-trigger');
    const menuItems = document.querySelectorAll('.menu-item'); // Select menu items directly
    const contentSections = document.querySelectorAll('.content-section');

    // Function to toggle sidebar visibility and main content margin
    const toggleSidebar = () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    };

    // Event listener for the new sidebar toggle button
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Event listener for the mobile menu button in the main header (now also toggles sidebar)
    if (mobileMenuButtonMain) {
        mobileMenuButtonMain.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Function to show a specific content section
    const showSection = (sectionId) => {
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update active class in sidebar menu
        menuItems.forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-item[data-section="${sectionId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
        }
    };

    // Event listeners for menu items to switch sections
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = item.dataset.section;
            showSection(sectionId);

            // Specific actions for sections that need data fetching
            if (sectionId === 'courses') {
                fetchNotes();
                fetchEnrolledCourses();
                fetchQuizzes(); // Also fetch quizzes when courses section is active
            } else if (sectionId === 'quizzes') {
                fetchQuizzes();
            } else if (sectionId === 'clubs') {
                fetchMyClubs();
                fetchExploreClubs();
            } else if (sectionId === 'chat') {
                fetchChatGroups();
            }
        });
    });

    // Toggle user profile dropdown
    if (userProfileTrigger && userProfileDropdown) {
        userProfileTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            userProfileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!userProfileDropdown.contains(event.target)) {
                userProfileDropdown.classList.remove('active');
            }
        });
    }

    // Placeholder for dropdown actions
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            alert(`Action for: ${event.target.textContent.trim()} (This is a placeholder action)`);
            userProfileDropdown.classList.remove('active');
        });
    });

    const API_BASE_URL = 'http://localhost:3001/api';

    const fetchDashboardData = async () => {
        try {
            // Fetch User Profile
            const userId = '1'; // Placeholder user ID
            const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
            
            if (!userResponse.ok) {
                if (userResponse.status === 404) {
                    console.error('User not found with ID:', userId);
                    // Create a default user object for demo purposes
                    const defaultUser = {
                        name: 'Demo Student',
                        studentId: 'STU001',
                        profilePic: 'https://via.placeholder.com/40'
                    };
                    document.querySelector('.user-name').textContent = defaultUser.name;
                    document.querySelector('.user-id').textContent = `ID: ${defaultUser.studentId}`;
                    document.getElementById('welcome-user-name').textContent = defaultUser.name;
                    document.querySelector('.profile-pic').src = defaultUser.profilePic;
                    return;
                }
                throw new Error(`HTTP error! status: ${userResponse.status}`);
            }
            
            // Check if response has content
            const contentType = userResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format: expected JSON');
            }
            
            const userData = await userResponse.json();
            console.log('User data received:', userData);
            
            if (userData) {
                document.querySelector('.user-name').textContent = userData.name || 'Student Name';
                document.querySelector('.user-id').textContent = `ID: ${userData.studentId || 'N/A'}`;
                document.getElementById('welcome-user-name').textContent = userData.name || 'Student';
                document.querySelector('.profile-pic').src = userData.profilePic || 'https://via.placeholder.com/40';
            }

            // Fetch Mini Leaderboard
            const leaderboardResponse = await fetch(`${API_BASE_URL}/leaderboard`);
            const leaderboardData = await leaderboardResponse.json();
            const miniLeaderboardList = document.getElementById('mini-leaderboard-list');
            if (miniLeaderboardList && leaderboardData && leaderboardData.length > 0) {
                // Display top 3 students for mini leaderboard
                miniLeaderboardList.innerHTML = leaderboardData.slice(0, 3).map(student =>
                    `<li><span>${student.name}</span><span>${student.score}</span></li>`
                ).join('');
            } else if (miniLeaderboardList) {
                miniLeaderboardList.innerHTML = '<li>No leaderboard data.</li>';
            }

            // Fetch Announcements for Notifications
            const announcementsResponse = await fetch(`${API_BASE_URL}/announcements`);
            const announcementsData = await announcementsResponse.json();
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList && announcementsData && announcementsData.length > 0) {
                notificationsList.innerHTML = announcementsData.slice(0, 3).map(announcement =>
                    `<li>${announcement.title}: ${announcement.message}</li>`
                ).join('');
            } else if (notificationsList) {
                notificationsList.innerHTML = '<li>No recent notifications.</li>';
            }

            // Fetch Gospel and Spiritual Events
            fetchGospelOfTheDay();
            fetchSpiritualEvents();

            // Fetch Academic Summary
            const academicSummaryResponse = await fetch(`${API_BASE_URL}/academic-summary`);
            const academicSummaryData = await academicSummaryResponse.json();
            if (academicSummaryData) {
                document.getElementById('summary-courses-count').textContent = academicSummaryData.coursesEnrolled || '0';
                document.getElementById('summary-assignments-count').textContent = academicSummaryData.upcomingAssignments || '0';
                document.getElementById('summary-quiz-avg').textContent = `${academicSummaryData.avgQuizScore || '0'}%`;
                // Update progress ring styles if needed based on fetched data
                document.querySelector('.progress-ring:nth-child(1) .progress-fill').style.setProperty('--progress', academicSummaryData.avgQuizScore || '0');
                document.querySelector('.progress-ring:nth-child(2) .progress-fill').style.setProperty('--progress', academicSummaryData.coursesEnrolled * 10 || '0'); // Assuming max 10 courses for visual
                document.querySelector('.progress-ring:nth-child(3) .progress-fill').style.setProperty('--progress', academicSummaryData.upcomingAssignments * 10 || '0'); // Assuming max 10 assignments for visual
            }

            

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Display user-friendly error messages
            document.getElementById('mini-leaderboard-list').innerHTML = '<li>Error loading leaderboard.</li>';
            document.getElementById('notifications-list').innerHTML = '<li>Error loading notifications.</li>';
            document.getElementById('gospel-content').innerHTML = '<li>Error loading Gospel.</li>';
        }
    };

    // New function to fetch notes
    const fetchNotes = async () => {
        try {
            const notesResponse = await fetch(`${API_BASE_URL}/notes`); // Assuming a /api/notes endpoint
            const notesData = await notesResponse.json();
            const teacherNotesList = document.getElementById('teacher-notes-list');
            if (teacherNotesList && notesData && notesData.length > 0) {
                teacherNotesList.innerHTML = notesData.map(note =>
                    `<li><a href="${note.url}" target="_blank">${note.title} (${note.class})</a></li>`
                ).join('');
            } else if (teacherNotesList) {
                teacherNotesList.innerHTML = '<li>No notes available.</li>';
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            document.getElementById('teacher-notes-list').innerHTML = '<li>Error loading notes.</li>';
        }
    };

    // New function to fetch quizzes
    const fetchQuizzes = async () => {
        try {
            const quizzesResponse = await fetch(`${API_BASE_URL}/quizzes`); // Assuming a /api/quizzes endpoint
            const quizzesData = await quizzesResponse.json();
            const upcomingQuizzesList = document.getElementById('upcoming-quizzes-list');
            if (upcomingQuizzesList && quizzesData && quizzesData.length > 0) {
                upcomingQuizzesList.innerHTML = quizzesData.map(quiz =>
                    `<li><a href="#" data-quiz-id="${quiz.id}">${quiz.title} - Due: ${new Date(quiz.dueDate).toLocaleDateString()}</a></li>`
                ).join('');
            } else if (upcomingQuizzesList) {
                upcomingQuizzesList.innerHTML = '<li>No upcoming quizzes.</li>';
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            document.getElementById('upcoming-quizzes-list').innerHTML = '<li>Error loading quizzes.</li>';
        }
    };

    // New function to fetch enrolled courses
    const fetchEnrolledCourses = async () => {
        try {
            const coursesResponse = await fetch(`${API_BASE_URL}/courses/enrolled`); // Assuming a /api/courses/enrolled endpoint
            const coursesData = await coursesResponse.json();
            const fullCoursesList = document.getElementById('full-courses-list');
            if (fullCoursesList && coursesData && coursesData.length > 0) {
                fullCoursesList.innerHTML = coursesData.map(course =>
                    `<li><a href="#" data-course-id="${course.id}">${course.title} (${course.progress || 0}%)</a></li>`
                ).join('');
            } else if (fullCoursesList) {
                fullCoursesList.innerHTML = '<li>No enrolled courses.</li>';
            }
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            document.getElementById('full-courses-list').innerHTML = '<li>Error loading enrolled courses.</li>';
        }
    };

    // New function to fetch user's clubs
    const fetchMyClubs = async () => {
        try {
            const myClubsResponse = await fetch(`${API_BASE_URL}/clubs/my`); // Assuming a /api/clubs/my endpoint
            const myClubsData = await myClubsResponse.json();
            const myClubsList = document.getElementById('my-clubs-list');
            if (myClubsList && myClubsData && myClubsData.length > 0) {
                myClubsList.innerHTML = myClubsData.map(club =>
                    `<li><a href="#" data-club-id="${club.id}">${club.name}</a></li>`
                ).join('');
            } else if (myClubsList) {
                myClubsList.innerHTML = '<li>No clubs joined.</li>';
            }
        } catch (error) {
            console.error('Error fetching my clubs:', error);
            document.getElementById('my-clubs-list').innerHTML = '<li>Error loading your clubs.</li>';
        }
    };

    // New function to fetch clubs to explore
    const fetchExploreClubs = async () => {
        try {
            const exploreClubsResponse = await fetch(`${API_BASE_URL}/clubs/explore`); // Assuming a /api/clubs/explore endpoint
            const exploreClubsData = await exploreClubsResponse.json();
            const exploreClubsList = document.getElementById('explore-clubs-list');
            if (exploreClubsList && exploreClubsData && exploreClubsData.length > 0) {
                exploreClubsList.innerHTML = exploreClubsData.map(club =>
                    `<li><a href="#" data-club-id="${club.id}">${club.name} (${club.members} members)</a></li>`
                ).join('');
            } else if (exploreClubsList) {
                exploreClubsList.innerHTML = '<li>No other clubs to explore.</li>';
            }
        } catch (error) {
            console.error('Error fetching clubs to explore:', error);
            document.getElementById('explore-clubs-list').innerHTML = '<li>Error loading other clubs.</li>';
        }
    };

    // New function to fetch chat groups
    const fetchChatGroups = async () => {
        try {
            const chatGroupsResponse = await fetch(`${API_BASE_URL}/chat/groups`); // Assuming /api/chat/groups endpoint
            const chatGroupsData = await chatGroupsResponse.json();
            const chatGroupsList = document.getElementById('chat-groups-list');
            if (chatGroupsList && chatGroupsData && chatGroupsData.length > 0) {
                chatGroupsList.innerHTML = chatGroupsData.map(group =>
                    `<li><a href="#" data-group-id="${group.id}">${group.name}</a></li>`
                ).join('');

                // Add event listeners to chat group items
                chatGroupsList.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        const groupId = event.target.dataset.groupId;
                        const groupName = event.target.textContent;
                        document.getElementById('current-chat-group-name').textContent = groupName;
                        fetchChatMessages(groupId);
                    });
                });

            } else if (chatGroupsList) {
                chatGroupsList.innerHTML = '<li>No chat groups available.</li>';
            }
        } catch (error) {
            console.error('Error fetching chat groups:', error);
            document.getElementById('chat-groups-list').innerHTML = '<li>Error loading chat groups.</li>';
        }
    };

    // New function to fetch chat messages for a specific group
    const fetchChatMessages = async (groupId) => {
        try {
            const chatMessagesResponse = await fetch(`${API_BASE_URL}/chat/messages/${groupId}`); // Assuming /api/chat/messages/:groupId endpoint
            const chatMessagesData = await chatMessagesResponse.json();
            const chatMessagesDisplay = document.getElementById('chat-messages-display');
            if (chatMessagesDisplay && chatMessagesData && chatMessagesData.length > 0) {
                chatMessagesDisplay.innerHTML = chatMessagesData.map(message =>
                    `<div class="chat-message"><strong>${message.sender}:</strong> ${message.text}</div>`
                ).join('');
                chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll to bottom
            } else if (chatMessagesDisplay) {
                chatMessagesDisplay.innerHTML = '<div class="chat-message">No messages yet.</div>';
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            document.getElementById('chat-messages-display').innerHTML = '<div class="chat-message">Error loading messages.</div>';
        }
    };

    // New function to send a chat message
    const sendMessage = async (groupId, messageText) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ groupId, message: messageText }),
            });
            if (response.ok) {
                // Message sent successfully, re-fetch messages to update display
                fetchChatMessages(groupId);
                document.getElementById('chat-message-input').value = ''; // Clear input
            } else {
                console.error('Failed to send message');
                alert('Failed to send message.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message.');
        }
    };

    // New function to fetch Gospel of the Day
    const fetchGospelOfTheDay = async () => {
        try {
            const gospelUrl = `${API_BASE_URL}/gospel`;
            console.log('Fetching Gospel from:', gospelUrl);
            const gospelResponse = await fetch(gospelUrl);
            console.log('Gospel API raw response:', gospelResponse);

            if (!gospelResponse.ok) {
                throw new Error(`HTTP error! status: ${gospelResponse.status}`);
            }

            const gospelData = await gospelResponse.json();
            console.log('Gospel API parsed data:', gospelData);

            const gospelContent = document.getElementById('gospel-content');
            if (gospelContent && gospelData && gospelData.content) {
                gospelContent.innerHTML = `<p>${gospelData.content}</p>`;
            } else if (gospelContent) {
                gospelContent.innerHTML = '<p>No Gospel for today.</p>';
            }
        } catch (error) {
            console.error('Error fetching Gospel of the Day:', error);
            document.getElementById('gospel-content').innerHTML = '<li>Error loading Gospel.</li>';
        }
    };

    // New function to fetch Upcoming Spiritual Events
    const fetchSpiritualEvents = async () => {
        try {
            const eventsResponse = await fetch(`${API_BASE_URL}/events?type=spiritual`); // Using query parameter for type
            const eventsData = await eventsResponse.json();
            const spiritualEventsList = document.getElementById('spiritual-events-list');
            if (spiritualEventsList && eventsData && eventsData.events && eventsData.events.length > 0) {
                spiritualEventsList.innerHTML = eventsData.events.map(event =>
                    `<li>${event.title} - ${new Date(event.date).toLocaleDateString()}</li>`
                ).join('');
            } else if (spiritualEventsList) {
                spiritualEventsList.innerHTML = '<li>No upcoming events.</li>';
            }
        } catch (error) {
            console.error('Error fetching spiritual events:', error);
            document.getElementById('spiritual-events-list').innerHTML = '<li>Error loading spiritual events.</li>';
        }
    };

    // New function to fetch Timetable data
    const fetchTimetable = async () => {
        try {
            const timetableResponse = await fetch(`${API_BASE_URL}/timetable`); // Assuming /api/timetable endpoint
            const timetableData = await timetableResponse.json();
            // Assuming there's a dedicated section or modal for timetable display
            // For now, let's just log it and show an alert
            console.log('Timetable Data:', timetableData);
            alert('Timetable data fetched. Check console for details.');
            // You would typically render this data into a specific HTML element
        } catch (error) {
            console.error('Error fetching timetable:', error);
            alert('Error loading timetable.');
        }
    };

    // Initial data fetch and section display
    fetchDashboardData();
    showSection('dashboard'); // Ensure dashboard is shown on load

    // Add event listeners for interactive buttons (placeholders)
    document.querySelectorAll('.action-btn, .view-all-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionTarget = button.dataset.sectionTarget;
            if (sectionTarget) {
                showSection(sectionTarget);
            } else if (button.dataset.sectionTarget === 'timetable') {
                fetchTimetable();
            } else if (button.dataset.sectionTarget === 'notes') {
                showSection('courses'); // Navigate to courses section where notes are displayed
            } else {
                alert(`Action for: ${event.target.textContent.trim()} (This is a placeholder action)`);
            }
        });
    });

    // Handle logout action
    document.querySelectorAll('a[href="#logout-action"]').forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                });
                if (response.ok) {
                    alert('Logged out successfully!');
                    window.location.href = 'login.html'; // Redirect to login page
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    });
});