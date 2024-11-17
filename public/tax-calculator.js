let messageHandler;

document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('tax-spinner');
  const fallback = document.getElementById('tax-fallback');
  const calculator = document.getElementById('atataxcalculator');

  // Show loading spinner
  if (spinner) spinner.hidden = false;

  // Initialize tax calculator
  if (window.ATATaxCalculator) {
    try {
      window.ATATaxCalculator.init({
        container: 'atataxcalculator',
        theme: 'light',
        onLoad: function() {
          if (spinner) spinner.hidden = true;
        },
        onError: function() {
          if (spinner) spinner.hidden = true;
          if (fallback) fallback.hidden = false;
        }
      });
    } catch (error) {
      console.error('Error initializing tax calculator:', error);
      if (spinner) spinner.hidden = true;
      if (fallback) fallback.hidden = false;
    }
  } else {
    console.error('Tax calculator script not loaded');
    if (spinner) spinner.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  // Create message handler
  messageHandler = function(event) {
    if (event.origin !== 'https://calculatorsonline.com.au') return;
    if (event.data && event.data.type === 'taxCalculation') {
      saveTaxCalculation(event.data);
    }
  };

  // Add event listener
  window.addEventListener('message', messageHandler);
});

// Clean up when page is unloaded
window.addEventListener('unload', function() {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler);
  }
});

async function saveTaxCalculation(data) {
  try {
    const response = await fetch('/api/tax-calculation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        income: parseFloat(data.income),
        taxYear: data.taxYear,
        residencyStatus: data.residencyStatus,
        medicareLevyExemption: data.medicareLevyExemption
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save tax calculation');
    }

    console.log('Tax calculation saved successfully');
  } catch (error) {
    console.error('Error saving tax calculation:', error);
  }
} 