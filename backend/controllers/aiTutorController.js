const connectToDatabase = require('../db.js');
const geminiService = require('../utils/geminiService.js');

class AITutorController {
    // Get student context for AI interactions
    async getStudentContext(studentId) {
        const db = await connectToDatabase();
        try {
            // Get student profile information
            const [studentRows] = await db.query(
                'SELECT name, className, parish FROM users WHERE id = ? AND role = ?',
                [studentId, 'student']
            );
            
            if (studentRows.length === 0) {
                return { studentId };
            }
            
            const student = studentRows[0];
            
            // Get completed lessons
            const [completedLessons] = await db.query(
                'SELECT DISTINCT lesson_topic FROM ai_tutor_progress WHERE student_id = ? AND status = ?',
                [studentId, 'completed']
            );
            
            // Get quiz scores
            const [quizScores] = await db.query(
                'SELECT lesson_topic, AVG(score) as avg_score FROM ai_tutor_quizzes WHERE student_id = ? GROUP BY lesson_topic',
                [studentId]
            );
            
            return {
                studentId,
                studentName: student.name,
                gradeLevel: student.className || 'High School',
                previousLessons: completedLessons.map(lesson => lesson.lesson_topic),
                quizScores: quizScores.reduce((acc, score) => {
                    acc[score.lesson_topic] = score.avg_score;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Error getting student context:', error.message, error.stack);
            return { studentId };
        }
    }

    // Handle AI tutor conversation
    async handleConversation(req, res) {
        const { message } = req.body;
        const studentId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        try {
            // Get student context for personalized responses
            const studentContext = await this.getStudentContext(studentId);
            
            // Generate AI response
            const aiResponse = await geminiService.generateResponse(studentId, message, studentContext);
            
            // Store the interaction in database
            await this.storeInteraction(studentId, message, aiResponse);
            
            res.json(aiResponse);
            
        } catch (error) {
            console.error('Error in AI conversation:', error);
            res.status(500).json({ error: 'Failed to process AI conversation' });
        }
    }

    // Generate specific lesson
    async generateLesson(req, res) {
        const { topic, difficulty = 'medium' } = req.body;
        const studentId = req.user.id;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        try {
            const studentContext = await this.getStudentContext(studentId);
            const lesson = await geminiService.generateLesson(topic, difficulty, studentContext);
            
            // Store lesson generation
            await this.storeLessonGeneration(studentId, topic, lesson);
            
            res.json(lesson);
            
        } catch (error) {
            console.error('Error generating lesson:', error);
            res.status(500).json({ error: 'Failed to generate lesson' });
        }
    }

    // Generate quiz for a lesson
    async generateQuiz(req, res) {
        const { topic, questionCount = 5 } = req.body;
        const studentId = req.user.id;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        try {
            const studentContext = await this.getStudentContext(studentId);
            const quiz = await geminiService.generateQuiz(topic, questionCount, studentContext);
            
            res.json(quiz);
            
        } catch (error) {
            console.error('Error generating quiz:', error);
            res.status(500).json({ error: 'Failed to generate quiz' });
        }
    }

    // Submit quiz answers and get results
    async submitQuiz(req, res) {
        const { lessonTopic, answers } = req.body;
        const studentId = req.user.id;

        if (!lessonTopic || !answers) {
            return res.status(400).json({ error: 'Lesson topic and answers are required' });
        }

        try {
            // For now, we'll simulate quiz scoring since the AI needs to evaluate the answers
            // In a real implementation, we'd send the answers to the AI for evaluation
            const prompt = `Evaluate these quiz answers for lesson "${lessonTopic}". Answers: ${JSON.stringify(answers)}. 
                           Provide score, feedback, and correct answers.`;
            
            const evaluation = await geminiService.generateResponse(studentId, prompt, {});
            
            // Store quiz results
            await this.storeQuizResults(studentId, lessonTopic, answers, evaluation);
            
            res.json(evaluation);
            
        } catch (error) {
            console.error('Error submitting quiz:', error);
            res.status(500).json({ error: 'Failed to evaluate quiz' });
        }
    }

    // Get conversation history
    async getConversationHistory(req, res) {
        const db = await connectToDatabase();
        const studentId = req.user.id;
        const { limit = 50 } = req.query;

        try {
            const [history] = await db.query(
                'SELECT * FROM ai_tutor_interactions WHERE student_id = ? ORDER BY created_at DESC LIMIT ?',
                [studentId, parseInt(limit)]
            );
            
            res.json({ history });
            
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            res.status(500).json({ error: 'Failed to fetch conversation history' });
        }
    }

    // Get learning progress
    async getLearningProgress(req, res) {
        const db = await connectToDatabase();
        const studentId = req.user.id;

        try {
            const [progress] = await db.query(
                `SELECT lesson_topic, status, MAX(created_at) as last_interaction, 
                 COUNT(*) as interaction_count 
                 FROM ai_tutor_progress 
                 WHERE student_id = ? 
                 GROUP BY lesson_topic, status 
                 ORDER BY last_interaction DESC`,
                [studentId]
            );
            
            const [quizStats] = await db.query(
                `SELECT lesson_topic, AVG(score) as average_score, COUNT(*) as quiz_count 
                 FROM ai_tutor_quizzes 
                 WHERE student_id = ? 
                 GROUP BY lesson_topic`,
                [studentId]
            );
            
            res.json({ progress, quizStats });
            
        } catch (error) {
            console.error('Error fetching learning progress:', error.message, error.stack);
            res.status(500).json({ error: 'Failed to fetch learning progress' });
        }
    }

    // Store interaction in database
    async storeInteraction(studentId, userMessage, aiResponse) {
        const db = await connectToDatabase();
        try {
            await db.query(
                'INSERT INTO ai_tutor_interactions (student_id, user_message, ai_response, response_type) VALUES (?, ?, ?, ?)',
                [studentId, userMessage, JSON.stringify(aiResponse), aiResponse.type || 'conversation']
            );
        } catch (error) {
            console.error('Error storing interaction:', error);
        }
    }

    // Store lesson generation
    async storeLessonGeneration(studentId, topic, lessonData) {
        const db = await connectToDatabase();
        try {
            await db.query(
                'INSERT INTO ai_tutor_progress (student_id, lesson_topic, status, lesson_data) VALUES (?, ?, ?, ?)',
                [studentId, topic, 'viewed', JSON.stringify(lessonData)]
            );
        } catch (error) {
            console.error('Error storing lesson generation:', error);
        }
    }

    // Store quiz results
    async storeQuizResults(studentId, topic, answers, results) {
        const db = await connectToDatabase();
        try {
            await db.query(
                'INSERT INTO ai_tutor_quizzes (student_id, lesson_topic, answers, score, feedback) VALUES (?, ?, ?, ?, ?)',
                [studentId, topic, JSON.stringify(answers), results.score || 0, results.feedback || '']
            );
            
            // Update progress to completed if score is good
            if (results.score >= 70) {
                await db.query(
                    'UPDATE ai_tutor_progress SET status = ? WHERE student_id = ? AND lesson_topic = ?',
                    ['completed', studentId, topic]
                );
            }
        } catch (error) {
            console.error('Error storing quiz results:', error);
        }
    }

    // Clear conversation history
    async clearHistory(req, res) {
        const db = await connectToDatabase();
        const studentId = req.user.id;

        try {
            await db.query(
                'DELETE FROM ai_tutor_interactions WHERE student_id = ?',
                [studentId]
            );
            
            geminiService.clearHistory(studentId);
            
            res.json({ message: 'Conversation history cleared successfully' });
            
        } catch (error) {
            console.error('Error clearing history:', error);
            res.status(500).json({ error: 'Failed to clear conversation history' });
        }
    }
}

module.exports = new AITutorController();