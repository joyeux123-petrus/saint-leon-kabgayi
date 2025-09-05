document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');
    const noteDetailModal = document.getElementById('note-detail-modal');
    const modalNoteTitle = document.getElementById('modal-note-title');
    const modalNoteContent = document.getElementById('modal-note-content');
    const closeModalButton = noteDetailModal.querySelector('.close-button');

    const getAuthToken = () => localStorage.getItem('token');

    async function fetchData(endpoint) {
        const token = getAuthToken();
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    const renderNotes = async () => {
        notesList.innerHTML = '<p class="text-gray-500">Loading notes...</p>';
        try {
            const notes = await fetchData('/api/notes/teacher');
            console.log('Fetched notes for teacher:', notes);

            if (notes && notes.length > 0) {
                document.getElementById('total-notes').textContent = notes.length;

                let totalStudentsEngaged = 0;
                let topNote = null;
                let maxInteractions = -1;

                notes.forEach(note => {
                    totalStudentsEngaged += note.unique_students_engaged || 0;
                    if (note.total_interactions > maxInteractions) {
                        maxInteractions = note.total_interactions;
                        topNote = note;
                    }
                });

                document.getElementById('students-engaged').textContent = totalStudentsEngaged;
                document.getElementById('top-notes').textContent = topNote ? topNote.title : 'N/A';

                notesList.innerHTML = notes.map(note => `
                    <div class="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${note.title}</h3>
                            <p class="text-gray-600 text-sm">${note.subject_name || 'N/A'} - ${note.class_name || 'N/A'}</p>
                            <p class="text-gray-600 text-sm">Engaged Students: ${note.unique_students_engaged || 0}</p>
                            <p class="text-gray-600 text-sm">Total Interactions: ${note.total_interactions || 0}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition view-note-btn" data-note-id="${note.id}">View</button>
                            <button class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition edit-note-btn" data-note-id="${note.id}">Edit</button>
                            <button class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition delete-note-btn" data-note-id="${note.id}">Delete</button>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.view-note-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const noteId = event.target.dataset.noteId;
                        window.location.href = `professional-notes-viewer.html?noteId=${noteId}`;
                    });
                });

                document.querySelectorAll('.edit-note-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const noteId = event.target.dataset.noteId;
                        window.location.href = `teacher-note-editor.html?noteId=${noteId}`;
                    });
                });

                document.querySelectorAll('.delete-note-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const noteId = event.target.dataset.noteId;
                        if (confirm('Are you sure you want to delete this note?')) {
                            try {
                                await fetchData(`/api/notes/${noteId}`, { method: 'DELETE' });
                                alert('Note deleted successfully!');
                                renderNotes();
                            } catch (error) {
                                console.error('Error deleting note:', error);
                                alert('Failed to delete note. Please try again.');
                            }
                        }
                    });
                });

            } else {
                document.getElementById('total-notes').textContent = '0';
                document.getElementById('students-engaged').textContent = '0';
                document.getElementById('top-notes').textContent = 'N/A';
                notesList.innerHTML = '<p class="text-gray-500">No notes created yet. Click "Create Note" to get started.</p>';
            }
        } catch (error) {
            console.error('Error rendering notes:', error);
            notesList.innerHTML = '<p class="text-red-500">Error loading notes. Please try again.</p>';
        }
    };

    // Close modal when close button is clicked
    closeModalButton.addEventListener('click', () => {
        noteDetailModal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === noteDetailModal) {
            noteDetailModal.style.display = 'none';
        }
    });

    // Initial render of notes
    renderNotes();
});
