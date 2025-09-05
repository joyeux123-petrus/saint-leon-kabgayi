document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const notesList = document.getElementById('notes-list');
    const totalNotes = document.getElementById('total-notes');

    const apiBaseUrl = '/api/notes';

    // --- API Functions ---
    const authenticatedFetch = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        return response.json();
    };

    const getNotes = async () => {
        try {
            const notes = await authenticatedFetch(apiBaseUrl);
            renderNotes(notes);
        } catch (error) {
            console.error('Error fetching notes:', error);
            notesList.innerHTML = '<p class="text-red-500">Could not load notes.</p>';
        }
    };

    // --- Rendering Functions ---
    const renderNotes = (notes) => {
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="text-gray-500">No notes created yet. Click "Create Note" to get started.</p>';
            totalNotes.textContent = '0';
            return;
        }
        totalNotes.textContent = notes.length;
        notesList.innerHTML = notes.map(note => `
            <div class="border rounded-lg p-4 flex justify-between items-center" data-id="${note.id}">
                <div class="flex-grow">
                    <h3 class="text-xl font-bold">${note.title}</h3>
                    <p class="text-sm text-gray-500">Subject: ${note.subject_name || 'N/A'} | Visibility: ${note.visibility}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="view-btn text-green-500 hover:text-green-700">View</button>
                    <button class="edit-btn text-blue-500 hover:text-blue-700">Edit</button>
                    <button class="delete-btn text-red-500 hover:text-red-700">Delete</button>
                </div>
            </div>
        `).join('');
    };

    // --- Event Listeners ---

    // Event delegation for main notes list (edit/delete)
    notesList.addEventListener('click', async (e) => {
        const { target } = e;
        const noteElement = target.closest('[data-id]');
        if (!noteElement) return;

        const noteId = noteElement.dataset.id;

        if (target.classList.contains('view-btn')) {
            window.location.href = `professional-notes-viewer.html?noteId=${noteId}`;
        }

        if (target.classList.contains('edit-btn')) {
            window.location.href = `teacher-note-editor.html?noteId=${noteId}`;
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                try {
                    await authenticatedFetch(`${apiBaseUrl}/${noteId}`, { method: 'DELETE' });
                    getNotes(); // Refresh list
                } catch (error) {
                    console.error('Error deleting note:', error);
                    alert('Failed to delete note.');
                }
            }
        }
    });

    

    // --- Initial Load ---
    const initialize = () => {
        getNotes();
    };

    initialize();
});