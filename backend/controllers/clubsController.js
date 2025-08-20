const db = require('../models/db');

exports.listClubs = async (req, res) => {
  try {
    const [clubs] = await db.query('SELECT c.id, c.name, u.name as leader, (SELECT COUNT(*) FROM user_clubs WHERE club_id = c.id) as members FROM clubs c JOIN users u ON c.leader_id = u.id');
    res.json({ clubs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clubs.' });
  }
};

exports.getClubById = async (req, res) => {
  const { id } = req.params;
  try {
    const [club] = await db.query('SELECT c.id, c.name, c.description, u.name as leader FROM clubs c JOIN users u ON c.leader_id = u.id WHERE c.id = ?', [id]);
    if (club.length === 0) {
      return res.status(404).json({ message: 'Club not found.' });
    }
    res.json({ club: club[0] });
  } catch (err) {
    console.error('Error fetching club by ID:', err);
    res.status(500).json({ error: 'Failed to fetch club.' });
  }
};

exports.updateClub = async (req, res) => {
  const { id } = req.params;
  const { name, description, leader_id } = req.body;
  try {
    const [result] = await db.query('UPDATE clubs SET name = ?, description = ?, leader_id = ? WHERE id = ?', [name, description, leader_id, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Club not found or no changes made.' });
    }
    res.json({ message: 'Club updated successfully.' });
  } catch (err) {
    console.error('Error updating club:', err);
    res.status(500).json({ error: 'Failed to update club.' });
  }
};

exports.joinClub = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware
  try {
    await db.query('INSERT INTO user_clubs (user_id, club_id) VALUES (?, ?)', [userId, id]);
    res.json({ message: 'Successfully joined club.' });
  } catch (err) {
    console.error('Error joining club:', err);
    res.status(500).json({ error: 'Failed to join club.' });
  }
};

exports.leaveClub = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware
  try {
    await db.query('DELETE FROM user_clubs WHERE user_id = ? AND club_id = ?', [userId, id]);
    res.json({ message: 'Successfully left club.' });
  } catch (err) {
    console.error('Error leaving club:', err);
    res.status(500).json({ error: 'Failed to leave club.' });
  }
};

exports.createClub = async (req, res) => {
    const { name, description, leader_id } = req.body;
    try {
        await db.query('INSERT INTO clubs (name, description, leader_id) VALUES (?, ?, ?)', [name, description, leader_id]);
        res.json({ message: 'Club created successfully.' });
    } catch (err) {
        console.error('Error creating club:', err);
        res.status(500).json({ error: 'Failed to create club.' });
    }
};

exports.deleteClub = async (req, res) => {
    const { clubId } = req.params;
    try {
        await db.query('DELETE FROM clubs WHERE id = ?', [clubId]);
        res.json({ message: `Club ${clubId} deleted.` });
    } catch (err) {
        console.error('Error deleting club:', err);
        res.status(500).json({ error: 'Failed to delete club.' });
    }
};

exports.getClubPosts = async (req, res) => {
  // ...get club posts...
  res.json({ posts: [] });
};

exports.getMyClubs = async (req, res) => {
  try {
    // Assuming req.user.id is set by authentication middleware
    const userId = req.user.id;
    const [myClubs] = await db.query(
      'SELECT c.id, c.name, c.description FROM clubs c JOIN user_clubs uc ON c.id = uc.club_id WHERE uc.user_id = ?',
      [userId]
    );
    res.json({ clubs: myClubs });
  } catch (err) {
    console.error('Error fetching my clubs:', err);
    res.status(500).json({ error: 'Failed to fetch your clubs.' });
  }
};

exports.getExploreClubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const [exploreClubs] = await db.query(
      'SELECT c.id, c.name, c.description, (SELECT COUNT(*) FROM user_clubs WHERE club_id = c.id) AS members FROM clubs c WHERE c.id NOT IN (SELECT club_id FROM user_clubs WHERE user_id = ?)',
      [userId]
    );
    res.json({ clubs: exploreClubs });
  } catch (err) {
    console.error('Error fetching clubs to explore:', err);
    res.status(500).json({ error: 'Failed to fetch clubs to explore.' });
  }
};
