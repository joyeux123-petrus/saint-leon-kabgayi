document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const aiTutorChat = document.getElementById('ai-tutor-chat');
    const chatToggle = document.getElementById('chat-toggle');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputField = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    // State variables
    let isChatOpen = true;
    let conversationHistory = [];
    
    // Helper function (assuming fetchData is available globally from student_dashboard_new.js)
    // If not, it would need to be passed or defined here as well.
    async function fetchData(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(endpoint, { ...options, headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
            return null;
        }
    }

    // Initialize chat
    function initChat() {
        const savedHistory = localStorage.getItem('aiTutorHistory');
        if (savedHistory) {
            conversationHistory = JSON.parse(savedHistory);
            renderConversationHistory();
        }
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        chatToggle.addEventListener('click', toggleChat);
        chatSendBtn.addEventListener('click', sendMessage);
        chatInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        const viewProgressBtn = document.getElementById('view-progress-btn');
        viewProgressBtn.addEventListener('click', getLearningProgress);
        const testGeminiBtn = document.getElementById('test-gemini-btn');
        testGeminiBtn.addEventListener('click', testGemini);
        const observer = new MutationObserver(() => {
            scrollToBottom();
        });
        observer.observe(chatMessages, { childList: true });
    }
    
    // Toggle chat visibility
    function toggleChat() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            aiTutorChat.classList.remove('collapsed');
            chatInputField.focus();
        } else {
            aiTutorChat.classList.add('collapsed');
        }
    }
    
    // Send message to AI tutor
    async function sendMessage() {
        const message = chatInputField.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInputField.value = '';
        showTypingIndicator();

        try {
            const uid = localStorage.getItem('uid'); // Assuming uid is stored in localStorage
            if (!uid) {
                addMessage('Error: User not logged in. Please log in to use the AI tutor.', 'ai');
                removeTypingIndicator();
                return;
            }
            const response = await fetchData('/api/ask', {
                method: 'POST',
                body: JSON.stringify({ userId: uid, prompt: message })
            });

            removeTypingIndicator();
            if (response && response.response) {
                addMessage(response.response, 'ai');
                saveConversationHistory();
            } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }
    
    // Handle AI response
    function handleAIResponse(response) {
        addMessage(response, 'ai');
        saveConversationHistory();
    }
    
    // Add message to chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (typeof content === 'string') {
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            messageContent.appendChild(paragraph);
        } else if (typeof content === 'object') {
            messageContent.appendChild(createStructuredContent(content, sender));
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        conversationHistory.push({
            sender,
            content,
            timestamp: new Date().toISOString()
        });
        
        scrollToBottom();
    }
    
    // Create structured content for lessons, quizzes, etc.
    function createStructuredContent(data, sender) {
        const container = document.createElement('div');

        if (data.type === 'lesson') {
            container.appendChild(displayLesson(data));
        } else if (data.type === 'quiz') {
            container.appendChild(displayQuiz(data));
        } else if (data.type === 'quiz_result') {
            container.appendChild(displayQuizResult(data));
        } else if (data.response) {
            const paragraph = document.createElement('p');
            paragraph.textContent = data.response;
            container.appendChild(paragraph);
        }

        return container;
    }

    function displayLesson(data) {
        const lessonDiv = document.createElement('div');
        lessonDiv.className = 'lesson-content';
        
        const title = document.createElement('h4');
        title.textContent = data.lessonTitle;
        lessonDiv.appendChild(title);
        
        const explanation = document.createElement('p');
        explanation.textContent = data.explanation;
        lessonDiv.appendChild(explanation);
        
        if (data.quizzes && data.quizzes.length > 0) {
            const quizBtn = document.createElement('button');
            quizBtn.textContent = 'Take Quiz on this Lesson';
            quizBtn.className = 'btn btn-primary';
            quizBtn.onclick = () => generateQuiz(data.lessonTitle);
            lessonDiv.appendChild(quizBtn);
        }
        
        return lessonDiv;
    }

    function displayQuiz(data) {
        const container = document.createElement('div');
        data.quizzes.forEach((quiz, index) => {
            const quizDiv = document.createElement('div');
            quizDiv.className = 'quiz-question';
            
            const question = document.createElement('p');
            question.textContent = `${index + 1}. ${quiz.question}`;
            quizDiv.appendChild(question);
            
            const optionsList = document.createElement('ul');
            optionsList.className = 'quiz-options';
            
            quiz.options.forEach((option, optionIndex) => {
                const optionItem = document.createElement('li');
                optionItem.textContent = option;
                optionItem.dataset.correct = option === quiz.correctAnswer;
                optionItem.onclick = () => selectAnswer(optionItem, quiz, data);
                optionsList.appendChild(optionItem);
            });
            
            quizDiv.appendChild(optionsList);
            container.appendChild(quizDiv);
        });
        return container;
    }

    function displayQuizResult(data) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'quiz-result';
        
        const score = document.createElement('h4');
        score.textContent = `Score: ${data.score}%`;
        resultDiv.appendChild(score);
        
        const feedback = document.createElement('p');
        feedback.textContent = data.feedback;
        resultDiv.appendChild(feedback);
        
        return resultDiv;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingDiv.appendChild(dot);
        }
        
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Scroll to bottom of chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Save conversation history to localStorage
    function saveConversationHistory() {
        localStorage.setItem('aiTutorHistory', JSON.stringify(conversationHistory));
    }
    
    // Render conversation history
    function renderConversationHistory() {
        chatMessages.innerHTML = '';
        conversationHistory.forEach(msg => {
            addMessage(msg.content, msg.sender);
        });
    }
    
    // Generate quiz for a specific lesson
    async function generateQuiz(lessonTopic) {
        try {
            const quizData = await fetchData('/api/ai-tutor/quiz', {
                method: 'POST',
                body: JSON.stringify({ topic: lessonTopic, questionCount: 5 })
            });
            
            if (quizData) {
                addMessage(quizData, 'ai');
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
        }
    }
    
    // Select answer in quiz
    function selectAnswer(optionElement, quiz, quizData) {
        const options = optionElement.parentElement.querySelectorAll('li');
        options.forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');
        
        const isCorrect = optionElement.dataset.correct === 'true';
        
        setTimeout(() => {
            const resultMessage = isCorrect ? 
                'Correct! ✅' : 
                `Incorrect. The correct answer is: ${quiz.correctAnswer}`;
            
            addMessage(resultMessage, 'ai');
            
            const currentQuizIndex = quizData.quizzes.indexOf(quiz);
            if (currentQuizIndex === quizData.quizzes.length - 1) {
                submitQuizAnswers(quizData);
            }
        }, 1000);
    }
    
    // Submit quiz answers
    async function submitQuizAnswers(quizData) {
        const answers = quizData.quizzes.map(quiz => ({
            question: quiz.question,
            selectedAnswer: document.querySelector(`li.selected[data-correct]`)?.textContent || ''
        }));
        
        try {
            const result = await fetchData('/api/ai-tutor/quiz/submit', {
                method: 'POST',
                body: JSON.stringify({
                    lessonTopic: quizData.lessonTitle || 'General Quiz',
                    answers: answers
                })
            });
            
            if (result) {
                addMessage(result, 'ai');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
        }
    }
    
    // Request specific lesson
    async function requestLesson(topic, difficulty = 'medium') {
        try {
            const lessonData = await fetchData('/api/ai-tutor/lesson', {
                method: 'POST',
                body: JSON.stringify({ topic, difficulty })
            });
            
            if (lessonData) {
                addMessage(lessonData, 'ai');
            }
        } catch (error) {
            console.error('Error requesting lesson:', error);
        }
    }
    
    // Get learning progress
    async function getLearningProgress() {
        try {
            const progressData = await fetchData('/api/ai-tutor/progress');
            
            if (progressData) {
                const progressMessage = `Your learning progress:\n` +
                    `Completed lessons: ${progressData.progress.length}\n` +
                    `Average quiz score: ${progressData.quizStats.reduce((acc, stat) => acc + stat.average_score, 0) / progressData.quizStats.length || 0}%`;
                
                addMessage(progressMessage, 'ai');
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    }
    
    // Clear conversation history
    function clearHistory() {
        conversationHistory = [];
        localStorage.removeItem('aiTutorHistory');
        chatMessages.innerHTML = '';
        addMessage('Hello! I\'m Peter, your AI tutor. How can I help you with your studies today?', 'ai');
    }

    async function testGemini() {
        console.log('Testing Gemini API...');
        const uid = localStorage.getItem('uid');
        if (!uid) {
            console.error('User not logged in');
            return;
        }
        const response = await fetchData('/api/ask', {
            method: 'POST',
            body: JSON.stringify({ userId: uid, prompt: 'Hello! Can you hear me?' })
        });
        console.log('Gemini API Response:', response);
    }
    
    // Initialize the chat when the page loads
    initChat();
    
    // Make functions available globally for testing
    window.aiTutor = {
        requestLesson,
        generateQuiz,
        getLearningProgress,
        clearHistory,
        testGemini
    };
});
