document.addEventListener('DOMContentLoaded', () => {
    const getAuthToken = () => localStorage.getItem('token');
    const token = getAuthToken();

    // --- UI Elements ---
    const profileInfoContainer = document.getElementById('profile-info-container');
    const updateNameForm = document.getElementById('update-name-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const fullNameInput = document.getElementById('full-name');
    const toast = document.getElementById('toast-notification');

    // --- Redirect if not logged in ---
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Toast Notification Function ---
    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- Data Fetching and Actions ---
    const apiRequest = async (url, method, body = null) => {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`API request to ${url} failed:`, error);
            showToast(error.message, true);
            return null;
        }
    };

    // 1. Fetch and Display Profile Info
    const loadProfileInfo = async () => {
        const userData = await apiRequest('/api/users/profile', 'GET');
        if (userData && profileInfoContainer) {
            profileInfoContainer.innerHTML = `
                <div class="info-item"><strong>Full Name:</strong> ${userData.full_name || 'N/A'}</div>
                <div class="info-item"><strong>Username:</strong> ${userData.username || 'N/A'}</div>
                <div class="info-item"><strong>Email:</strong> ${userData.email || 'N/A'}</div>
                <div class="info-item"><strong>Role:</strong> ${userData.role || 'N/A'}</div>
            `;
            if (fullNameInput) {
                fullNameInput.value = userData.full_name || '';
            }
        }
    };

    // 2. Handle Name Update
    if (updateNameForm) {
        updateNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = fullNameInput.value;
            if (!newName) {
                showToast('Name cannot be empty', true);
                return;
            }

            const result = await apiRequest('/api/users/profile/name', 'PUT', { fullName: newName });
            if (result) {
                showToast('Name updated successfully!');
                loadProfileInfo(); // Refresh displayed info
            }
        });
    }

    // 3. Handle Password Change
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', true);
                return;
            }

            const result = await apiRequest('/api/users/profile/password', 'POST', { currentPassword, newPassword });
            if (result) {
                showToast('Password changed successfully!');
                changePasswordForm.reset();
            }
        });
    }

    // --- Initial Load ---
    loadProfileInfo();
});
