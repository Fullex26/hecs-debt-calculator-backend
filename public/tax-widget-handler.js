// tax-widget-handler.js

window.addEventListener('DOMContentLoaded', function() {
  const calculator = document.getElementById('atataxcalculator');
  
  // Listen for calculator events
  calculator.addEventListener('calculate', function(event) {
    const calculationData = {
      type: 'taxCalculation',
      income: event.detail.income,
      taxYear: event.detail.taxYear || '2023-2024',
      residencyStatus: event.detail.residencyStatus || 'resident',
      medicareLevyExemption: event.detail.medicareLevyExemption || false
    };

    // Send data to parent window
    window.postMessage(calculationData, '*');
  });

  // Handle loading states
  const spinner = document.getElementById('tax-spinner');
  const fallback = document.getElementById('tax-fallback');

  calculator.addEventListener('loading', function() {
    spinner.hidden = false;
  });

  calculator.addEventListener('loaded', function() {
    spinner.hidden = true;
  });

  calculator.addEventListener('error', function() {
    spinner.hidden = true;
    fallback.hidden = false;
  });
});
  