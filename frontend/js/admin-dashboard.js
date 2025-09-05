document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuButton && sidebar) {
        mobileMenuButton.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // Fetch and display dashboard analytics
    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics', { headers });
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const data = await res.json();
            document.getElementById('total-users-stat').textContent = data.totalUsers; // Updated ID
            document.getElementById('active-users-stat').textContent = data.totalUsers; // Using totalUsers for active users for now
            document.getElementById('total-subjects-stat').textContent = data.totalSubjects; // Updated ID
            document.getElementById('total-quizzes-stat').textContent = data.totalQuizzes; // Updated ID
            document.getElementById('total-users').textContent = data.totalUsers; // Keep for the card
            document.getElementById('pending-users').textContent = data.pendingUsers; // Keep for the card
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    // Fetch and display pending users
    const fetchPendingUsers = async () => {
        try {
            const res = await fetch('/api/admin/users/pending', { headers });
            if (!res.ok) throw new Error('Failed to fetch pending users');
            const users = await res.json();
            const tableBody = document.getElementById('pending-users-table-body');
            tableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-3 px-4">${user.name}</td>
                    <td class="py-3 px-4">${user.email}</td>
                    <td class="py-3 px-4">${user.role}</td>
                    <td class="py-3 px-4">
                        <button class="action-btn approve px-3 py-1 rounded text-white" data-id="${user.id}">Approve</button>
                        <button class="action-btn reject px-3 py-1 rounded text-white ml-2" data-id="${user.id}">Reject</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching pending users:', error);
        }
    };

    // Handle user actions (approve/reject)
    const handleUserAction = async (action, userId) => {
        const url = `/api/admin/users/${userId}/${action}`;
        const method = action === 'approve' ? 'PATCH' : 'DELETE';
        try {
            const res = await fetch(url, { method, headers });
            if (!res.ok) throw new Error(`Failed to ${action} user`);
            fetchPendingUsers(); // Refresh the list
            fetchAnalytics(); // Refresh analytics
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
        }
    };

    // Add event listener to the table body for delegation
    document.getElementById('pending-users-table-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('approve')) {
            const userId = e.target.dataset.id;
            handleUserAction('approve', userId);
        }
        if (e.target.classList.contains('reject')) {
            const userId = e.target.dataset.id;
            handleUserAction('reject', userId);
        }
    });

    // Fetch and display all users
    const fetchAllUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', { headers });
            if (!res.ok) throw new Error('Failed to fetch all users');
            const users = await res.json();
            const tableBody = document.getElementById('all-users-table-body');
            tableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                let actionButtons = `
                    <button class="action-btn edit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" data-id="${user.id}">Edit</button>
                    <button class="action-btn delete bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" data-id="${user.id}">Delete</button>
                `;
                if (user.role === 'teacher') {
                    actionButtons += `<button class="action-btn assign-subjects bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2" data-id="${user.id}" data-name="${user.name}">Assign Subjects</button>`;
                }
                row.innerHTML = `
                    <td class="py-3 px-4">${user.name}</td>
                    <td class="py-3 px-4">${user.email}</td>
                    <td class="py-3 px-4">${user.role}</td>
                    <td class="py-3 px-4">${user.status}</td>
                    <td class="py-3 px-4">
                        ${actionButtons}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching all users:', error);
        }
    };

    // Handle user actions (edit/delete)
    const handleAllUsersAction = async (action, userId) => {
        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this user?')) return;
            const url = `/api/admin/users/${userId}`;
            try {
                const res = await fetch(url, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete user');
                fetchAllUsers(); // Refresh the list
                fetchAnalytics(); // Refresh analytics
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
        if (action === 'edit') {
            console.log('Editing user:', userId);
            // TODO: Implement edit functionality (e.g., show a modal with a form)
        }
    };

    // Add event listener to the all-users table body for delegation
    document.getElementById('all-users-table-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit')) {
            const userId = e.target.dataset.id;
            handleAllUsersAction('edit', userId);
        }
        if (e.target.classList.contains('delete')) {
            const userId = e.target.dataset.id;
            handleAllUsersAction('delete', userId);
        }
    });

    // Fetch and display all subjects
    const fetchAllSubjects = async () => {
        try {
            const res = await fetch('/api/subjects', { headers });
            if (!res.ok) throw new Error('Failed to fetch subjects');
            const subjects = await res.json();
            const tableBody = document.getElementById('all-subjects-table-body');
            tableBody.innerHTML = '';
            subjects.forEach(subject => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-3 px-4">${subject.name}</td>
                    <td class="py-3 px-4">${subject.description}</td>
                    <td class="py-3 px-4">
                        <button class="action-btn edit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" data-id="${subject.id}">Edit</button>
                        <button class="action-btn delete-subject bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" data-id="${subject.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    // Handle create subject form submission
    document.getElementById('create-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value;
        const description = document.getElementById('subject-description').value;
        try {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, description })
            });
            if (!res.ok) throw new Error('Failed to create subject');
            fetchAllSubjects(); // Refresh the list
            fetchAnalytics(); // Refresh analytics
            e.target.reset(); // Clear the form
        } catch (error) {
            console.error('Error creating subject:', error);
        }
    });

    // Handle subject actions (delete)
    document.getElementById('all-subjects-table-body').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-subject')) {
            const subjectId = e.target.dataset.id;
            if (!confirm('Are you sure you want to delete this subject?')) return;
            try {
                const res = await fetch(`/api/subjects/${subjectId}`, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete subject');
                fetchAllSubjects(); // Refresh the list
                fetchAnalytics(); // Refresh analytics
            } catch (error) {
                console.error('Error deleting subject:', error);
            }
        }
    });

    // Fetch and display all quizzes
    const fetchAllQuizzes = async () => {
        try {
            const res = await fetch('/api/quizzes', { headers });
            if (!res.ok) throw new Error('Failed to fetch quizzes');
            const quizzes = await res.json();
            const tableBody = document.getElementById('all-quizzes-table-body');
            tableBody.innerHTML = '';
            quizzes.forEach(quiz => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-3 px-4">${quiz.title}</td>
                    <td class="py-3 px-4">${quiz.subject_name}</td>
                    <td class="py-3 px-4">${quiz.teacher_name}</td>
                    <td class="py-3 px-4">
                        <button class="action-btn edit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" data-id="${quiz.id}">Details</button>
                        <button class="action-btn delete-quiz bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" data-id="${quiz.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    };

    // Handle quiz actions (delete)
    document.getElementById('all-quizzes-table-body').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-quiz')) {
            const quizId = e.target.dataset.id;
            if (!confirm('Are you sure you want to delete this quiz?')) return;
            try {
                const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete quiz');
                fetchAllQuizzes(); // Refresh the list
                fetchAnalytics(); // Refresh analytics
            } catch (error) {
                console.error('Error deleting quiz:', error);
            }
        }
    });

    // Fetch and display all announcements
    const fetchAllAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements', { headers });
            if (!res.ok) throw new Error('Failed to fetch announcements');
            const announcements = await res.json();
            const tableBody = document.getElementById('all-announcements-table-body');
            tableBody.innerHTML = '';
            announcements.forEach(announcement => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-3 px-4">${announcement.title}</td>
                    <td class="py-3 px-4">${announcement.content}</td>
                    <td class="py-3 px-4">${new Date(announcement.created_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4">
                        <button class="action-btn edit bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" data-id="${announcement.id}">Edit</button>
                        <button class="action-btn delete-announcement bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" data-id="${announcement.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    // Handle create announcement form submission
    document.getElementById('create-announcement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('announcement-title').value;
        const content = document.getElementById('announcement-content').value;
        try {
            const res = await fetch('/api/announcements', {
                method: 'POST',
                headers,
                body: JSON.stringify({ title, content })
            });
            if (!res.ok) throw new Error('Failed to create announcement');
            fetchAllAnnouncements(); // Refresh the list
            e.target.reset(); // Clear the form
        } catch (error) {
            console.error('Error creating announcement:', error);
        }
    });

    // Handle announcement actions (edit/delete)
    document.getElementById('all-announcements-table-body').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-announcement')) {
            const announcementId = e.target.dataset.id;
            if (!confirm('Are you sure you want to delete this announcement?')) return;
            try {
                const res = await fetch(`/api/announcements/${announcementId}`, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete announcement');
                fetchAllAnnouncements(); // Refresh the list
            } catch (error) {
                console.error('Error deleting announcement:', error);
            }
        }
        if (e.target.classList.contains('edit')) {
            const announcementId = e.target.dataset.id;
            try {
                const res = await fetch(`/api/announcements/${announcementId}`, { headers });
                if (!res.ok) throw new Error('Failed to fetch announcement data');
                const announcement = await res.json();
                document.getElementById('edit-announcement-id').value = announcement.id;
                document.getElementById('edit-announcement-title').value = announcement.title;
                document.getElementById('edit-announcement-content').value = announcement.content;
                showModal(editAnnouncementModal);
            } catch (error) {
                console.error('Error fetching announcement data:', error);
            }
        }
    });

    document.getElementById('save-announcement-button').addEventListener('click', async () => {
        const announcementId = document.getElementById('edit-announcement-id').value;
        const title = document.getElementById('edit-announcement-title').value;
        const content = document.getElementById('edit-announcement-content').value;
        
        try {
            const res = await fetch(`/api/announcements/${announcementId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ title, content })
            });
            if (!res.ok) throw new Error('Failed to update announcement');
            fetchAllAnnouncements(); // Refresh the list
            hideModal(editAnnouncementModal);
        } catch (error) {
            console.error('Error updating announcement:', error);
        }
    });

    document.getElementById('cancel-announcement-button').addEventListener('click', () => hideModal(editAnnouncementModal));

    // Navigation
    const sections = {
        'dashboard': document.getElementById('dashboard'),
        'users': document.getElementById('users'),
        'subjects': document.getElementById('subjects'),
        'quizzes': document.getElementById('quizzes'),
        'announcements': document.getElementById('announcements')
    };

    const navLinks = document.querySelectorAll('nav a');

    const showSection = (sectionId) => {
        Object.values(sections).forEach(section => {
            if (section) section.classList.add('hidden');
        });
        if (sections[sectionId]) {
            sections[sectionId].classList.remove('hidden');
        }
        // Hide sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            sidebar.classList.add('-translate-x-full');
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Initial section
    showSection('dashboard');

    // Initial data fetch
    fetchAnalytics();
    fetchPendingUsers();
    fetchAllUsers();
    fetchAllSubjects();
    fetchAllQuizzes();
    fetchAllAnnouncements();

    // Modal Handling
    const editUserModal = document.getElementById('edit-user-modal');
    const editSubjectModal = document.getElementById('edit-subject-modal');
    const editAnnouncementModal = document.getElementById('edit-announcement-modal');
    const assignSubjectsModal = document.getElementById('assign-subjects-modal'); // Add this line

    const showModal = (modal) => modal.classList.remove('hidden');
    const hideModal = (modal) => modal.classList.add('hidden');

    // Fetch assigned subjects for a given teacher
    const fetchAssignedSubjects = async (teacherId) => {
        try {
            const res = await fetch(`/api/admin/users/${teacherId}/assigned-subjects`, { headers });
            if (!res.ok) throw new Error('Failed to fetch assigned subjects');
            const assignedSubjects = await res.json();
            return assignedSubjects.map(s => s.id); // Return array of assigned subject IDs
        } catch (error) {
            console.error('Error fetching assigned subjects:', error);
            return [];
        }
    };

    // Edit User Modal
    document.getElementById('all-users-table-body').addEventListener('click', async (e) => { // Added async here
        if (e.target.classList.contains('edit')) {
            const userId = e.target.dataset.id;
            try {
                const res = await fetch(`/api/admin/users/${userId}`, { headers });
                if (!res.ok) throw new Error('Failed to fetch user data');
                const user = await res.json();
                document.getElementById('edit-user-id').value = user.id;
                document.getElementById('edit-user-name').value = user.name;
                document.getElementById('edit-user-email').value = user.email;
                document.getElementById('edit-user-role').value = user.role;
                showModal(editUserModal);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        } else if (e.target.classList.contains('delete')) {
            const userId = e.target.dataset.id;
            if (!confirm('Are you sure you want to delete this user?')) return;
            const url = `/api/admin/users/${userId}`;
            try {
                const res = await fetch(url, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete user');
                fetchAllUsers(); // Refresh the list
                fetchAnalytics(); // Refresh analytics
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        } else if (e.target.classList.contains('assign-subjects')) {
            const teacherId = e.target.dataset.id;
            const teacherName = e.target.dataset.name;

            assignSubjectsTeacherNameSpan.textContent = teacherName;
            assignSubjectsTeacherIdInput.value = teacherId;
            subjectsCheckboxContainer.innerHTML = ''; // Clear previous checkboxes

            try {
                const allSubjectsRes = await fetch('/api/subjects', { headers });
                if (!allSubjectsRes.ok) throw new Error('Failed to fetch all subjects');
                const allSubjects = await allSubjectsRes.json();

                const assignedSubjectIds = await fetchAssignedSubjects(teacherId);

                allSubjects.forEach(subject => {
                    const isChecked = assignedSubjectIds.includes(subject.id);
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'flex items-center';
                    checkboxDiv.innerHTML = `
                        <input type="checkbox" id="subject-${subject.id}" value="${subject.id}" class="form-checkbox h-5 w-5 text-blue-600" ${isChecked ? 'checked' : ''}>
                        <label for="subject-${subject.id}" class="ml-2 text-gray-700">${subject.name}</label>
                    `;
                    subjectsCheckboxContainer.appendChild(checkboxDiv);
                });

                showModal(assignSubjectsModal);
            } catch (error) {
                console.error('Error preparing assign subjects modal:', error);
            }
        }
    });

    document.getElementById('save-user-button').addEventListener('click', () => {
        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const role = document.getElementById('edit-user-role').value;
        console.log('Saving user:', { userId, name, email, role });
        // TODO: Implement actual save logic (call PUT /api/admin/users/:id)
        hideModal(editUserModal);
    });

    document.getElementById('cancel-user-button').addEventListener('click', () => hideModal(editUserModal));

    // Handle Save Assigned Subjects
    saveAssignedSubjectsButton.addEventListener('click', async () => {
        const teacherId = assignSubjectsTeacherIdInput.value;
        const selectedSubjectIds = Array.from(subjectsCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                    .map(checkbox => parseInt(checkbox.value));

        try {
            const res = await fetch(`/api/admin/users/${teacherId}/assign-subjects`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ subjectIds: selectedSubjectIds })
            });

            if (!res.ok) throw new Error('Failed to save subject assignments');
            alert('Subjects assigned successfully!');
            hideModal(assignSubjectsModal);
            // Optionally refresh user list or analytics if needed
        } catch (error) {
            console.error('Error saving subject assignments:', error);
            alert('Failed to save subject assignments.');
        }
    });

    // Handle Cancel Assigned Subjects
    cancelAssignedSubjectsButton.addEventListener('click', () => {
        hideModal(assignSubjectsModal);
    });

    // Edit Subject Modal
    document.getElementById('all-subjects-table-body').addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit')) {
            const subjectId = e.target.dataset.id;
            try {
                const res = await fetch(`/api/subjects/${subjectId}`, { headers });
                if (!res.ok) throw new Error('Failed to fetch subject data');
                const subject = await res.json();
                document.getElementById('edit-subject-id').value = subject.id;
                document.getElementById('edit-subject-name').value = subject.name;
                document.getElementById('edit-subject-description').value = subject.description;
                showModal(editSubjectModal);
            } catch (error) {
                console.error('Error fetching subject data:', error);
            }
        }
    });

    document.getElementById('save-subject-button').addEventListener('click', async () => {
        const subjectId = document.getElementById('edit-subject-id').value;
        const name = document.getElementById('edit-subject-name').value;
        const description = document.getElementById('edit-subject-description').value;
        
        try {
            const res = await fetch(`/api/subjects/${subjectId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name, description })
            });
            if (!res.ok) throw new Error('Failed to update subject');
            fetchAllSubjects(); // Refresh the list
            hideModal(editSubjectModal);
        } catch (error) {
            console.error('Error updating subject:', error);
        }
    });

    document.getElementById('cancel-subject-button').addEventListener('click', () => hideModal(editSubjectModal));

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'admin-login.html';
    });
});
