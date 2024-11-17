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
    console.log('Starting displayResults with:', { yearsToRepay, repaymentSchedule });
    const analysisDiv = document.getElementById('analysis');
    
    // Create the results HTML
    const resultsHTML = `
      <div class="results-container">
        <div class="results-summary">
          <h2>Repayment Analysis</h2>
          <p class="results-message">
            Based on your inputs, it will take approximately 
            <strong>${yearsToRepay} years</strong> to repay your HECS debt.
          </p>
        </div>
        
        ${generateRepaymentTable(repaymentSchedule)}
        
        <div class="chart-wrapper">
          <canvas id="repaymentChart" width="400" height="200"></canvas>
        </div>
      </div>
    `;
    
    // Update the DOM
    analysisDiv.innerHTML = resultsHTML;
    
    // Create the chart
    createChart(repaymentSchedule);
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
  function createChart(schedule) {
    console.log('Creating chart with schedule:', schedule);
    const canvas = document.getElementById('repaymentChart');
    
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Prepare the data
    const labels = schedule.map(entry => `Year ${entry.year}`);
    const debtData = schedule.map(entry => entry.remainingDebt);
    const incomeData = schedule.map(entry => entry.income);
    
    // Destroy existing chart if it exists
    if (window.myChart) {
      window.myChart.destroy();
    }
    
    // Create new chart
    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Remaining Debt',
            data: debtData,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Annual Income',
            data: incomeData,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'HECS Debt Repayment Progress'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: 'AUD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
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
