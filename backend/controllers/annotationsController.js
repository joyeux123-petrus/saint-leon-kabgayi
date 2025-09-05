const db = require('../db');

exports.getAnnotationsForNote = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.id;

    try {
        const [annotations] = await db.query('SELECT * FROM annotations WHERE note_id = ? AND user_id = ?', [noteId, userId]);
        res.json(annotations);
    } catch (error) {
        console.error('Error fetching annotations:', error);
        res.status(500).json({ message: 'Error fetching annotations' });
    }
};

exports.createAnnotation = async (req, res) => {
    const { note_id, section_id, highlighted_text, comment } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await db.query('INSERT INTO annotations (user_id, note_id, section_id, highlighted_text, comment) VALUES (?, ?, ?, ?, ?)', [user_id, note_id, section_id, highlighted_text, comment]);
        const newAnnotationId = result.insertId;
        const [newAnnotation] = await db.query('SELECT * FROM annotations WHERE id = ?', [newAnnotationId]);
        res.status(201).json(newAnnotation[0]);
    } catch (error) {
        console.error('Error creating annotation:', error);
        res.status(500).json({ message: 'Error creating annotation' });
    }
};

exports.deleteAnnotation = async (req, res) => {
    const { annotationId } = req.params;
    const userId = req.user.id;

    try {
        await db.query('DELETE FROM annotations WHERE id = ? AND user_id = ?', [annotationId, userId]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting annotation:', error);
        res.status(500).json({ message: 'Error deleting annotation' });
    }
};
