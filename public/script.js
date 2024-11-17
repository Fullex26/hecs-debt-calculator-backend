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

    // Get and validate input values
    const debt = parseFloat(document.getElementById('debt').value);
    const income = parseFloat(document.getElementById('income').value);
    const growth = parseFloat(document.getElementById('growth').value);

    console.log('Input values:', { debt, income, growth });

    if (isNaN(debt) || debt <= 0) {
      displayError('Please enter a valid HECS debt amount');
      return;
    }

    if (isNaN(income) || income <= 0) {
      displayError('Please enter a valid income amount');
      return;
    }

    if (isNaN(growth) || growth < 0 || growth > 100) {
      displayError('Please enter a valid growth rate between 0 and 100');
      return;
    }

    showSpinner();
    disableSubmitButton(true);

    try {
      const response = await fetch('/api/hecs/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ debt, income, growth })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate');
      }

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
    spinner.hidden = false;
  }

  function hideSpinner() {
    spinner.hidden = true;
  }

  function disableSubmitButton(disable) {
    submitButton.disabled = disable;
    submitButton.textContent = disable ? 'Calculating...' : 'Calculate';
  }

  function clearAnalysis() {
    analysisDiv.innerHTML = '';
    analysisDiv.style.display = 'none';
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
