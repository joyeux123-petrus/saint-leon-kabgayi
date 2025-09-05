const axios = require('axios');

// --- IMPORTANT ---
// 1. Make sure your server is running with `npm start` or `node server.js`
// 2. Replace 'YOUR_TEACHER_AUTH_TOKEN' with a valid JWT token for a user with the 'teacher' role.
// 3. Update the noteData object with valid data. You might need to get a valid subject_id from your database.

const authToken = 'YOUR_TEACHER_AUTH_TOKEN';

const noteData = {
    title: 'Test Note from Script',
    description: 'This is a test note created from a script.',
    subject_id: 1, // Make sure this subject ID exists in your subjects table
    visibility: 'public',
    class_name: 'S6',
    sections: [
        {
            title: 'Section 1',
            content: 'Content for section 1.',
            estimated_time: 10,
            knowledge_check: [
                {
                    question_text: 'What is the capital of Rwanda?',
                    question_type: 'MCQ',
                    explanation: 'The capital of Rwanda is Kigali.',
                    options: [
                        { option_text: 'Kigali', is_correct: true },
                        { option_text: 'Huye', is_correct: false },
                        { option_text: 'Gisenyi', is_correct: false }
                    ]
                }
            ]
        }
    ],
    tags: 'test, script',
    estimated_duration: 10,
    status: 'published',
    publish_at: new Date().toISOString(),
    expires_at: null
};

async function testCreateNote() {
    if (authToken === 'YOUR_TEACHER_AUTH_TOKEN') {
        console.error('Please replace "YOUR_TEACHER_AUTH_TOKEN" with a valid token.');
        return;
    }

    try {
        const response = await axios.post('http://localhost:3001/api/notes', noteData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('Note created successfully:');
        console.log(response.data);
    } catch (error) {
        console.error('Error creating note:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testCreateNote();
