const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const pythonService = require('../services/pythonService');

// Get token endpoint
router.post('/token', async (req, res) => {
  try {
    if (!req.body.api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }
    const token = await pythonService.getToken(req.body.api_key);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process file endpoint
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await pythonService.processFile(req.file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;