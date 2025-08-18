// Allow teachers to add multiple note sections dynamically
let additionalNoteCount = 0;
document.addEventListener('DOMContentLoaded', function() {
  const addBtn = document.getElementById('add-note-section-btn');
  if (addBtn) {
    addBtn.onclick = function() {
      additionalNoteCount++;
      const container = document.getElementById('additional-notes-sections');
      const section = document.createElement('div');
      section.className = 'notes-form-row';
      section.innerHTML = `
        <label for="additional-note-${additionalNoteCount}">Additional Note Section ${additionalNoteCount}</label>
        <textarea name="additional_note_${additionalNoteCount}" id="additional-note-${additionalNoteCount}" rows="6" maxlength="2000" placeholder="Type additional note content..."></textarea>
      `;
      container.appendChild(section);
    };
  }
});
// Split content into pages and show knowledge check questions after every 3 pages
function splitContentForKnowledgeCheck() {
  const content = document.getElementById('content').value;
  const pageLength = 1000; // Approx chars per page
  const pages = [];
  for (let i = 0; i < content.length; i += pageLength) {
    pages.push(content.substring(i, i + pageLength));
  }
  const container = document.getElementById('knowledge-check-sections');
  container.innerHTML = '';
  for (let i = 0; i < pages.length; i++) {
    if ((i + 1) % 3 === 0) {
      const section = document.createElement('div');
      section.className = 'notes-form-row';
      section.innerHTML = `
        <label for="knowledge-check-${i}">Knowledge Check after page ${i + 1}</label>
        <textarea name="knowledge_check_${i}" id="knowledge-check-${i}" rows="3" maxlength="500" placeholder="Add questions for students after page ${i + 1}..."></textarea>
      `;
      container.appendChild(section);
    }
  }
}
// Professional Teacher Notes Frontend


// Load notes list and update analytics
async function loadNotes() {
  const res = await fetch('/api/notes');
  const data = await res.json();
  const notes = data.notes || [];
  const tbody = document.getElementById('notes-list-body');
  tbody.innerHTML = notes.map(note => `
    <tr tabindex="0" aria-label="Note: ${note.title}">
      <td>${note.title}</td>
      <td>${note.subject}</td>
      <td>${note.class}</td>
      <td>${note.tags ? note.tags.split(',').map(t => `<span class="notes-tag">${t.trim()}</span>`).join('') : ''}</td>
      <td>${note.created_at.split('T')[0]}</td>
      <td>${note.status.charAt(0).toUpperCase() + note.status.slice(1)}</td>
      <td>
        <button class="notes-btn" onclick="editNote(${note.id})" aria-label="Edit note ${note.title}">Edit</button>
        <button class="notes-btn" onclick="deleteNote(${note.id})" aria-label="Delete note ${note.title}">Delete</button>
      </td>
    </tr>
  `).join('');
  // Analytics
  document.getElementById('notes-count').textContent = notes.length;
  document.getElementById('notes-count-main').textContent = notes.length;
  const published = notes.filter(n => n.status === 'published').length;
  const drafts = notes.filter(n => n.status === 'draft').length;
  document.getElementById('notes-published').textContent = published;
  document.getElementById('notes-drafts').textContent = drafts;
}


// Show note editor (focus first field)
function showNoteEditor(note = null) {
  document.getElementById('notes-editor').style.display = '';
  const form = document.getElementById('note-form');
  form.reset();
  if (note) {
    form.title.value = note.title;
    form.subject.value = note.subject;
    form.class.value = note.class;
    form.tags.value = note.tags;
    form.content.value = note.content;
    form.setAttribute('data-id', note.id);
  } else {
    form.removeAttribute('data-id');
  }
  setTimeout(() => form.title.focus(), 100);
}


// Hide note editor
function hideNoteEditor() {
  document.getElementById('notes-editor').style.display = 'none';
}


// Edit note
async function editNote(id) {
  const res = await fetch(`/api/notes`);
  const data = await res.json();
  const note = (data.notes || []).find(n => n.id === id);
  showNoteEditor(note);
}


// Delete note
async function deleteNote(id) {
  if (!confirm('Delete this note? This action cannot be undone.')) return;
  await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  loadNotes();
}


// Save note (create or edit)
document.getElementById('note-form').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  // PDF/Book attachments
  const attachmentsInput = form.querySelector('input[type="file"][name="attachments"]');
  if (attachmentsInput && attachmentsInput.files.length > 0) {
    for (let i = 0; i < attachmentsInput.files.length; i++) {
      formData.append('attachments', attachmentsInput.files[i]);
    }
  }
  // Audio notes
  const audioInput = form.querySelector('input[type="file"][name="audio_notes"]');
  if (audioInput && audioInput.files.length > 0) {
    for (let i = 0; i < audioInput.files.length; i++) {
      formData.append('audio_notes', audioInput.files[i]);
    }
  }
  // Video notes
  const videoInput = form.querySelector('input[type="file"][name="video_notes"]');
  if (videoInput && videoInput.files.length > 0) {
    for (let i = 0; i < videoInput.files.length; i++) {
      formData.append('video_notes', videoInput.files[i]);
    }
  }
  // Image/diagram notes
  const imageInput = form.querySelector('input[type="file"][name="image_notes"]');
  if (imageInput && imageInput.files.length > 0) {
    for (let i = 0; i < imageInput.files.length; i++) {
      formData.append('image_notes', imageInput.files[i]);
    }
  }
  // Knowledge questions
  const questions = form.knowledge_questions ? form.knowledge_questions.value : '';
  if (questions) formData.append('knowledge_questions', questions);
  let url = '/api/notes', method = 'POST';
  if (form.getAttribute('data-id')) {
    url = `/api/notes/${form.getAttribute('data-id')}`;
    method = 'PUT';
  }
  const res = await fetch(url, { method, body: formData });
  const result = await res.json();
  if (result.success) {
    hideNoteEditor();
    loadNotes();
  } else {
    alert(result.message || 'Failed to save note.');
  }
};


// Create new note button
const createNoteBtn = document.getElementById('create-note-btn');
if (createNoteBtn) {
  createNoteBtn.onclick = () => showNoteEditor();
}


// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadNotes();
});
