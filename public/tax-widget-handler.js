// tax-widget-handler.js

document.addEventListener('DOMContentLoaded', function () {
    const spinner = document.getElementById('tax-spinner');
    const fallback = document.getElementById('tax-fallback');
    const taxCalculatorContainer = document.getElementById('atataxcalculator');
  
    // Show spinner while loading
    spinner.hidden = false;
  
    // Create a MutationObserver to watch for changes in the tax calculator container
    const observer = new MutationObserver(function (mutationsList, observer) {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Assume widget has loaded
          spinner.hidden = true;
          observer.disconnect(); // Stop observing
          break;
        }
      }
    });
  
    // Start observing the tax calculator container for child node additions
    observer.observe(taxCalculatorContainer, { childList: true, subtree: true });
  
    // Fallback: hide spinner and show error if widget doesn't load within 10 seconds
    setTimeout(function () {
      if (
        !taxCalculatorContainer.querySelector('.atataxcalculator-table') ||
        !taxCalculatorContainer.querySelector('.atataxcalculator-table').innerHTML.trim()
      ) {
        spinner.hidden = true;
        fallback.hidden = false;
        observer.disconnect();
      }
    }, 10000); // 10 seconds
  });
  