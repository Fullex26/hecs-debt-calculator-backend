// script.js

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('hecs-form');
  const analysisDiv = document.getElementById('analysis');
  const spinner = document.getElementById('spinner');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Retrieve and parse input values
    const debt = parseFloat(document.getElementById('debt').value);
    const income = parseFloat(document.getElementById('income').value);
    const growth = parseFloat(document.getElementById('growth').value);

    // Validate inputs
    if (isNaN(debt) || debt <= 0) {
      displayError('Please enter a valid HECS debt amount.');
      return;
    }

    if (isNaN(income) || income <= 0) {
      displayError('Please enter a valid annual income.');
      return;
    }

    if (isNaN(growth) || growth < 0) {
      displayError('Please enter a valid expected income growth rate.');
      return;
    }

    // Show the spinner
    showSpinner();

    try {
      // Send data to the backend API
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ debt, income, growth })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred.');
      }

      const data = await response.json();
      const { yearsToRepay, repaymentSchedule } = data;

      let message;

      if (yearsToRepay <= 30) {
        message = `Based on your inputs, it will take approximately <strong>${yearsToRepay}</strong> year(s) to repay your HECS debt.`;
      } else {
        message = `Based on your inputs, it will take more than 30 years to repay your HECS debt. Please review your inputs or consider seeking financial advice.`;
      }

      // Generate the repayment table
      const tableHTML = generateRepaymentTable(repaymentSchedule);

      // Generate the repayment chart
      const chartHTML = `<canvas id="repaymentChart" aria-label="Repayment Progress Chart" role="img"></canvas>`;

      // Display the analysis with a fade-in effect
      analysisDiv.innerHTML = `<p>${message}</p>${tableHTML}${chartHTML}`;
      analysisDiv.classList.add('show');

      // Render the chart
      renderChart(repaymentSchedule);

    } catch (error) {
      displayError(error.message);
    } finally {
      // Hide the spinner
      hideSpinner();
    }
  });

  function displayError(message) {
    const existingError = document.getElementById('form-error');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = 'form-error';
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    form.prepend(errorDiv);
  }

  function showSpinner() {
    spinner.hidden = false;
  }

  function hideSpinner() {
    spinner.hidden = true;
  }

  function generateRepaymentTable(schedule) {
    let tableHTML = `
      <h2>Year-by-Year Repayment Schedule</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Income (AUD)</th>
              <th>Annual Repayment (AUD)</th>
              <th>Total Repayment (AUD)</th>
              <th>Remaining Debt (AUD)</th>
            </tr>
          </thead>
          <tbody>
    `;

    schedule.forEach(entry => {
      tableHTML += `
        <tr>
          <td>${entry.year}</td>
          <td>${formatCurrency(entry.income)}</td>
          <td>${formatCurrency(entry.repayment)}</td>
          <td>${formatCurrency(entry.totalRepayment)}</td>
          <td>${formatCurrency(entry.remainingDebt)}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    return tableHTML;
  }

  function formatCurrency(amount) {
    return `$${parseFloat(amount).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function renderChart(schedule) {
    // Extract data for the chart
    const labels = schedule.map(entry => `Year ${entry.year}`);
    const repaymentData = schedule.map(entry => parseFloat(entry.totalRepayment));
    const incomeData = schedule.map(entry => parseFloat(entry.income));

    // Get the canvas element
    const ctx = document.getElementById('repaymentChart').getContext('2d');

    // Destroy existing chart instance if it exists to prevent duplication
    if (window.repaymentChartInstance) {
      window.repaymentChartInstance.destroy();
    }

    // Create the chart
    window.repaymentChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Repayment (AUD)',
            data: repaymentData,
            borderColor: '#2980b9',
            backgroundColor: 'rgba(41, 128, 185, 0.2)',
            fill: true,
            tension: 0.1
          },
          {
            label: 'Income (AUD)',
            data: incomeData,
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Repayment Progress and Income Growth'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (AUD)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Year'
            }
          }
        }
      }
    });
  }
});
