// index.js
require('dotenv').config(); // To use environment variables

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Suppress strictQuery deprecation warning
mongoose.set('strictQuery', false);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// Serve static files from the front-end directory
// Assuming your front-end files are in a folder named 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint

app.post('/api/calculate', async (req, res) => {
  const { debt, income, growth } = req.body;

  // Simple validation
  if (debt <= 0 || income <= 0 || growth < 0) {
    return res.status(400).json({ error: 'Invalid input values.' });
  }

  // Perform detailed calculation (similar to front-end logic)
  const repaymentBands = [
    { min: 0, max: 54434, rate: 0.0 },
    { min: 54435, max: 62850, rate: 0.01 },
    { min: 62851, max: 66620, rate: 0.02 },
    { min: 66621, max: 70618, rate: 0.025 },
    { min: 70619, max: 74855, rate: 0.03 },
    { min: 74856, max: 79346, rate: 0.035 },
    { min: 79347, max: 84107, rate: 0.04 },
    { min: 84108, max: 89154, rate: 0.045 },
    { min: 89155, max: 94503, rate: 0.05 },
    { min: 94504, max: 100174, rate: 0.055 },
    { min: 100175, max: 106185, rate: 0.06 },
    { min: 106186, max: 112556, rate: 0.065 },
    { min: 112557, max: 119309, rate: 0.07 },
    { min: 119310, max: 126467, rate: 0.075 },
    { min: 126468, max: 134056, rate: 0.08 },
    { min: 134057, max: 142100, rate: 0.085 },
    { min: 142101, max: 150626, rate: 0.09 },
    { min: 150627, max: 159663, rate: 0.095 },
    { min: 159664, max: Infinity, rate: 0.10 }
  ];

  let totalRepayment = 0;
  let years = 0;
  let currentIncome = income;
  const repaymentSchedule = [];

  while (totalRepayment < debt && years < 30) {
    const repaymentRate = repaymentBands.find(band => currentIncome >= band.min && currentIncome <= band.max)?.rate || 0.0;
    const annualRepayment = currentIncome * repaymentRate;

    const repaymentThisYear = annualRepayment > (debt - totalRepayment) ? (debt - totalRepayment) : annualRepayment;
    totalRepayment += repaymentThisYear;

    repaymentSchedule.push({
      year: years + 1,
      income: parseFloat(currentIncome.toFixed(2)),
      repayment: parseFloat(repaymentThisYear.toFixed(2)),
      totalRepayment: parseFloat(totalRepayment.toFixed(2)),
      remainingDebt: parseFloat((debt - totalRepayment).toFixed(2))
    });

    currentIncome += currentIncome * (growth / 100);
    years++;
  }

  // Create a new user record
  const user = new User({
    debt,
    income,
    growth,
    yearsToRepay
  });

  try {
    await user.save();
    res.json({ yearsToRepay: years, repaymentSchedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save data.' });
  }

});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
