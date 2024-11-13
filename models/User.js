const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  debt: { type: Number, required: true },
  income: { type: Number, required: true },
  growth: { type: Number, required: true },
  yearsToRepay: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
