const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const COO = require('../models/cooModel'); // Import COO schema
// const nodemailer = require('nodemailer');

const router = express.Router();

// File upload settings
const storage = multer.memoryStorage();
const upload = multer({ storage });

const { verifyRole } = require('../middleware/authMiddleware');

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
// Apply for COO
router.post('/coo/apply', async (req, res) => {
  try {
    const newCOO = new COO(req.body);
    await newCOO.save();
    res.status(201).json({ message: 'COO application submitted successfully', newCOO });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting application', error });
  }
});

// Get all pending COO applications
router.get('/coo/pending',verifyRole('certifier'), async (req, res) => {
  try {
    const pendingApplications = await COO.find({ status: 'Pending' });
    res.status(200).json(pendingApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching applications', error });
  }
});

// Approve a COO application
router.put('/coo/approve/:id', verifyRole('certifier'),async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCOO = await COO.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: 'COO approved successfully', updatedCOO });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error approving COO', error });
  }
});
// Approve COO Application and send notification to mail
// router.put('/coo/approve/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedCOO = await COO.findByIdAndUpdate(id, req.body, { new: true });

//     // Send notification
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'your-email@gmail.com',
//         pass: 'your-password',
//       },
//     });

//     const mailOptions = {
//       from: 'your-email@gmail.com',
//       to: updatedCOO.exporterContactEmail,
//       subject: 'COO Application Status Update',
//       text: `Your COO application with Certificate Number ${updatedCOO.certificateNumber} has been approved.`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: 'COO approved successfully and email sent!', updatedCOO });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error approving COO', error });
//   }
// });

// Get all approved COO applications
router.get('/coo/approved', verifyRole('certifier'), async (req, res) => {
  try {
    const approvedCOOs = await COO.find({ status: 'Approved' });
    res.status(200).json(approvedCOOs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching approved COOs', error });
  }
});
// Get COO application by ID
router.get('/coo/:id', verifyRole('certifier'),async (req, res) => {
  try {
    const { id } = req.params;
    const coo = await COO.findById(id);

    if (!coo) {
      return res.status(404).json({ message: 'COO application not found' });
    }

    res.status(200).json(coo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching COO application', error });
  }
});
router.get('/coo/status/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const coo = await COO.findOne({ orderNumber });

    if (coo) {
      return res.status(200).json({ found: true, status: coo.status, cooDetails: coo });
    } else {
      return res.status(200).json({ found: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
