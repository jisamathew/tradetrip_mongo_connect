const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true},
  lastname: { type: String, required: true},
  username: { type: String, required: true, unique: true },
  company: { type: String, required: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String,enum:["certifier","exporter"], required: true },
});

module.exports = mongoose.model('User', userSchema);