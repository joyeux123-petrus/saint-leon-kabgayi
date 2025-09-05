const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');

router.get('/vatican-news', async (req, res) => {
    let parser = new Parser();
    const RSS_FEED_URL = 'https://www.vaticannews.va/en.rss.xml';

    try {
        let feed = await parser.parseURL(RSS_FEED_URL);
        const latestArticles = feed.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate
        }));
        res.json(latestArticles);
    } catch (error) {
        console.error('Error fetching Vatican News:', error);
        res.status(500).json({ message: 'Failed to fetch Vatican News', error: error.message });
    }
});

module.exports = router;
