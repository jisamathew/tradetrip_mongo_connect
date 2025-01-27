const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const connectDB = require('./config/db');
const { connectDB ,getDB} = require('./config/db');
const documentRoutes = require('./routes/documentRoutes');
const authRoutes = require('./routes/authRoutes');
const fileUploadRoutes = require('./routes/fileUpload');

const app = express();
const PORT = 5000;
// const uri = 'mongodb+srv://tradetrip_2024:tradetrip_2024@cluster0.jfbx4.mongodb.net/tradetrip?retryWrites=true&w=majority';
// const client = new MongoClient(uri);
// let db;

// Connect to MongoDB
connectDB();

// Middleware
// app.use(cors());
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-firebase-app.web.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', documentRoutes);
app.use('/auth', authRoutes);

// Start server
// Connect to MongoDB
connectDB().then(async() => {
  // await client.connect();
  // db = client.db('MAP_APP');
  const db = getDB();
  app.use('/api', fileUploadRoutes(db));
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    
  }).catch((error) => {
    console.error('Failed to start server:', error);
  });
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
