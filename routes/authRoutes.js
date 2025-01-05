const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const router = express.Router();
const JWT_SECRET = 'your_secret_key';
const {body,validationResult} = require('express-validator');
// Signup
router.post('/signup',[
    body('firstname').notEmpty().withMessage('Firstname is required'),
    body('lastname').notEmpty().withMessage('Lastname is required'),
    body('username').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min:6}).withMessage('Password must be atleast 6 characters')
    ], async (req, res) => {
      const { firstname,lastname,username,company,email,password,role } = req.body;
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstname,lastname,username,company,email,password: hashedPassword,role });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
      } catch (error) {
        res.status(400).json({ error: 'Error creating user' });
      }
    });
    
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
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
          const user = await User.findOne({ email });
          if (!user) return res.status(404).json({ error: 'User not found' });
      
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });
      
          const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
          console.log(token)
          res.json({ message: 'Login successful', token });
        } catch (error) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
    module.exports = router;