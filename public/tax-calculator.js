let messageHandler;

document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('tax-spinner');
  const fallback = document.getElementById('tax-fallback');
  const container = document.getElementById('atataxcalculator');

  if (spinner) spinner.hidden = false;

  // Create iframe for ATO calculator
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.ato.gov.au/Calculators-and-tools/Host/?calc=TaxCalculator';
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.onload = function() {
    if (spinner) spinner.hidden = true;
  };
  iframe.onerror = function() {
    if (spinner) spinner.hidden = true;
    if (fallback) fallback.hidden = false;
  };

  // Add iframe to container
  if (container) {
    container.appendChild(iframe);
  } else {
    console.error('Calculator container not found');
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