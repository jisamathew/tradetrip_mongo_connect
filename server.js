const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const documentRoutes = require('./routes/documentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', documentRoutes);
app.use('/auth', authRoutes);
// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
