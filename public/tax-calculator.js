let messageHandler;

document.addEventListener('DOMContentLoaded', function() {
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