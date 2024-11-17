// index.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const { body, validationResult } = require('express-validator'); // For input validation
const rateLimit = require('express-rate-limit'); // For rate limiting
const helmet = require('helmet'); // For setting secure HTTP headers
const xss = require('xss-clean'); // For sanitizing user input
const TaxCalculation = require('./models/TaxCalculation');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// Constants
// -----------------------------

// Define repayment bands as a constant to avoid redefining on each request
const REPAYMENT_BANDS = [
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
  { min: 159664, max: Infinity, rate: 0.10 },
];

// -----------------------------
// Middleware Configuration
// -----------------------------

// Define allowed script sources
const scriptSrcUrls = [
  "'self'",
  "'unsafe-inline'",
  "https://cdn.jsdelivr.net/",
  "https://paycalculator.com.au"
];

// Define allowed style sources
const styleSrcUrls = [
  "'self'",
  "'unsafe-inline'",
  "https://fonts.googleapis.com",
];

// Define allowed font sources
const fontSrcUrls = [
  "'self'",
  "https://fonts.gstatic.com",
];

// Define allowed connect sources
const connectSrcUrls = [
  "'self'",
  "https://calculatorsonline.com.au",
];

// Define allowed frame sources
const frameSrcUrls = [
  "'self'",
  "https://paycalculator.com.au"
];

// Configure Helmet's CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: scriptSrcUrls,
      styleSrc: styleSrcUrls,
      connectSrc: connectSrcUrls,
      fontSrc: fontSrcUrls,
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: frameSrcUrls
    },
  })
);

// Parse incoming JSON requests and sanitize user input
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(xss());

// Rate limiting to prevent abuse (e.g., DoS attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum of 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api', limiter); // Apply rate limiting to API routes

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure all routes return the appropriate HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tax', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tax.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Handle 404s
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// -----------------------------
// MongoDB Connection
// -----------------------------

// Suppress strictQuery deprecation warning
mongoose.set('strictQuery', false);

// Connect to MongoDB using the URI from environment variables
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Force IPv4
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// -----------------------------
// API Endpoints
// -----------------------------

/**
 * @route   POST /api/calculate
 * @desc    Calculate debt repayment schedule and save user data
 * @access  Public
 */
app.post(
  '/api/calculate',
  // Input validation and sanitization
  [
    body('debt').isFloat({ min: 0 }).withMessage('Debt must be a positive number'),
    body('income').isFloat({ min: 0 }).withMessage('Income must be a positive number'),
    body('growth').isFloat({ min: 0, max: 100 }).withMessage('Growth rate must be between 0 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { debt, income, growth } = req.body;
      
      // Calculate repayment schedule
      const repaymentSchedule = calculateRepaymentSchedule(debt, income, growth);
      const yearsToRepay = repaymentSchedule.length;

      res.json({
        yearsToRepay,
        repaymentSchedule
      });
    } catch (error) {
      console.error('Calculation error:', error);
      res.status(500).json({ error: 'Failed to process calculation' });
    }
  }
);

function calculateRepaymentSchedule(debt, income, growth) {
  const schedule = [];
  let remainingDebt = debt;
  let currentIncome = income;
  let year = 1;

  while (remainingDebt > 0 && year <= 30) { // Cap at 30 years
    const repaymentRate = getRepaymentRate(currentIncome);
    const yearlyRepayment = currentIncome * repaymentRate;
    
    schedule.push({
      year,
      startingDebt: remainingDebt,
      income: currentIncome,
      repayment: yearlyRepayment,
      remainingDebt: Math.max(0, remainingDebt - yearlyRepayment)
    });

    remainingDebt = Math.max(0, remainingDebt - yearlyRepayment);
    currentIncome *= (1 + growth / 100);
    year++;
  }

  return schedule;
}

/**
 * @route   POST /api/tax-calculation
 * @desc    Save tax calculation data
 * @access  Public
 */
app.post('/api/tax-calculation', [
  body('income').isFloat({ gt: 0 }).withMessage('Income must be a positive number'),
  body('taxYear').notEmpty().withMessage('Tax year is required'),
  body('residencyStatus').isIn(['resident', 'foreign-resident', 'working-holiday'])
    .withMessage('Invalid residency status'),
  body('medicareLevyExemption').isBoolean().withMessage('Medicare levy exemption must be boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taxCalculation = new TaxCalculation({
      income: req.body.income,
      taxYear: req.body.taxYear,
      residencyStatus: req.body.residencyStatus,
      medicareLevyExemption: req.body.medicareLevyExemption
    });

    await taxCalculation.save();
    res.status(201).json({ message: 'Tax calculation saved successfully' });
  } catch (error) {
    console.error('Error saving tax calculation:', error);
    res.status(500).json({ error: 'Failed to save tax calculation' });
  }
});

// -----------------------------
// Global Error Handling Middleware
// -----------------------------

// Catch-all error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// -----------------------------
// Start the Server
// -----------------------------

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
