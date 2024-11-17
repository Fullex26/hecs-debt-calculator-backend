// script.js

document.addEventListener('DOMContentLoaded', function() {
  const currentPage = document.body.getAttribute('data-page');
  console.log('Current page:', currentPage);

  if (currentPage === 'hecs-calculator') {
    initializeHecsDebtCalculator();
  } else if (currentPage === 'tax-calculator') {
    initializeTaxCalculator();
  }
});

/**
 * Initializes the HECS Debt Calculator functionalities.
 */
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

    const debt = parseFloat(document.getElementById('debt').value);
    const income = parseFloat(document.getElementById('income').value);
    const growth = parseFloat(document.getElementById('growth').value);

    const validationErrors = validateInputs(debt, income, growth);
    if (validationErrors.length > 0) {
      displayError(validationErrors.join(' '));
      return;
    }

    showSpinner();
    disableSubmitButton(true);

    try {
      const data = await fetchData('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ debt, income, growth })
      });
      
      console.log('Response data:', data);
      
      if (data.yearsToRepay && data.repaymentSchedule) {
        displayResults(data.yearsToRepay, data.repaymentSchedule);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      displayError(error.message);
    } finally {
      hideSpinner();
      disableSubmitButton(false);
    }
  });

  /**
   * Validates the input values.
   * @param {number} debt - The HECS debt amount.
   * @param {number} income - The annual income.
   * @param {number} growth - The expected income growth rate.
   * @returns {Array} - An array of error messages.
   */
  function validateInputs(debt, income, growth) {
    const errors = [];

    if (isNaN(debt) || debt <= 0) {
      errors.push('Please enter a valid HECS debt amount.');
    }

    if (isNaN(income) || income <= 0) {
      errors.push('Please enter a valid annual income.');
    }

    if (isNaN(growth) || growth < 0 || growth > 100) {
      errors.push('Please enter a valid expected income growth rate (0-100%).');
    }

    return errors;
  }

  /**
   * Displays an error message above the form.
   * @param {string} message - The error message to display.
   */
  function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'form-error';
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('role', 'alert'); // For ARIA live regions
    errorDiv.textContent = message;

    form.prepend(errorDiv);

    // Shift focus to the error message for accessibility
    errorDiv.focus();
  }

  /**
   * Clears any existing error messages.
   */
  function clearError() {
    const existingError = document.getElementById('form-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Displays the repayment results, including the message, table, and chart.
   * @param {number} yearsToRepay - The number of years to repay the debt.
   * @param {Array} repaymentSchedule - The repayment schedule data.
   */
  function displayResults(yearsToRepay, repaymentSchedule) {
    console.log('Displaying results:', { yearsToRepay, repaymentSchedule }); // Debug log
    
    const analysisDiv = document.getElementById('analysis');
    
    // Clear previous results
    analysisDiv.innerHTML = '';
    
    // Calculate initial debt from first repayment entry
    const initialDebt = repaymentSchedule[0].remainingDebt + repaymentSchedule[0].repayment;
    const totalRepaid = repaymentSchedule[repaymentSchedule.length - 1].totalRepayment;
    const initialIncome = repaymentSchedule[0].income;
    const finalIncome = repaymentSchedule[repaymentSchedule.length - 1].income;
    
    // Create results HTML
    const resultsHTML = `
      <div class="results-container">
        <div class="results-summary">
          <h2>Repayment Analysis</h2>
          <p class="results-message">
            Based on your inputs, it will take approximately 
            <strong>${yearsToRepay} years</strong> to repay your HECS debt of 
            <strong>${formatCurrency(initialDebt)}</strong>.
          </p>
        </div>
        
        ${generateRepaymentTable(repaymentSchedule)}
        
        <div class="chart-container">
          <canvas id="repaymentChart"></canvas>
        </div>
      </div>
    `;
    
    // Update the analysis div
    analysisDiv.innerHTML = resultsHTML;
    analysisDiv.classList.add('show');
    
    // Render the chart after a short delay to ensure canvas is ready
    setTimeout(() => {
      const ctx = document.getElementById('repaymentChart').getContext('2d');
      renderChart(ctx, repaymentSchedule);
    }, 100);
  }

  /**
   * Generates a message based on the years to repay.
   * @param {number} years - The number of years to repay.
   * @returns {string} - The generated message.
   */
  function generateMessage(years) {
    if (years <= 30) {
      return `Based on your inputs, it will take approximately <strong>${years}</strong> year(s) to repay your HECS debt.`;
    } else {
      return `Based on your inputs, it will take more than 30 years to repay your HECS debt. Please review your inputs or consider seeking financial advice.`;
    }
  }

  /**
   * Generates the HTML for the repayment schedule table.
   * @param {Array} schedule - The repayment schedule data.
   * @returns {string} - The HTML string for the table.
   */
  function generateRepaymentTable(schedule) {
    return `
      <div class="table-container">
        <h3>Repayment Schedule</h3>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Income</th>
              <th>Annual Payment</th>
              <th>Total Paid</th>
              <th>Remaining Debt</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.map(entry => `
              <tr>
                <td>${entry.year}</td>
                <td>${formatCurrency(entry.income)}</td>
                <td>${formatCurrency(entry.repayment)}</td>
                <td>${formatCurrency(entry.totalRepayment)}</td>
                <td>${formatCurrency(entry.remainingDebt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Formats a number as Australian currency.
   * @param {number} amount - The amount to format.
   * @returns {string} - The formatted currency string.
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Renders the repayment chart using Chart.js.
   * @param {Array} schedule - The repayment schedule data.
   */
  function renderChart(ctx, schedule) {
    console.log('Rendering chart with data:', schedule); // Debug log
    
    // Destroy existing chart if it exists
    if (window.repaymentChart) {
      window.repaymentChart.destroy();
    }
    
    const labels = schedule.map(entry => `Year ${entry.year}`);
    const repaymentData = schedule.map(entry => entry.totalRepayment);
    const incomeData = schedule.map(entry => entry.income);
    
    window.repaymentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Repayment',
            data: repaymentData,
            borderColor: '#2980b9',
            backgroundColor: 'rgba(41, 128, 185, 0.2)',
            fill: true
          },
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Repayment Progress and Income Growth'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Displays a loading spinner.
   */
  function showSpinner() {
    spinner.hidden = false;
  }

  /**
   * Hides the loading spinner.
   */
  function hideSpinner() {
    spinner.hidden = true;
  }

  /**
   * Disables or enables the submit button.
   * @param {boolean} disable - Whether to disable the button.
   */
  function disableSubmitButton(disable) {
    submitButton.disabled = disable;
    submitButton.textContent = disable ? 'Calculating...' : 'Calculate';
  }

  /**
   * Clears the analysis results.
   */
  function clearAnalysis() {
    analysisDiv.innerHTML = '';
    analysisDiv.classList.remove('show');
  }
}

/**
 * Initializes the Tax Calculator functionalities.
 * Currently, since the Tax Calculator is an embedded third-party widget,
 * there may not be any additional scripts required unless you plan to interact with the widget.
 */
function initializeTaxCalculator() {
  // Example: If you need to interact with the widget via JavaScript,
  // you can add event listeners or additional functionalities here.
  // For now, no additional scripts are required.
}

// Add better error handling for fetch requests
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
    throw new Error('Failed to process your request. Please try again.');
  }
}
