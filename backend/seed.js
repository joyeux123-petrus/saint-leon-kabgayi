require('dotenv').config({ path: 'c:\\Users\\bushoki tss\\Music\\malaria detection\\saint-leon-kabgayi\\backend\\.env' });
const Admin = require('./models/admin');
const db = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    // Seed Admin
    const adminExists = await Admin.findByEmail('joyeuxpierreishimwe@gmail.com');
    if (!adminExists) {
      await Admin.create('joyeuxpierreishimwe@gmail.com', 'Rud@2025!SeLk#HQ');
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Seed Subjects
    const subjects = [
      { name: 'Mathematics', description: 'Study of numbers, quantity, structure, space, and change.' },
      { name: 'Physics', description: 'Study of matter, motion, energy, and force.' },
      { name: 'Chemistry', description: 'Study of the composition, structure, properties and change of matter.' },
      { name: 'Biology', description: 'Study of life and living organisms.' },
      { name: 'History', description: 'Study of the past.' },
      { name: 'English', description: 'Study of English language and literature.' }
    ];

    for (const subject of subjects) {
      const [existing] = await db.query('SELECT * FROM subjects WHERE name = ?', [subject.name]);
      if (existing.length === 0) {
        await db.query('INSERT INTO subjects (name, description) VALUES (?, ?)', [subject.name, subject.description]);
        console.log(`Subject '${subject.name}' created successfully`);
      } else {
        console.log(`Subject '${subject.name}' already exists`);
      }
    }

    // Seed a Teacher User if not exists
    const teacherEmail = 'teacher@example.com';
    let teacherId;
    const [existingTeacher] = await db.query('SELECT id FROM users WHERE email = ? AND role = ?', [teacherEmail, 'teacher']);
    if (existingTeacher.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Test Teacher', teacherEmail, hashedPassword, 'teacher']
      );
      teacherId = result.insertId;
      console.log('Test Teacher user created successfully');
    } else {
      teacherId = existingTeacher[0].id;
      console.log('Test Teacher user already exists');
    }

    // Get Subject IDs
    const [mathSubject] = await db.query('SELECT subject_id FROM subjects WHERE name = ?', ['Mathematics']);
    const mathSubjectId = mathSubject.length > 0 ? mathSubject[0].id : null;

    const [historySubject] = await db.query('SELECT id FROM subjects WHERE name = ?', ['History']);
    const historySubjectId = historySubject.length > 0 ? historySubject[0].id : null;

    // Seed Notes
    if (teacherId && mathSubjectId && historySubjectId) {
      const notes = [
        {
          id: 101,
          title: 'What is HTML?',
          description: 'An introduction to HyperText Markup Language.',
          subject_id: mathSubjectId,
          uploaded_by: teacherId,
          visibility: 'public',
          class_name: 'Web Development',
          tags: 'HTML, Web',
          estimated_duration: 15,
          status: 'published',
          publish_at: new Date(),
          expires_at: null,
        },
        {
          id: 102,
          title: 'HTML Structure',
          description: 'Understanding the basic structure of an HTML document.',
          subject_id: mathSubjectId,
          uploaded_by: teacherId,
          visibility: 'public',
          class_name: 'Web Development',
          tags: 'HTML, Structure',
          estimated_duration: 20,
          status: 'published',
          publish_at: new Date(),
          expires_at: null,
        },
        {
          id: 103,
          title: 'Common HTML Tags',
          description: 'A guide to frequently used HTML tags.',
          subject_id: mathSubjectId,
          uploaded_by: teacherId,
          visibility: 'public',
          class_name: 'Web Development',
          tags: 'HTML, Tags',
          estimated_duration: 25,
          status: 'published',
          publish_at: new Date(),
          expires_at: null,
        },
        {
          id: 201,
          title: 'Introduction to CSS',
          description: 'Styling web pages with Cascading Style Sheets.',
          subject_id: historySubjectId,
          uploaded_by: teacherId,
          visibility: 'public',
          class_name: 'Web Development',
          tags: 'CSS, Styling',
          estimated_duration: 20,
          status: 'published',
          publish_at: new Date(),
          expires_at: null,
        },
      ];

      for (const note of notes) {
        // Temporarily remove check for existing notes to force insertion
        // const [existingNote] = await db.query('SELECT id FROM notes WHERE id = ?', [note.id]);
        // if (existingNote.length === 0) {
          await db.query(
            `INSERT INTO notes (id, title, description, subject_id, uploaded_by, visibility, class_name, tags, estimated_duration, status, publish_at, expires_at)` +
            ` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              note.id, note.title, note.description, note.subject_id, note.uploaded_by,
              note.visibility, note.class_name, note.tags, note.estimated_duration,
              note.status, note.publish_at, note.expires_at
            ]
          );
          console.log(`Note '${note.title}' (ID: ${note.id}) created successfully`);
        // } else {
        //   console.log(`Note '${note.title}' (ID: ${note.id}) already exists`);
        // }
      }
    } else {
      console.warn('Skipping note seeding: Teacher or Subject ID not found.');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.end();
  }
};

seed();