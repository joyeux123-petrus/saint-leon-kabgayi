import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with the provided API key
const genAI = new GoogleGenerativeAI('AIzaSyBowZ3NY73dPKVOtgTrODSStH24M8qxbPY');

// System prompt for the AI tutor "Peter"
const SYSTEM_PROMPT = `You are Peter, an AI tutor created by ISHIMWE Joyeux Pierre. Your role is to teach high school students effectively.

RULES:
1. Lesson Explanation: Provide clear, simple explanations for any lesson requested. Cover all important points from start to end. Use examples where necessary. Adapt explanations based on the student's level (high school).

2. Progress Tracking: Track the student's learning progress. Record which lessons the student has completed. Keep scores from quizzes or exercises. Suggest the next lesson or topic based on their progress.

3. Quizzes and Exercises: Generate quizzes for each lesson. Include multiple-choice, fill-in-the-blank, and short-answer questions. Provide the correct answers internally so the system can score automatically. Offer exercises for the student to practice after lessons.

4. Study Advice: Analyze the student's progress and scores. Provide personalized study advice, like "Focus more on Algebra" or "Revise History chapters 2 and 3." Suggest exercises to improve weak areas.

5. Student Interaction: When asked, confirm the student's name and details. Respond respectfully and in an encouraging tone.

6. Identity: Always identify as: "I am Peter, your AI tutor." Creator: ISHIMWE Joyeux Pierre.

7. Output Format: Always respond with valid JSON in this exact format:
{
  "lessonTitle": "Lesson Name",
  "explanation": "Full detailed explanation of the lesson",
  "quizzes": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B"
    }
  ],
  "advice": "Study advice for the student",
  "nextLesson": "Recommended next lesson"
}

For general conversations, use this format:
{
  "response": "Your conversational response",
  "type": "conversation"
}

For quiz answers, use this format:
{
  "score": 85,
  "feedback": "Detailed feedback on performance",
  "correctAnswers": ["A", "B", "C"],
  "type": "quiz_result"
}

IMPORTANT: Always respond with valid JSON, no additional text.`;

class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });
        
        this.conversationHistory = new Map(); // Store conversation history by student ID
    }

    // Get or create conversation history for a student
    getConversationHistory(studentId) {
        if (!this.conversationHistory.has(studentId)) {
            this.conversationHistory.set(studentId, []);
        }
        return this.conversationHistory.get(studentId);
    }

    // Add message to conversation history
    addToHistory(studentId, role, content) {
        const history = this.getConversationHistory(studentId);
        history.push({ role, content });
        // Keep only the last 20 messages to manage context length
        if (history.length > 20) {
            history.shift();
        }
    }

    // Generate response using Gemini AI
    async generateResponse(studentId, message, context = {}) {
        try {
            const history = this.getConversationHistory(studentId);
            
            // Build the prompt with system instructions and conversation history
            let prompt = SYSTEM_PROMPT + '\n\n';
            
            // Add student context if available
            if (context.studentName) {
                prompt += `Student: ${context.studentName}\n`;
            }
            if (context.gradeLevel) {
                prompt += `Grade Level: ${context.gradeLevel}\n`;
            }
            if (context.previousLessons && context.previousLessons.length > 0) {
                prompt += `Previous Lessons: ${context.previousLessons.join(', ')}\n`;
            }
            
            prompt += '\nConversation History:\n';
            
            // Add conversation history
            history.forEach((msg, index) => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
            
            prompt += `\nStudent: ${message}\n`;
            prompt += 'AI Tutor Peter: ';
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Parse JSON response
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                // Fallback to conversation format if JSON parsing fails
                jsonResponse = {
                    response: text,
                    type: 'conversation'
                };
            }
            
            // Add to conversation history
            this.addToHistory(studentId, 'student', message);
            this.addToHistory(studentId, 'assistant', JSON.stringify(jsonResponse));
            
            return jsonResponse;
            
        } catch (error) {
            console.error('Error generating AI response:', error);
            throw new Error('Failed to generate AI response');
        }
    }

    // Generate lesson content specifically
    async generateLesson(lessonTopic, difficulty = 'medium', studentContext = {}) {
        const prompt = `Generate a comprehensive lesson about "${lessonTopic}" for high school level (${difficulty} difficulty). 
        Include detailed explanations, examples, and key points. Format the response as JSON with lessonTitle, explanation, 
        quizzes array, advice, and nextLesson fields.`;
        
        return this.generateResponse(studentContext.studentId || 'lesson', prompt, studentContext);
    }

    // Generate quiz for a specific lesson
    async generateQuiz(lessonTopic, questionCount = 5, studentContext = {}) {
        const prompt = `Generate a ${questionCount}-question quiz about "${lessonTopic}" for high school level. 
        Include multiple-choice questions with 4 options each. Provide the correct answers. Format as JSON with quizzes array.`;
        
        return this.generateResponse(studentContext.studentId || 'quiz', prompt, studentContext);
    }

    // Clear conversation history for a student
    clearHistory(studentId) {
        this.conversationHistory.set(studentId, []);
    }
}

export default new GeminiService();
