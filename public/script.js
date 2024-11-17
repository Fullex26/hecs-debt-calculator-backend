document.addEventListener('DOMContentLoaded', function() {
  const currentPage = document.body.getAttribute('data-page');
  console.log('Current page:', currentPage);

  if (currentPage === 'hecs-calculator') {
    initializeHecsDebtCalculator();
  } else if (currentPage === 'tax-calculator') {
    initializeTaxCalculator();
  }
});

function initializeHecsDebtCalculator() {
  const form = document.getElementById('hecs-form');
  const analysisDiv = document.getElementById('analysis');
  const spinner = document.getElementById('spinner');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');

    clearError();
    clearAnalysis();

    const formData = {
      debt: parseFloat(document.getElementById('debt').value),
      income: parseFloat(document.getElementById('income').value),
      growth: parseFloat(document.getElementById('growth').value)
    };

    console.log('Form data:', formData);

    // Validate inputs
    if (isNaN(formData.debt) || formData.debt <= 0) {
      displayError('Please enter a valid HECS debt amount');
      return;
    }

    if (isNaN(formData.income) || formData.income <= 0) {
      displayError('Please enter a valid income amount');
      return;
    }

    if (isNaN(formData.growth) || formData.growth < 0 || formData.growth > 100) {
      displayError('Please enter a valid growth rate between 0 and 100');
      return;
    }

    showSpinner();
    disableSubmitButton(true);

    try {
      const response = await fetch('/api/hecs/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.yearsToRepay && data.repaymentSchedule) {
        displayResults(data.yearsToRepay, data.repaymentSchedule);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      displayError(error.message || 'Failed to calculate. Please try again.');
    } finally {
      hideSpinner();
      disableSubmitButton(false);
    }
  });

  function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
  }

  function clearError() {
    const errorMessage = form.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  function showSpinner() {
    if (spinner) spinner.hidden = false;
  }

  function hideSpinner() {
    if (spinner) spinner.hidden = true;
  }

  function disableSubmitButton(disable) {
    if (submitButton) {
      submitButton.disabled = disable;
      submitButton.textContent = disable ? 'Calculating...' : 'Calculate';
    }
  }

  function clearAnalysis() {
    if (analysisDiv) {
      analysisDiv.innerHTML = '';
      analysisDiv.style.display = 'none';
    }
  }
}

function initializeTaxCalculator() {
  // Tax calculator initialization code
}

async function fetchData(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'An unexpected error occurred');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
