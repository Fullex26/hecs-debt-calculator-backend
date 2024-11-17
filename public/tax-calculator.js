document.addEventListener('DOMContentLoaded', function() {
  // Wait for the external widget to load
  window.addEventListener('message', function(event) {
    // Verify the origin for security
    if (event.origin !== 'https://calculatorsonline.com.au') return;

    // Check if the message is a tax calculation
    if (event.data && event.data.type === 'taxCalculation') {
      saveTaxCalculation(event.data);
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
}); 