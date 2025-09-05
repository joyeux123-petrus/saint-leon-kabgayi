const db = require('../db');

// Get all notes for the logged-in teacher
exports.getAllNotes = async (req, res) => {
    try {
        // This query now joins with subjects to get the subject name
        const [notes] = await db.promise().query(`
            SELECT n.id, n.title, n.description, n.visibility, n.class_name, s.name as subject_name, n.updated_at
            FROM notes n
            JOIN subjects s ON n.subject_id = s.id
            WHERE n.teacher_id = ?
            ORDER BY n.updated_at DESC
        `, [req.user.id]);
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a new note with sections and knowledge checks
exports.createNote = async (req, res) => {
    const { title, description, subject_id, visibility, class_name, sections } = req.body;
    const teacher_id = req.user.id;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert the main note
        const [noteResult] = await connection.query(
            'INSERT INTO notes (teacher_id, subject_id, title, description, visibility, class_name) VALUES (?, ?, ?, ?, ?, ?)',
            [teacher_id, subject_id, title, description, visibility, class_name]
        );
        const noteId = noteResult.insertId;

        // 2. Loop through sections and insert them
        if (sections && sections.length > 0) {
            for (const [index, section] of sections.entries()) {
                const [sectionResult] = await connection.query(
                    'INSERT INTO note_sections (note_id, title, content, estimated_time, order_index) VALUES (?, ?, ?, ?, ?)',
                    [noteId, section.title, section.content, section.estimated_time, index]
                );
                const sectionId = sectionResult.insertId;

                // 3. Insert knowledge check questions for the section
                if (section.knowledge_check && section.knowledge_check.length > 0) {
                    for (const question of section.knowledge_check) {
                        const [questionResult] = await connection.query(
                            'INSERT INTO knowledge_check_questions (section_id, question_text, question_type, explanation) VALUES (?, ?, ?, ?)',
                            [sectionId, question.question_text, question.question_type, question.explanation]
                        );
                        const questionId = questionResult.insertId;

                        // 4. Insert options for MCQ questions
                        if ((question.question_type === 'MCQ' || question.question_type === 'True/False') && question.options && question.options.length > 0) {
                            for (const option of question.options) {
                                await connection.query(
                                    'INSERT INTO knowledge_check_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                                    [questionId, option.option_text, option.is_correct]
                                );
                            }
                        }
                    }
                }
                // Attachment handling would go here if files are uploaded
            }
        }

        await connection.commit();
        res.status(201).json({ id: noteId, message: 'Note created successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Failed to create note. Transaction rolled back.' });
    } finally {
        connection.release();
    }
};

// Get a single note with all its details for editing
exports.getNoteDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.promise().query(`
            SELECT
                n.id AS note_id, n.title AS note_title, n.description AS note_description, n.visibility, n.class_name, n.teacher_id,
                ns.id AS section_id, ns.title AS section_title, ns.content AS section_content, ns.estimated_time, ns.order_index,
                kcq.id AS question_id, kcq.question_text, kcq.question_type, kcq.explanation,
                kco.id AS option_id, kco.option_text, kco.is_correct
            FROM notes n
            LEFT JOIN note_sections ns ON n.id = ns.note_id
            LEFT JOIN knowledge_check_questions kcq ON ns.id = kcq.section_id
            LEFT JOIN knowledge_check_options kco ON kcq.id = kco.question_id
            WHERE n.id = ? AND n.teacher_id = ?
            ORDER BY ns.order_index ASC, kcq.id ASC, kco.id ASC
        `, [id, req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Note not found or you do not have permission to view it.' });
        }

        const note = {
            id: rows[0].note_id,
            title: rows[0].note_title,
            description: rows[0].note_description,
            visibility: rows[0].visibility,
            class_name: rows[0].class_name,
            teacher_id: rows[0].teacher_id,
            sections: []
        };

        const sectionMap = new Map();
        const questionMap = new Map();

        rows.forEach(row => {
            // Process sections
            if (row.section_id && !sectionMap.has(row.section_id)) {
                const section = {
                    id: row.section_id,
                    title: row.section_title,
                    content: row.section_content,
                    estimated_time: row.estimated_time,
                    order_index: row.order_index,
                    knowledge_check: []
                };
                note.sections.push(section);
                sectionMap.set(row.section_id, section);
            }

            // Process questions
            if (row.question_id && !questionMap.has(row.question_id)) {
                const question = {
                    id: row.question_id,
                    question_text: row.question_text,
                    question_type: row.question_type,
                    explanation: row.explanation,
                    options: []
                };
                sectionMap.get(row.section_id).knowledge_check.push(question);
                questionMap.set(row.question_id, question);
            }

            // Process options
            if (row.option_id && questionMap.has(row.question_id)) {
                questionMap.get(row.question_id).options.push({
                    id: row.option_id,
                    option_text: row.option_text,
                    is_correct: row.is_correct
                });
            }
        });

        // Sort sections by order_index
        note.sections.sort((a, b) => a.order_index - b.order_index);

        res.json(note);
    } catch (error) {
        console.error(`Error fetching details for note ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update an existing note
exports.updateNote = async (req, res) => {
    const { id } = req.params;
    const { title, description, subject_id, visibility, class_name, sections } = req.body;
    const teacher_id = req.user.id;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Update the main note
        await connection.query(
            'UPDATE notes SET subject_id = ?, title = ?, description = ?, visibility = ?, class_name = ? WHERE id = ? AND teacher_id = ?',
            [subject_id, title, description, visibility, class_name, id, teacher_id]
        );

        // 2. Clear existing sections and questions for simplicity.
        // A more robust implementation would diff the changes.
        await connection.query('DELETE FROM note_sections WHERE note_id = ?', [id]);

        // 3. Re-insert sections and questions like in createNote
        if (sections && sections.length > 0) {
            for (const [index, section] of sections.entries()) {
                const [sectionResult] = await connection.query(
                    'INSERT INTO note_sections (note_id, title, content, estimated_time, order_index) VALUES (?, ?, ?, ?, ?)',
                    [id, section.title, section.content, section.estimated_time, index]
                );
                const sectionId = sectionResult.insertId;

                if (section.knowledge_check && section.knowledge_check.length > 0) {
                    for (const question of section.knowledge_check) {
                        const [questionResult] = await connection.query(
                            'INSERT INTO knowledge_check_questions (section_id, question_text, question_type, explanation) VALUES (?, ?, ?, ?)',
                            [sectionId, question.question_text, question.question_type, question.explanation]
                        );
                        const questionId = questionResult.insertId;

                        if ((question.question_type === 'MCQ' || question.question_type === 'True/False') && question.options && question.options.length > 0) {
                            for (const option of question.options) {
                                await connection.query(
                                    'INSERT INTO knowledge_check_options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
                                    [questionId, option.option_text, option.is_correct]
                                );
                            }
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(200).json({ id: id, message: 'Note updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error(`Error updating note ${id}:`, error);
        res.status(500).json({ message: 'Failed to update note. Transaction rolled back.' });
    } finally {
        connection.release();
    }
};

// Delete a note
exports.deleteNote = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query('DELETE FROM notes WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Note not found or you do not have permission to delete it.' });
        }
        res.json({ message: `Note ${id} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting note ${id}:`, error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Placeholder for AI features
exports.generateAISummary = async (req, res) => {
    res.json({ message: `AI summary generation not implemented yet.` });
};

exports.suggestAIQuestions = async (req, res) => {
    res.json({ message: `AI question suggestion not implemented yet.` });
};
