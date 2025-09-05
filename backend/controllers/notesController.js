const connectToDatabase = require('../db.js');

const sanitize = (val, type = 'string') => {
    if (val === 'null' || val === '' || val === undefined) return null;
    if (type === 'int') return parseInt(val);
    return val;
};

// Helper function to parse flat FormData into nested sections structure
const parseFormDataSections = (body) => {
    const sectionsMap = new Map();

    for (const key in body) {
        // Match sections[index][field]
        const sectionMatch = key.match(/^sections\[(\d+)\]\[(\w+)\]$/);
        if (sectionMatch) {
            const index = parseInt(sectionMatch[1]);
            const field = sectionMatch[2];
            if (!sectionsMap.has(index)) {
                sectionsMap.set(index, {});
            }
            sectionsMap.get(index)[field] = body[key];
            continue;
        }

        // Match sections[sectionIndex][knowledge_check][questionIndex][field]
        const questionMatch = key.match(/^sections\[(\d+)\]\[knowledge_check\]\[(\d+)\]\[(\w+)\]$/);
        if (questionMatch) {
            const sectionIndex = parseInt(questionMatch[1]);
            const questionIndex = parseInt(questionMatch[2]);
            const field = questionMatch[3];

            if (!sectionsMap.has(sectionIndex)) sectionsMap.set(sectionIndex, { knowledge_check: [] });
            const section = sectionsMap.get(sectionIndex);
            if (!section.knowledge_check) section.knowledge_check = [];
            if (!section.knowledge_check[questionIndex]) section.knowledge_check[questionIndex] = {};

            section.knowledge_check[questionIndex][field] = body[key];
            continue;
        }

        // Match sections[sectionIndex][knowledge_check][questionIndex][options][optionIndex][field]
        const optionMatch = key.match(/^sections\[(\d+)\]\[knowledge_check\]\[(\d+)\]\[options\]\[(\d+)\]\[(\w+)\]$/);
        if (optionMatch) {
            const sectionIndex = parseInt(optionMatch[1]);
            const questionIndex = parseInt(optionMatch[2]);
            const optionIndex = parseInt(optionMatch[3]);
            const field = optionMatch[4];

            if (!sectionsMap.has(sectionIndex)) sectionsMap.set(sectionIndex, { knowledge_check: [] });
            const section = sectionsMap.get(sectionIndex);
            if (!section.knowledge_check) section.knowledge_check = [];
            if (!section.knowledge_check[questionIndex]) section.knowledge_check[questionIndex] = { options: [] };
            const question = section.knowledge_check[questionIndex];
            if (!question.options) question.options = [];
            if (!question.options[optionIndex]) question.options[optionIndex] = {};

            question.options[optionIndex][field] = body[key];
            continue;
        }

        // Match sections[sectionIndex][knowledge_check][questionIndex][matching_pairs][pairIndex][field]
        const matchingPairMatch = key.match(/^sections\[(\d+)\]\[knowledge_check\]\[(\d+)\]\[matching_pairs\]\[(\d+)\]\[(\w+)\]$/);
        if (matchingPairMatch) {
            const sectionIndex = parseInt(matchingPairMatch[1]);
            const questionIndex = parseInt(matchingPairMatch[2]);
            const pairIndex = parseInt(matchingPairMatch[3]);
            const field = matchingPairMatch[4];

            if (!sectionsMap.has(sectionIndex)) sectionsMap.set(sectionIndex, { knowledge_check: [] });
            const section = sectionsMap.get(sectionIndex);
            if (!section.knowledge_check) section.knowledge_check = [];
            if (!section.knowledge_check[questionIndex]) section.knowledge_check[questionIndex] = { matching_pairs: [] };
            const question = section.knowledge_check[questionIndex];
            if (!question.matching_pairs) question.matching_pairs = [];
            if (!question.matching_pairs[pairIndex]) question.matching_pairs[pairIndex] = {};

            question.matching_pairs[pairIndex][field] = body[key];
            continue;
        }
    }

    // Convert map to sorted array
    const sortedSections = Array.from(sectionsMap.entries())
        .sort(([idxA], [idxB]) => idxA - idxB)
        .map(([, section]) => section);

    // Ensure knowledge_check, options, matching_pairs are also sorted arrays
    sortedSections.forEach(section => {
        if (section.knowledge_check) {
            section.knowledge_check = Array.from(Object.entries(section.knowledge_check))
                .sort(([idxA], [idxB]) => parseInt(idxA) - parseInt(idxB))
                .map(([, question]) => {
                    if (question.options) {
                        question.options = Array.from(Object.entries(question.options))
                            .sort(([idxA], [idxB]) => parseInt(idxA) - parseInt(idxB))
                            .map(([, option]) => option);
                    }
                    if (question.matching_pairs) {
                        question.matching_pairs = Array.from(Object.entries(question.matching_pairs))
                            .sort(([idxA], [idxB]) => parseInt(idxA) - parseInt(idxB))
                            .map(([, pair]) => pair);
                    }
                    return question;
                });
        }
    });

    return sortedSections;
};

const createNote = async (req, res) => {
    const db = await connectToDatabase();
    // Convert req.body from null-prototype to a regular object
    req.body = Object.assign({}, req.body);
    // Convert each file object in req.files from null-prototype to a regular object
    if (req.files) {
        req.files = req.files.map(file => Object.assign({}, file));
    }
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    const {
        title, description, visibility,
        tags, status,
        shared_with, student_suggestions, badge_for_completion,
        student_comments, student_annotations, student_qa
    } = req.body;
    const subject_name = req.body.subject_name; // Get subject_name separately

    const points_per_section = sanitize(req.body.points_per_section, 'int');
    const estimated_duration = sanitize(req.body.estimated_duration, 'int');
    const class_name = sanitize(req.body.class_name);
    const publish_at = sanitize(req.body.publish_at);
    const expires_at = sanitize(req.body.expires_at);
    const teacher_id = req.user.id;

    let sections = req.body.sections || []; // Directly use sections from req.body, default to empty array
    // Ensure sections is an array, even if it's a single object or undefined
    if (!Array.isArray(sections)) {
        sections = sections ? [sections] : [];
    }

    // Ensure all nested objects within sections and knowledge_check are regular objects
    sections = sections.map(section => {
        const newSection = Object.assign({}, section);
        if (newSection.knowledge_check) {
            newSection.knowledge_check = newSection.knowledge_check.map(kc => {
                const newKc = Object.assign({}, kc);
                if (newKc.options) {
                    newKc.options = newKc.options.map(opt => Object.assign({}, opt));
                }
                if (newKc.matching_pairs) {
                    newKc.matching_pairs = newKc.matching_pairs.map(pair => Object.assign({}, pair));
                }
                return newKc;
            });
        }
        return newSection;
    });

    console.log('--- createNote Debug ---');
    console.log('req.body:', req.body);
    console.log('Parsed sections:', sections);
    console.log('------------------------');

    // --- Validation ---
    if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Note title is required.' });
    }
    if (!subject_name || subject_name.trim() === '') {
        return res.status(400).json({ message: 'Subject is required.' });
    }
    if (!sections || sections.length === 0) {
        return res.status(400).json({ message: 'At least one section is required for the note.' });
    }
    for (const section of sections) {
        if (!section.title || section.title.trim() === '') {
            return res.status(400).json({ message: 'All sections must have a title.' });
        }
    }
    // --- End Validation ---

    const file_paths = req.files ? req.files.map(file => file.path) : [];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get subject_id from subject_name
        const [subjectRows] = await connection.query('SELECT subject_id FROM subjects WHERE name = ?', [subject_name]);
        if (subjectRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid subject name provided.' });
        }
        const subject_id = subjectRows[0].subject_id;

        const [noteResult] = await connection.query(
            `INSERT INTO notes (title, description, teacher_id, subject_id, visibility, class_name, tags, estimated_duration, status, publish_at, expires_at, shared_with, student_suggestions, points_per_section, badge_for_completion, student_comments, student_annotations, student_qa, media_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [title, description, teacher_id, subject_id, visibility, class_name, tags, estimated_duration, status, publish_at, expires_at, shared_with, student_suggestions, points_per_section, badge_for_completion, student_comments, student_annotations, student_qa, JSON.stringify(file_paths)]
        );
        const noteId = noteResult.insertId;

        if (sections && Array.isArray(sections)) {
            for (const [i, section] of sections.entries()) {
                const [sectionResult] = await connection.query(
                    `INSERT INTO note_sections (note_id, title, content, estimated_time, order_index) VALUES (?, ?, ?, ?, ?)`, 
                    [noteId, section.title, section.content, sanitize(section.estimated_time, 'int'), i]
                );
                const sectionId = sectionResult.insertId;

                if (section.knowledge_check && Array.isArray(section.knowledge_check)) {
                    for (const question of section.knowledge_check) {
                        const [questionResult] = await connection.query(
                            `INSERT INTO knowledge_check_questions (section_id, question_text, question_type, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)`, 
                            [sectionId, question.question_text, question.question_type, question.correct_answer || null, question.explanation]
                        );
                        const questionId = questionResult.insertId;

                        if (question.question_type === 'MCQ' || question.question_type === 'True/False') {
                            if (question.options && Array.isArray(question.options)) {
                                for (const option of question.options) {
                                    await connection.query(
                                        `INSERT INTO knowledge_check_options (question_id, choice_text, is_correct) VALUES (?, ?, ?)`, 
                                        [questionId, option.option_text || null, option.is_correct === true || option.is_correct === 'true' ? 1 : 0]
                                    );
                                }
                            }
                        } else if (question.question_type === 'Matching') {
                            if (question.matching_pairs && Array.isArray(question.matching_pairs)) {
                                for (const pair of question.matching_pairs) {
                                    await connection.query(
                                        `INSERT INTO knowledge_check_matching_pairs (question_id, prompt, correct_match) VALUES (?, ?, ?)`, 
                                        [questionId, pair.prompt, pair.correct_match]
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Note created successfully', noteId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error creating note.' });
    } finally {
        connection.release();
    }
};

const updateNote = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    // Convert req.body from null-prototype to a regular object
    req.body = Object.assign({}, req.body);
    // Convert each file object in req.files from null-prototype to a regular object
    if (req.files) {
        req.files = req.files.map(file => Object.assign({}, file));
    }
    const {
        title, description, visibility,
        tags, status,
        shared_with, student_suggestions, badge_for_completion,
        student_comments, student_annotations, student_qa
    } = req.body;
    const subject_name = req.body.subject_name; // Get subject_name separately

    const points_per_section = sanitize(req.body.points_per_section, 'int');
    const estimated_duration = sanitize(req.body.estimated_duration, 'int');
    const class_name = sanitize(req.body.class_name);
    const publish_at = sanitize(req.body.publish_at);
    const expires_at = sanitize(req.body.expires_at);
    let sections = req.body.sections || []; // Directly use sections from req.body, default to empty array
    // Ensure sections is an array, even if it's a single object or undefined
    if (!Array.isArray(sections)) {
        sections = sections ? [sections] : [];
    }

    console.log('--- updateNote Debug ---');
    console.log('req.body:', req.body);
    console.log('Parsed sections:', sections);
    console.log('------------------------');

    // --- Validation ---
    if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Note title is required.' });
    }
    if (!subject_name || subject_name.trim() === '') {
        return res.status(400).json({ message: 'Subject is required.' });
    }
    if (!sections || sections.length === 0) {
        return res.status(400).json({ message: 'At least one section is required for the note.' });
    }
    for (const section of sections) {
        if (!section.title || section.title.trim() === '') {
            return res.status(400).json({ message: 'All sections must have a title.' });
        }
    }
    // --- End Validation ---

    const file_paths = req.files ? req.files.map(file => file.path) : [];

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get subject_id from subject_name
        const [subjectRows] = await connection.query('SELECT subject_id FROM subjects WHERE name = ?', [subject_name]);
        if (subjectRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid subject name provided.' });
        }
        const subject_id = subjectRows[0].subject_id;

        // Fetch existing note to preserve existing file_paths if no new files are uploaded
        const [existingNoteRows] = await connection.query('SELECT media_url FROM notes WHERE id = ?', [id]);
        let existingFilePaths = [];
        if (existingNoteRows.length > 0 && existingNoteRows[0].media_url) {
            existingFilePaths = JSON.parse(existingNoteRows[0].media_url).filter(p => p);
        }
        const updatedFilePaths = JSON.stringify([...existingFilePaths, ...file_paths]);

        await connection.query(
            `UPDATE notes SET title = ?, description = ?, subject_id = ?, visibility = ?, class_name = ?, tags = ?, estimated_duration = ?, status = ?, publish_at = ?, expires_at = ?, shared_with = ?, student_suggestions = ?, points_per_section = ?, badge_for_completion = ?, student_comments = ?, student_annotations = ?, student_qa = ?, media_url = ? WHERE id = ?`,
            [title, description, subject_id, visibility, class_name, tags, estimated_duration, status, publish_at, expires_at, shared_with, student_suggestions, points_per_section, badge_for_completion, student_comments, student_annotations, student_qa, updatedFilePaths, id]
        );

        // Delete existing sections and re-insert them to handle updates/deletions
        // Also delete related knowledge check questions, options, and matching pairs
        await connection.query(`
            DELETE kco, kcm, kcq, ns
            FROM note_sections ns
            LEFT JOIN knowledge_check_questions kcq ON ns.id = kcq.section_id
            LEFT JOIN knowledge_check_options kco ON kcq.id = kco.question_id
            LEFT JOIN knowledge_check_matching_pairs kcm ON kcq.id = kcm.question_id
            WHERE ns.note_id = ?
        `, [id]);


        if (sections && Array.isArray(sections)) {
            for (const [i, section] of sections.entries()) {
                const [sectionResult] = await connection.query(
                    `INSERT INTO note_sections (note_id, title, content, estimated_time, order_index) VALUES (?, ?, ?, ?, ?)`,
                    [id, section.title, section.content, sanitize(section.estimated_time, 'int'), i]
                );
                const sectionId = sectionResult.insertId;

                if (section.knowledge_check && Array.isArray(section.knowledge_check)) {
                    for (const question of section.knowledge_check) {
                        const [questionResult] = await connection.query(
                            `INSERT INTO knowledge_check_questions (section_id, question_text, question_type, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)`,
                            [sectionId, question.question_text, question.question_type, question.correct_answer || null, question.explanation]
                        );
                        const questionId = questionResult.insertId;

                        if (question.question_type === 'MCQ' || question.question_type === 'True/False') {
                            if (question.options && Array.isArray(question.options)) {
                                for (const option of question.options) {
                                    await connection.query(
                                        `INSERT INTO knowledge_check_options (question_id, choice_text, is_correct) VALUES (?, ?, ?)`,
                                        [questionId, option.option_text || null, option.is_correct === true || option.is_correct === 'true' ? 1 : 0]
                                    );
                                }
                            }
                        } else if (question.question_type === 'Matching') {
                            if (question.matching_pairs && Array.isArray(question.matching_pairs)) {
                                for (const pair of question.matching_pairs) {
                                    await connection.query(
                                        `INSERT INTO knowledge_check_matching_pairs (question_id, prompt, correct_match) VALUES (?, ?, ?)`,
                                        [questionId, pair.prompt, pair.correct_match]
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Note updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Server error updating note.' });
    } finally {
        connection.release();
    }
};

const getNoteById = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    try {
        const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
        if (notes.length === 0) {
            return res.status(404).json({ message: 'Note not found.' });
        }
        const note = notes[0];

        let [sections] = await db.query('SELECT * FROM note_sections WHERE note_id = ? ORDER BY order_index', [id]);

        // Filter out sections containing "introduction to HTML" in title or content
        sections = sections.filter(section => {
            const titleLower = section.title ? section.title.toLowerCase() : '';
            const contentLower = section.content ? section.content.toLowerCase() : '';
            return !titleLower.includes('introduction to html') && !contentLower.includes('introduction to html');
        });

        for (const section of sections) {
            const [questions] = await db.query('SELECT * FROM knowledge_check_questions WHERE section_id = ?', [section.id]);
            section.knowledge_check = questions;

            for (const question of questions) {
                if (question.question_type === 'MCQ' || question.question_type === 'True/False') {
                    const [options] = await db.query('SELECT * FROM knowledge_check_options WHERE question_id = ?', [question.id]);
                    question.options = options;
                } else if (question.question_type === 'Matching') {
                    const [matching_pairs] = await db.query('SELECT * FROM knowledge_check_matching_pairs WHERE question_id = ?', [question.id]);
                    question.matching_pairs = matching_pairs;
                }
            }
        }

        note.sections = sections;

        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching note by ID:', error);
        res.status(500).json({ message: 'Server error fetching note.' });
    }
};

// Fetch all notes with teacher name + subject name
const getNotes = async (req, res) => {
    const db = await connectToDatabase();
  try {
    const [rows] = await db.query(
      `
  SELECT n.*, u.name AS teacher_name, s.name AS subject_name, n.class_name
  FROM notes n
  LEFT JOIN users u ON n.teacher_id = u.id
  LEFT JOIN subjects s ON n.subject_id = s.subject_id
  ORDER BY n.created_at DESC
`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

const deleteNote = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    const userId = req.user.id; // Assuming user ID is available from auth middleware
    const userRole = req.user.role; // Assuming user role is available from auth middleware

    console.log(`Attempting to delete note: ${id} by user: ${userId} with role: ${userRole}`);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify if the note exists and if the user has permission to delete it
        const [note] = await connection.query('SELECT teacher_id FROM notes WHERE id = ?', [id]);

        if (note.length === 0) {
            console.log(`Note ${id} not found.`);
            await connection.rollback();
            return res.status(404).json({ message: 'Note not found' });
        }

        // Only the creator or an admin can delete the note
        if (userRole === 'teacher' && note[0].teacher_id !== userId) {
            console.log(`User ${userId} (teacher) attempted to delete note ${id} not created by them.`);
            await connection.rollback();
            return res.status(403).json({ message: 'Forbidden: You can only delete notes you created.' });
        }

        console.log(`Deleting related data for note ${id}...`);

        // Delete related data in correct order to avoid foreign key constraints issues
        // 1. Delete note_annotations
        await connection.query('DELETE FROM note_annotations WHERE note_id = ?', [id]);
        console.log('Deleted note_annotations.');

        // 2. Delete note_interactions
        await connection.query('DELETE FROM note_interactions WHERE note_id = ?', [id]);
        console.log('Deleted note_interactions.');

        // 3. Delete knowledge_check_options and knowledge_check_matching_pairs (depend on knowledge_check_questions)
        await connection.query('DELETE FROM knowledge_check_options WHERE question_id IN (SELECT id FROM knowledge_check_questions WHERE section_id IN (SELECT id FROM note_sections WHERE note_id = ?)) ', [id]);
        console.log('Deleted knowledge_check_options.');
        await connection.query('DELETE FROM knowledge_check_matching_pairs WHERE question_id IN (SELECT id FROM knowledge_check_questions WHERE section_id IN (SELECT id FROM note_sections WHERE note_id = ?)) ', [id]);
        console.log('Deleted knowledge_check_matching_pairs.');

        // 4. Delete knowledge_check_questions (depends on note_sections)
        await connection.query('DELETE FROM knowledge_check_questions WHERE section_id IN (SELECT id FROM note_sections WHERE note_id = ?)', [id]);
        console.log('Deleted knowledge_check_questions.');

        // 5. Delete note_sections
        await connection.query('DELETE FROM note_sections WHERE note_id = ?', [id]);
        console.log('Deleted note_sections.');

        // 6. Finally, delete the note itself
        const [result] = await connection.query('DELETE FROM notes WHERE id = ?', [id]);
        console.log(`Deleted note ${id}. Affected rows: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            console.log(`Note ${id} not found after all deletions (should not happen if note existed initially).`);
            await connection.rollback();
            return res.status(404).json({ message: 'Note not found after all deletions (should not happen if note existed initially)' });
        }

        await connection.commit();
        console.log(`Note ${id} and all related data deleted successfully.`);
        res.status(200).json({ message: 'Note deleted successfully.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error deleting note:', error);
        return res.status(500).json({ message: 'Server error deleting note.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const searchNotes = async (req, res) => {
    const db = await connectToDatabase();
    const { q: keyword, class: className, subject } = req.query;
    let query = 'SELECT n.*, u.name as teacher_name, s.name as subject_name FROM notes n LEFT JOIN users u ON n.teacher_id = u.id LEFT JOIN subjects s ON n.subject_id = s.subject_id WHERE 1=1';
    const params = [];

    if (keyword) {
        query += ' AND (n.title LIKE ? OR n.description LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (className) {
        query += ' AND n.class_name = ?';
        params.push(className);
    }
    if (subject) {
        query += ' AND s.name = ?';
        params.push(subject);
    }

    try {
        const [notes] = await db.query(query, params);
        res.status(200).json(notes);
    } catch (error) {
        console.error('Error searching notes:', error);
        res.status(500).json({ message: 'Server error during note search.' });
    }
};

const addAnnotation = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    const { annotation, start_pos, end_pos, type, emotion } = req.body;

    if (!note_id || !req.user || !req.user.id || !annotation || !start_pos || !end_pos || !type) {
        return res.status(400).json({ message: 'Missing required fields or user information.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO note_annotations (note_id, user_id, annotation, start_pos, end_pos, type, emotion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [note_id, req.user.id, annotation, start_pos, end_pos, type, emotion]
        );
        res.status(201).json({ message: 'Annotation added successfully', annotationId: result.insertId });
    } catch (error) {
        console.error('Error adding annotation:', error);
        res.status(500).json({ message: 'Server error adding annotation.' });
    }
};

const getAnnotations = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    try {
        const [annotations] = await db.query('SELECT * FROM note_annotations WHERE note_id = ?', [note_id]);
        res.status(200).json(annotations);
    } catch (error) {
        console.error('Error fetching annotations:', error);
        res.status(500).json({ message: 'Server error fetching annotations.' });
    }
};

const updateAnnotation = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { annotation, start_pos, end_pos, type, emotion } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE note_annotations SET annotation = ?, start_pos = ?, end_pos = ?, type = ?, emotion = ? WHERE id = ? AND user_id = ?',
            [annotation, start_pos, end_pos, type, emotion, id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Annotation not found or not authorized.' });
        }
        res.status(200).json({ message: 'Annotation updated successfully.' });
    } catch (error) {
        console.error('Error updating annotation:', error);
        res.status(500).json({ message: 'Server error updating annotation.' });
    }
};

const deleteAnnotation = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM NoteAnnotations WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Annotation not found or not authorized.' });
        }
        res.status(200).json({ message: 'Annotation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting annotation:', error);
        res.status(500).json({ message: 'Server error deleting annotation.' });
    }
};

const trackInteraction = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    const { interaction_type, duration } = req.body;

    if (!note_id || !req.user || !req.user.id || !interaction_type) {
        return res.status(400).json({ message: 'Missing required fields or user information.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO note_interactions (note_id, user_id, interaction_type, duration) VALUES (?, ?, ?, ?)',
            [note_id, req.user.id, interaction_type, duration || 0]
        );
        res.status(201).json({ message: 'Interaction tracked successfully', interactionId: result.insertId });
    } catch (error) {
        console.error('Error tracking interaction:', error);
        res.status(500).json({ message: 'Server error tracking interaction.' });
    }
};

const getEngagementStats = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    try {
        const [stats] = await db.query(`
            SELECT 
                interaction_type,
                COUNT(*) as count,
                AVG(duration) as avg_duration
            FROM note_interactions 
            WHERE note_id = ? 
            GROUP BY interaction_type
        `, [note_id]);
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching engagement stats:', error);
        res.status(500).json({ message: 'Server error fetching engagement stats.' });
    }
};

const generateAIEnhancements = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    try {
        res.status(200).json({ 
            message: 'AI enhancements generated successfully',
            enhancements: {
                summary: "AI-generated summary of the note",
                key_points: ["Key point 1", "Key point 2", "Key point 3"],
                questions: ["Question 1 for review", "Question 2 for review"]
            }
        });
    } catch (error) {
        console.error('Error generating AI enhancements:', error);
        res.status(500).json({ message: 'Server error generating AI enhancements.' });
    }
};

const getAIEnhancements = async (req, res) => {
    const db = await connectToDatabase();
    const { id: note_id } = req.params;
    try {
        const [enhancements] = await db.query(
            'SELECT * FROM note_ai_enhancements WHERE note_id = ? ORDER BY created_at DESC LIMIT 1',
            [note_id]
        );
        
        if (enhancements.length === 0) {
            return res.status(404).json({ message: 'No AI enhancements found for this note.' });
        }
        
        res.status(200).json(enhancements[0]);
    } catch (error) {
        console.error('Error fetching AI enhancements:', error);
        res.status(500).json({ message: 'Server error fetching AI enhancements.' });
    }
};

const getTeacherNotes = async (req, res) => {
    const db = await connectToDatabase();
    const teacher_id = req.user ? req.user.id : null; // Get teacher ID from authenticated user

    if (!teacher_id) {
        console.log("getTeacherNotes: User not authenticated or user ID missing.");
        return res.status(401).json({ error: 'User not authenticated or user ID missing.' });
    }

    console.log(`getTeacherNotes: Fetching notes for teacher_id: ${teacher_id}`);

    try {
        const [rows] = await db.query(
            `SELECT n.*, s.name AS subject_name,
                    0 AS unique_students_engaged,
                    0 AS total_interactions
             FROM notes n
             LEFT JOIN subjects s ON n.subject_id = s.subject_id
             WHERE n.teacher_id = ?
             ORDER BY n.created_at DESC`,
            [teacher_id]
        );
        console.log(`getTeacherNotes: Found ${rows.length} notes for teacher_id: ${teacher_id}`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching notes for teacher:', err);
        res.status(500).json({ error: 'Failed to fetch notes for teacher' });
    }
};

module.exports = {
    createNote,
    updateNote,
    getNoteById,
    getNotes,
    deleteNote,
    searchNotes,
    addAnnotation,
    getAnnotations,
    updateAnnotation,
    deleteAnnotation,
    trackInteraction,
    getEngagementStats,
    generateAIEnhancements,
    getAIEnhancements,
    getTeacherNotes
};

