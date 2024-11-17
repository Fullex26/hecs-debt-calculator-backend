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
  "'unsafe-eval'",
  'https://calculatorsonline.com.au',
  'https://cdn.jsdelivr.net',
  'https://ajax.googleapis.com',
];

// Define allowed style sources
const styleSrcUrls = [
  "'self'",
  'https://cdnjs.cloudflare.com',
  'https://calculatorsonline.com.au',
];

// Define allowed font sources
const fontSrcUrls = [
  "'self'",
  'https://cdnjs.cloudflare.com', // For Font Awesome fonts
];

// Configure Helmet's CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: scriptSrcUrls,
      styleSrc: [...styleSrcUrls, "'unsafe-inline'"],
      fontSrc: fontSrcUrls,
      imgSrc: ["'self'", 'data:', 'https://calculatorsonline.com.au'],
      connectSrc: ["'self'", 'https://calculatorsonline.com.au'],
      objectSrc: ["'none'"],
      styleSrc: [
        ...styleSrcUrls,
        "'unsafe-inline'",
        'https://calculatorsonline.com.au'
      ],
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
    body('debt')
      .isFloat({ gt: 0 })
      .withMessage('Debt must be a number greater than 0.')
      .toFloat(),
    body('income')
      .isFloat({ gt: 0 })
      .withMessage('Income must be a number greater than 0.')
      .toFloat(),
    body('growth')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Growth must be a number between 0 and 100.')
      .toFloat(),
  ],
  async (req, res) => {
    console.log('Received calculation request:', req.body); // Add this for debugging
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array()); // Add this for debugging
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { debt, income, growth } = req.body;

    try {
      // Initialize variables for calculation
      let totalRepayment = 0;
      let years = 0;
      let currentIncome = income;
      const repaymentSchedule = [];

      // Calculate repayment schedule
      while (totalRepayment < debt && years < 30) {
        // Limit to 30 years to prevent infinite loops
        // Find the appropriate repayment rate based on current income
        const repaymentBand = REPAYMENT_BANDS.find(
          (band) => currentIncome >= band.min && currentIncome <= band.max
        );
        const repaymentRate = repaymentBand ? repaymentBand.rate : 0.0;
        const annualRepayment = currentIncome * repaymentRate;

        // Determine repayment for the current year without exceeding the remaining debt
        const repaymentThisYear = Math.min(
          annualRepayment,
          debt - totalRepayment
        );
        totalRepayment += repaymentThisYear;

        // Add the current year's data to the repayment schedule
        repaymentSchedule.push({
          year: years + 1,
          income: parseFloat(currentIncome.toFixed(2)),
          repayment: parseFloat(repaymentThisYear.toFixed(2)),
          totalRepayment: parseFloat(totalRepayment.toFixed(2)),
          remainingDebt: parseFloat((debt - totalRepayment).toFixed(2)),
        });

        // Update income for the next year based on growth rate
        currentIncome += currentIncome * (growth / 100);
        years++;
      }

      // Create a new user record with the calculated data
      const user = new User({
        debt,
        income,
        growth,
        yearsToRepay: years, // Correctly define the field
      });

      // Save the user record to the database
      await user.save();

      console.log('Sending response:', { yearsToRepay: years, repaymentSchedule }); // Add this for debugging
      res.json({ yearsToRepay: years, repaymentSchedule });
    } catch (err) {
      console.error('Calculation error:', err);
      res.status(500).json({ error: 'Internal Server Error.' });
    }
  }
);

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
