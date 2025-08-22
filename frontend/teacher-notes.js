document.addEventListener('DOMContentLoaded', function () {
    const summarizeBtn = document.getElementById('summarize-btn');
    const contentEl = document.getElementById('content');
    const summaryOutputEl = document.getElementById('summary-output');

    if (summarizeBtn) {
        summarizeBtn.addEventListener('click', function () {
            const content = contentEl.value;

            if (content.trim() === '') {
                alert('Please enter some content to summarize.');
                return;
            }

            summaryOutputEl.innerHTML = 'Summarizing...';

            fetch('/api/notes/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: content })
            })
            .then(response => response.json())
            .then(data => {
                if (data.summary) {
                    summaryOutputEl.innerHTML = data.summary;
                } else {
                    summaryOutputEl.innerHTML = 'Error: ' + (data.error || 'Unknown error');
                }
            })
            .catch(error => {
                console.error('Error summarizing:', error);
                summaryOutputEl.innerHTML = 'An error occurred while summarizing.';
            });
        });
    }
});
