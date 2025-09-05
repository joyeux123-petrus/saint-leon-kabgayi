const connectToDatabase = require('../db.js');

const getAllSubjects = async (req, res) => {
    const db = await connectToDatabase();
    const { class_name } = req.query; // Get class_name from query parameters
    try {
        let query = 'SELECT * FROM subjects';
        const queryParams = [];

        if (class_name) {
            query += ' WHERE class_name = ?';
            queryParams.push(class_name);
        }

        const [results] = await db.query(query, queryParams);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching subjects:', err);
        res.status(500).json({ message: 'Error fetching subjects' });
    }
};

const getSubjectById = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM subjects WHERE id = ?';
        const [result] = await db.query(query, [id]);
        if (result.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json(result[0]);
    } catch (err) {
        console.error('Error fetching subject:', err);
        res.status(500).json({ message: 'Error fetching subject' });
    }
};

const createSubject = async (req, res) => {
    const db = await connectToDatabase();
    const { name, description } = req.body;
    try {
        const query = 'INSERT INTO subjects (name, description) VALUES (?, ?)';
        const [result] = await db.query(query, [name, description]);
        res.status(201).json({ message: 'Subject created successfully', subjectId: result.insertId });
    } catch (err) {
        console.error('Error creating subject:', err);
        res.status(500).json({ message: 'Error creating subject' });
    }
};

const updateSubject = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const query = 'UPDATE subjects SET name = ?, description = ? WHERE id = ?';
        const [result] = await db.query(query, [name, description, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject updated successfully' });
    } catch (err) {
        console.error('Error updating subject:', err);
        res.status(500).json({ message: 'Error updating subject' });
    }
};

const deleteSubject = async (req, res) => {
    const db = await connectToDatabase();
    const { id } = req.params;
    try {
        const query = 'DELETE FROM subjects WHERE id = ?';
        const [result] = await db.query(query, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ message: 'Error deleting subject' });
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};