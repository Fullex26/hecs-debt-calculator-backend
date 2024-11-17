const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  debt: { 
    type: Number, 
    required: true,
    min: [0, 'Debt cannot be negative']
  },
  income: { 
    type: Number, 
    required: true,
    min: [0, 'Income cannot be negative']
  },
  growth: { 
    type: Number, 
    required: true,
    min: [0, 'Growth rate cannot be negative'],
    max: [100, 'Growth rate cannot exceed 100%']
  },
  yearsToRepay: { 
    type: Number, 
    required: true,
    min: [0, 'Years to repay cannot be negative'],
    max: [30, 'Years to repay cannot exceed 30']
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // Add index for better query performance
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
