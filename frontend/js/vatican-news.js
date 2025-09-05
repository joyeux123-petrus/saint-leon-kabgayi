// Create the modal HTML structure
const modalHTML = `
    <div id="vaticanNewsModal" class="vatican-news-modal">
        <div class="vatican-news-modal-content">
            <span class="vatican-news-close-button">&times;</span>
            <h2>Latest Vatican News</h2>
            <ul id="vatican-news-list"></ul>
        </div>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    // Append modal to the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const vaticanNewsBtn = document.getElementById('vatican-news-btn');
    const vaticanNewsModal = document.getElementById('vaticanNewsModal');
    const closeButton = document.querySelector('.vatican-news-close-button');
    const newsList = document.getElementById('vatican-news-list');

    if (vaticanNewsBtn) {
        vaticanNewsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            vaticanNewsModal.style.display = 'flex'; // Use flex to center content
            newsList.innerHTML = '<li>Loading Vatican News...</li>';

            try {
                const response = await fetch('http://localhost:3001/api/vatican-news');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const articles = await response.json();

                newsList.innerHTML = ''; // Clear loading message
                if (articles.length > 0) {
                    articles.forEach(article => {
                        const listItem = document.createElement('li');
                        const pubDate = article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'N/A';
                        listItem.innerHTML = `
                            <a href="${article.link}" target="_blank">${article.title}</a>
                            <span class="pub-date">${pubDate}</span>
                        `;
                        newsList.appendChild(listItem);
                    });
                } else {
                    newsList.innerHTML = '<li>No Vatican News found.</li>';
                }
            } catch (error) {
                console.error('Error fetching Vatican News:', error);
                newsList.innerHTML = `<li>Failed to load news: ${error.message}. Please try again later.</li>`;
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            vaticanNewsModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside of it
    if (vaticanNewsModal) {
        window.addEventListener('click', (event) => {
            if (event.target === vaticanNewsModal) {
                vaticanNewsModal.style.display = 'none';
            }
        });
    }
});