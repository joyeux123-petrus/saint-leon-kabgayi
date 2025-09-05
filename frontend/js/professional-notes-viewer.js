let isDarkMode = false;
let isFocusMode = false;
let isBookmarked = false;
let isAnnotationsVisible = true;
let isReading = false;
const synth = window.speechSynthesis;

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark', isDarkMode);
}

// Mobile-optimized focus mode
function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    document.body.classList.toggle('focus-mode', isFocusMode);
    
    // On mobile, also adjust viewport
    if (window.innerWidth <= 768) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (isFocusMode) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
        } else {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
    }
}

function toggleBookmark() {
    isBookmarked = !isBookmarked;
    const btn = event.target;
    btn.style.background = isBookmarked ? '#3b82f6' : '';
    btn.style.color = isBookmarked ? 'white' : '';
}

function downloadPDF() {
    alert('PDF download functionality would be implemented here');
}

function shareNote() {
    alert('Share functionality would be implemented here');
}

function readAloud() {
    const mainContent = document.querySelector('.main-content');
    const textToRead = mainContent.innerText;
    const readAloudButton = document.querySelector('.btn-primary');

    if (isReading) {
        synth.cancel();
        isReading = false;
        readAloudButton.innerHTML = '🔊 Read Aloud';
    } else {
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.onend = function() {
            isReading = false;
            readAloudButton.innerHTML = '🔊 Read Aloud';
        };
        synth.speak(utterance);
        isReading = true;
        readAloudButton.innerHTML = '🛑 Stop Reading';
    }
}

function changeFontFamily(family) {
    const content = document.querySelector('.main-content');
    switch(family) {
        case 'serif':
            content.style.fontFamily = 'Georgia, serif';
            break;
        case 'monospace':
            content.style.fontFamily = 'Monaco, monospace';
            break;
        case 'dyslexic':
            content.style.fontFamily = 'OpenDyslexic, sans-serif';
            break;
        default:
            content.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
}

// Optimize font size changes for mobile
function changeFontSize(size) {
    const content = document.querySelector('.main-content');
    const isMobile = window.innerWidth <= 768;
    
    switch(size) {
        case 'small':
            content.style.fontSize = isMobile ? '14px' : '14px';
            content.style.lineHeight = '1.6';
            break;
        case 'large':
            content.style.fontSize = isMobile ? '20px' : '18px';
            content.style.lineHeight = '1.7';
            break;
        case 'xl':
            content.style.fontSize = isMobile ? '24px' : '22px';
            content.style.lineHeight = '1.8';
            break;
        default:
            content.style.fontSize = isMobile ? '16px' : '16px';
            content.style.lineHeight = '1.6';
    }
}

function changeReadingSpeed(speed) {
    // This would affect text-to-speech speed
    console.log('Reading speed changed to:', speed);
}

function toggleAnnotations() {
    isAnnotationsVisible = !isAnnotationsVisible;
    // This would show/hide annotation overlays
    console.log('Annotations visibility:', isAnnotationsVisible);
}

// Mobile-specific enhancements
let touchStartY = 0;
let touchEndY = 0;

// Add swipe gestures for mobile
document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped up - could trigger reading mode or scroll to content
            console.log('Swiped up');
        } else {
            // Swiped down - could trigger menu or go back
            console.log('Swiped down');
        }
    }
}

// Prevent zoom on double tap for better mobile UX
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Mobile-optimized progress updates
function updateProgress(percentage) {
    document.querySelector('.progress-percentage').textContent = percentage + '%';
    document.querySelector('.progress-bar').style.width = percentage + '%';
    
    // Add haptic feedback on mobile if available
    if ('vibrate' in navigator && window.innerWidth <= 768) {
        navigator.vibrate(50);
    }
}

// Auto-hide controls on mobile scroll
let lastScrollTop = 0;
let isScrolling = false;

if (window.innerWidth <= 768) {
    window.addEventListener('scroll', () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
            // Scrolling down - hide header in focus mode
            if (isFocusMode) {
                document.querySelector('.header').style.transform = 'translateY(-100%)';
            }
        } else {
            // Scrolling up - show header
            if (isFocusMode) {
                document.querySelector('.header').style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('noteId');
    const token = localStorage.getItem('token'); // Get token from local storage

    if (noteId) {
        fetch(`/api/notes/${noteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(note => {
            document.getElementById('note-title').textContent = note.title;
            document.getElementById('course-info').textContent = `Class: ${note.class_name || 'N/A'}`;
            document.getElementById('note-subject').textContent = note.subject_name || 'N/A';
            document.getElementById('note-description').textContent = note.description;
            
            const tagsContainer = document.getElementById('note-tags');
            tagsContainer.innerHTML = '';
            const tags = note.tags ? note.tags.split(',').map(tag => tag.trim()) : [];
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });

            document.getElementById('note-duration').textContent = note.estimated_duration ? `${note.estimated_duration} mins` : 'N/A';
            
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML = ''; // Clear the placeholder

            function renderKnowledgeCheck(containerElement, knowledgeCheckQuestions) {
    if (!knowledgeCheckQuestions || knowledgeCheckQuestions.length === 0) {
        return;
    }

    const kcContainer = document.createElement('div');
    kcContainer.className = 'knowledge-check-container';
    kcContainer.innerHTML = '<h3>Knowledge Check</h3>';

    knowledgeCheckQuestions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'knowledge-check-question';
        questionDiv.innerHTML = `<p><strong>${qIndex + 1}. ${question.question_text}</strong></p>`;

        if (question.question_type === 'MCQ_single_answer' || question.question_type === 'MCQ_multiple_answers' || question.question_type === 'True/False') {
            const optionsList = document.createElement('ul');
            optionsList.className = 'knowledge-check-options';
            question.options.forEach(option => {
                const optionItem = document.createElement('li');
                // Use question.question_id and option.option_id, option.option_text
                optionItem.innerHTML = `<label><input type="radio" name="question-${question.question_id}" value="${option.option_id}"> ${option.option_text}</label>`;
                optionsList.appendChild(optionItem);
            });
            questionDiv.appendChild(optionsList);
        } else if (question.question_type === 'Matching') {
            const matchingTable = document.createElement('table');
            matchingTable.className = 'knowledge-check-matching';
            question.match_pairs.forEach(pair => { // Use match_pairs as per backend
                const row = document.createElement('tr');
                row.innerHTML = `<td>${pair.prompt}</td><td><input type="text" placeholder="Match"></td>`;
                matchingTable.appendChild(row);
            });
            questionDiv.appendChild(matchingTable);
        } else if (question.question_type === 'Fill-in-the-Blank') {
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.placeholder = 'Your answer';
            questionDiv.appendChild(inputField);
        } else if (question.question_type === 'Short_Answer') {
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Your answer';
            questionDiv.appendChild(textarea);
        }
        // Add other question types as needed

        kcContainer.appendChild(questionDiv);
    });

    containerElement.appendChild(kcContainer);
}

            if (note.sections && note.sections.length > 0) {
                note.sections.forEach(section => {
                    const sectionContainer = document.createElement('div');
                    sectionContainer.className = 'note-section';
                    
                    const sectionTitle = document.createElement('h2');
                    sectionTitle.textContent = section.title;
                    sectionContainer.appendChild(sectionTitle);
                    
                    const sectionContent = document.createElement('div');
                    sectionContent.innerHTML = section.content; // Assuming content is HTML
                    sectionContainer.appendChild(sectionContent);
                    
                    mainContent.appendChild(sectionContainer);
                });
            } else {
                mainContent.innerHTML = '<div class="content-placeholder"><h3>Note content is not available.</h3></div>';
            }

            // Fetch and render knowledge check questions (quizzes) if note_id exists
            if (note.note_id) { // Assuming note.note_id corresponds to quiz_id
                fetch(`/api/quizzes/${note.note_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        // If quiz not found or other error, don't block note display
                        console.warn(`No quiz found for note_id: ${note.note_id} or error fetching quiz.`);
                        return null; 
                    }
                    return response.json();
                })
                .then(quizData => {
                    if (quizData && quizData.success && quizData.data && quizData.data.questions) {
                        const quizQuestions = quizData.data.questions;
                        // Render knowledge check questions at the end of the main content
                        renderKnowledgeCheck(mainContent, quizQuestions);
                    }
                })
                .catch(error => {
                    console.error('Error fetching quiz for note:', error);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching note:', error);
            const mainContent = document.querySelector('.main-content');
            mainContent.innerHTML = '<div class="content-placeholder"><h3>Failed to load note</h3><p>Please make sure you are logged in and the note exists.</p></div>';
        });
    }
});