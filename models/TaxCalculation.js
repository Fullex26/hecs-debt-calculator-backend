const mongoose = require('mongoose');

const taxCalculationSchema = new mongoose.Schema({
  income: {
    type: Number,
    required: true,
    min: [0, 'Income cannot be negative']
  },
  taxYear: {
    type: String,
    required: true
  },
  residencyStatus: {
    type: String,
    enum: ['resident', 'foreign-resident', 'working-holiday'],
    required: true
  },
  medicareLevyExemption: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const TaxCalculation = mongoose.model('TaxCalculation', taxCalculationSchema);

module.exports = TaxCalculation; 