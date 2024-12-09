const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');

const router = express.Router();

// File upload settings
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const newDoc = new Document({
      name: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });
    await newDoc.save();
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload file', error: err });
  }
});

// Get all documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find();
    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch documents', error: err });
  }
});

// Serve document by ID
router.get('/document/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.contentType(document.contentType).send(document.data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch document', error: err });
  }
});

module.exports = router;
