document.addEventListener('DOMContentLoaded', () => {
    const usccbContent = document.getElementById('usccb-content');
    const errorMessage = document.getElementById('usccb-error-message');
    const errorText = document.getElementById('usccb-error-text');

    async function fetchUSCCBData() {
        try {
            const response = await fetch('http://localhost:3001/catholic-today');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayUSCCBData(data);
        } catch (error) {
            console.error('Error fetching USCCB data:', error);
            if (usccbContent) {
                usccbContent.innerHTML = '<p class="text-gray-500 text-center">Failed to load USCCB data.</p>';
            }
            if (errorMessage) {
                errorMessage.classList.remove('hidden');
                errorText.textContent = `Failed to load USCCB data: ${error.message}. Please ensure the USCCB service is running on port 3001.`;
            }
        }
    }

    function displayUSCCBData(data) {
        if (!usccbContent) return;

        let html = '';

        // Daily Mass
        if (data.daily_mass && !data.daily_mass.error) {
            html += `
                <div class="card">
                    <h2 class="card-title">Daily Mass Readings</h2>
                    <h3 class="card-subtitle">${data.daily_mass.title || 'N/A'}</h3>
                    <p class="card-text">Date: ${data.daily_mass.date || 'N/A'}</p>
                    <div class="section-divider">
                        <h4 class="card-subtitle">Readings:</h4>
                        ${data.daily_mass.readings ? data.daily_mass.readings.map(reading => `
                            <p class="card-text"><strong>${reading.type}:</strong> ${reading.text}</p>
                        `).join('') : '<p class="card-text">No readings available.</p>'}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="card">
                    <h2 class="card-title">Daily Mass Readings</h2>
                    <p class="card-text">${data.daily_mass?.message || data.daily_mass?.error || 'Mass readings not available.'}</p>
                </div>
            `;
        }

        // Saint of the Day
        if (data.saint_of_the_day && !data.saint_of_the_day.error) {
            html += `
                <div class="card">
                    <h2 class="card-title">Saint of the Day</h2>
                    <h3 class="card-subtitle">${data.saint_of_the_day.title || 'N/A'}</h3>
                    <p class="card-text">${data.saint_of_the_day.summary || 'No summary available.'}</p>
                    <p class="card-text">Published: ${data.saint_of_the_day.published || 'N/A'}</p>
                    ${data.saint_of_the_day.link ? `<a href="${data.saint_of_the_day.link}" target="_blank" class="text-blue-500 underline">Read more</a>` : ''}
                </div>
            `;
        } else {
            html += `
                <div class="card">
                    <h2 class="card-title">Saint of the Day</h2>
                    <p class="card-text">${data.saint_of_the_day?.message || data.saint_of_the_day?.error || 'Saint of the day not available.'}</p>
                </div>
            `;
        }

        // Vatican News
        if (data.vatican_news && !data.vatican_news.error && Array.isArray(data.vatican_news)) {
            html += `
                <div class="card">
                    <h2 class="card-title">Latest Vatican News</h2>
                    <ul class="space-y-2">
                        ${data.vatican_news.slice(0, 5).map(news => `
                            <li>
                                <a href="${news.link}" target="_blank" class="text-blue-500 underline">${news.title}</a>
                                <p class="card-text text-sm">${news.summary || 'No summary available.'}</p>
                                <p class="card-text text-xs text-gray-500">Published: ${news.published || 'N/A'}</p>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            html += `
                <div class="card">
                    <h2 class="card-title">Latest Vatican News</h2>
                    <p class="card-text">${data.vatican_news?.error || 'Vatican news not available.'}</p>
                </div>
            `;
        }

        usccbContent.innerHTML = html;
    }

    fetchUSCCBData();
});
