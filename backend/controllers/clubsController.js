const db = require('../models/db');

exports.listClubs = async (req, res) => {
  try {
    const [clubs] = await db.query('SELECT c.id, c.name, u.name as leader, (SELECT COUNT(*) FROM user_clubs WHERE club_id = c.id) as members FROM clubs c JOIN users u ON c.leader_id = u.id');
    res.json({ clubs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clubs.' });
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
