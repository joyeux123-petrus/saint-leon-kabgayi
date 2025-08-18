// Subject management logic for admin.html
document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('create-subject-form');
	const subjectsList = document.getElementById('subjects-list');
	if (form && subjectsList) {
		form.onsubmit = async function(e) {
			e.preventDefault();
			const name = document.getElementById('subject-name').value.trim();
			if (!name) return;
			const res = await fetch('/api/subjects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			const result = await res.json();
			if (result.success) {
				document.getElementById('subject-name').value = '';
				loadSubjects();
			} else {
				alert(result.error || 'Failed to create subject.');
			}
		};
		async function loadSubjects() {
			const res = await fetch('/api/subjects');
			const data = await res.json();
			subjectsList.innerHTML = '';
			(data.subjects || []).forEach(subj => {
				const li = document.createElement('li');
				li.textContent = subj.name;
				subjectsList.appendChild(li);
			});
		}
		loadSubjects();
	}
});
// Main JS for RUDASUMBWA
console.log('RUDASUMBWA frontend loaded');
// Add interactivity as needed for each page
