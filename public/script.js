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
    
    clearError();
    clearAnalysis();

    const formData = {
      debt: parseFloat(document.getElementById('debt').value),
      income: parseFloat(document.getElementById('income').value),
      growth: parseFloat(document.getElementById('growth').value)
    };

    // Validate inputs
    if (!isValidInput(formData.debt) || !isValidInput(formData.income) || !isValidGrowthRate(formData.growth)) {
      displayError('Please enter valid numbers. Debt and income must be positive, and growth rate must be between 0 and 100.');
      return;
    }

    showSpinner();
    disableSubmitButton(true);

    try {
      const data = await fetchData('/api/hecs/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (data.yearsToRepay && data.repaymentSchedule) {
        displayResults(data.yearsToRepay, data.repaymentSchedule);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      displayError('Failed to calculate. Please check your inputs and try again.');
    } finally {
      hideSpinner();
      disableSubmitButton(false);
    }
  });

  // Helper functions for validation
  function isValidInput(value) {
    return !isNaN(value) && isFinite(value) && value > 0;
  }

  function isValidGrowthRate(value) {
    return !isNaN(value) && isFinite(value) && value >= 0 && value <= 100;
  }

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

  function displayResults(yearsToRepay, repaymentSchedule) {
    try {
      if (!Array.isArray(repaymentSchedule) || repaymentSchedule.length === 0) {
        throw new Error('Invalid repayment schedule data');
      }

      console.log('Displaying results:', { yearsToRepay, repaymentSchedule });
      
      // Show the container before adding content
      analysisDiv.style.display = 'block';
      
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
      
      analysisDiv.innerHTML = resultsHTML;
      createChart(repaymentSchedule);
      
    } catch (error) {
      console.error('Error displaying results:', error);
      displayError('Unable to display results. Please try again.');
    }
  }

  function generateRepaymentTable(schedule) {
    return `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Income</th>
              <th>Repayment</th>
              <th>Total Repaid</th>
              <th>Remaining Debt</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.map(row => `
              <tr>
                <td>${row.year}</td>
                <td>${formatCurrency(row.income)}</td>
                <td>${formatCurrency(row.repayment)}</td>
                <td>${formatCurrency(row.totalRepayment)}</td>
                <td>${formatCurrency(row.remainingDebt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function createChart(schedule) {
    try {
      console.log('Creating chart with schedule:', schedule);
      const canvas = document.getElementById('repaymentChart');
      
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context');
        return;
      }
      
      // Prepare the data
      const labels = schedule.map(entry => `Year ${entry.year}`);
      const debtData = schedule.map(entry => entry.remainingDebt);
      const incomeData = schedule.map(entry => entry.income);
      
      // Destroy existing chart if it exists
      if (window.myChart instanceof Chart) {
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
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Annual Income',
              data: incomeData,
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
                  return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                }
              }
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
    } catch (error) {
      console.error('Error creating chart:', error);
      const chartWrapper = document.querySelector('.chart-wrapper');
      if (chartWrapper) {
        chartWrapper.innerHTML = '<p class="error-message">Unable to display the chart. Please try again.</p>';
      }
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
    throw new Error('Failed to process your request. Please try again.');
  }
}
