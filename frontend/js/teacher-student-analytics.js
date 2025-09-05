document.addEventListener('DOMContentLoaded', () => {
    const analyticsContent = document.getElementById('analytics-content');

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
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            analyticsContent.innerHTML = '<p class="text-red-500">Error loading analytics data. Please try again.</p>';
            return null;
        }
    }

    const renderAnalytics = async () => {
        analyticsContent.innerHTML = '<p class="text-gray-500">Loading student engagement data...</p>';
        try {
            // Fetch student engagement data
            // This endpoint needs to be implemented in the backend
            const analyticsData = await fetchData('/api/analytics/student-engagement');
            console.log('Fetched analytics data:', analyticsData);

            if (analyticsData) {
                // Example: Displaying some dummy data or a message if no data
                if (analyticsData.totalStudents && analyticsData.totalStudents > 0) {
                    analyticsContent.innerHTML = `
                        <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                            <p class="font-bold">Total Students Engaged:</p>
                            <p class="text-3xl">${analyticsData.totalStudents}</p>
                        </div>
                        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                            <p class="font-bold">Average Quiz Score:</p>
                            <p class="text-3xl">${analyticsData.averageScore || 'N/A'}</p>
                        </div>
                        <!-- More detailed analytics can be added here -->
                    `;
                } else {
                    analyticsContent.innerHTML = '<p class="text-gray-500">No student engagement data available yet.</p>';
                }
            } else {
                analyticsContent.innerHTML = '<p class="text-gray-500">Failed to retrieve analytics data.</p>';
            }
        } catch (error) {
            console.error('Error rendering analytics:', error);
            analyticsContent.innerHTML = '<p class="text-red-500">Error loading analytics data. Please try again.</p>';
        }
    };

    // Initial render of analytics
    renderAnalytics();
});
