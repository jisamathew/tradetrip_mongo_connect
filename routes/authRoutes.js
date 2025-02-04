const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const router = express.Router();
const JWT_SECRET = 'your_secret_key';
const {body,validationResult} = require('express-validator');
// Signup
router.post(
  '/signup',
  [
    body('firstname').notEmpty().withMessage('Firstname is required'),
    body('lastname').notEmpty().withMessage('Lastname is required'),
    body('username').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const { firstname, lastname, username, company, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        firstname,
        lastname,
        username,
        company,
        email,
        password: hashedPassword,
        role,
      });
      const result = await newUser.save();

      try {
        const pkiResponse = await fetch('https://tradetrip-pki-app.onrender.com/generate-certificate', {
          // const pkiResponse = await fetch('http://localhost:4000/generate-certificate', {
        // const pkiResponse = await fetch('https://mletr-tracker-pki.onrender.com/generate-certificate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: result._id.toString(),
            email: email,
          }),
        });

        if (!pkiResponse.ok) {
          throw new Error('Failed to generate certificate');
        }

        const pkiData = await pkiResponse.json();
        const token = jwt.sign({ id: result._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
          message: 'User registered successfully',
          token,
          certificate: pkiData.certificate,
          privateKey: pkiData.privateKey,
          user: {
            id: result._id,
            email: newUser.email,
            name: newUser.username,
          },
        });
      } catch (pkiError) {
        console.error('PKI Server error:', pkiError);
        const token = jwt.sign({ id: result._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
          message: 'User registered successfully (without certificate)',
          token,
          user: {
            id: result._id,
            email: newUser.email,
            name: newUser.username,
          },
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({ error: 'Error creating user' });
    }
  }
);

    // Login
    // router.post('/login', async (req, res) => {
    //   const { email, password } = req.body;
    //   try {
    //     const user = await User.findOne({ email });
    //     if (!user) return res.status(404).json({ error: 'User not found' });
    
    //     const isPasswordValid = await bcrypt.compare(password, user.password);
    //     if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });
    
    //     const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    //     res.json({ message: 'Login successful', token });
    //   } catch (error) {
    //     res.status(500).json({ error: 'Internal server error' });
    //   }
    // });
    async function verifyCertificate(userId, email) {
      try {
        const response = await fetch('https://tradetrip-pki-app.onrender.com/verify-certificate', {
          // const response = await fetch('http://localhost:4000/verify-certificate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, email }),
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Verification failed');
        }
    
        const result = await response.json();
        console.log('Certificate verification result:', result);
    
        // Handle successful verification
        return result;
      } catch (error) {
        console.error('Error during certificate verification:', error.message);
        // Handle errors (e.g., show an alert, log the error, etc.)
      }
    }
    
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
          const user = await User.findOne({ email });
          if (!user) return res.status(404).json({ error: 'User not found' });
      
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });
      
          const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
          console.log(token)
          // res.json({ message: 'Login successful', token });
   
          verifyCertificate(user._id, email).then((result) => {
            console.log('Verify Certificate result')
            console.log(result)
            if (!result) { 
              // Handle case where the API call itself failed (e.g., network error)
              console.error('Certificate verification API returned an empty response.'); 
              return res.status(500).json({ error: 'Certificate verification failed' }); 
            }
            if (!result.certificate) {
              return res.status(401).json({ error: 'Certificate not found. Please register again.' });
              }
            if (result && result.valid) {
              console.log('Certificate is valid:', result.certificate);
          // const certificate = await db.collection('pki_certificates').findOne({userId: user._id.toString(),
          //   email: email
          //   });
           
            if (new Date() > new Date(result.certificate.validTo)) {
            return res.status(401).json({ error: 'Certificate expired. Please request a new certificate.' });
            }
            res.json({
            message: 'Logged in successfully',
            token,
            user: {
            id: user._id,
            email: user.email,
            name: user.name
            },
            certificate: {
            serialNumber: result.certificate.serialNumber,
            signature:result.certificate.signature,
            validTo: result.certificate.validTo
            }
            });
          }
        })
           
        } catch (error) {
          console.error('Login error:', error);
          console.error('Error during certificate verification:', error);
  
          res.status(500).json({ error: 'LOGIN FAILED : Internal server error' });
        }
  });
      
    module.exports = router;