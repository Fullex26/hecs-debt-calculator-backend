HECS Debt Calculator

A web application that helps users calculate and visualize repayment schedules for their HECS (Higher Education Contribution Scheme) debts based on their income and growth rate.

Table of Contents

Description
Features
Technologies
Installation
Usage
Contributing
License
Contact
Description

The HECS Debt Calculator allows users to estimate the time required to repay their HECS debts. By inputting their debt amount, income, and expected income growth rate, users receive a detailed repayment schedule. The application stores user data securely using MongoDB, ensuring that all calculations and user information are easily accessible and managed.

Features

Debt Calculation: Estimate the number of years needed to repay HECS debt.
Repayment Schedule: View a year-by-year breakdown of repayments.
Data Storage: Securely save user inputs and calculation results using MongoDB.
User-Friendly Interface: Simple and intuitive design for easy usage.
Responsive Design: Works seamlessly on various devices and screen sizes.
Technologies

Front-End:
HTML
CSS
JavaScript
Back-End:
Node.js
Express.js
Mongoose
Database:
MongoDB Atlas
Version Control:
Git
GitHub
Installation

Prerequisites
Node.js installed on your machine. Download Node.js
Git installed on your machine. Download Git
MongoDB Atlas account set up. Sign Up Here
Steps
Clone the Repository:
git clone https://github.com/yourusername/hecs-debt-calculator-backend.git
Navigate to the Project Directory:
cd hecs-debt-calculator-backend
Install Dependencies:
npm install
Set Up Environment Variables:
Create a .env file in the root directory:
touch .env
Add the following to .env:
MONGODB_URI=mongodb+srv://<username>:<password>@<clusterName>.mongodb.net/hecsDebtCalculator?retryWrites=true&w=majority
PORT=3000
Replace <username>, <password>, and <clusterName> with your MongoDB Atlas credentials and cluster name.
Note: If your password contains special characters (e.g., @, /), ensure they are URL-encoded. For example, @ becomes %40.
Start the Server:
npm start
The server will run on http://localhost:3000
Usage

Open Your Browser:
Navigate to http://localhost:3000
Enter Details:
Debt Amount: Total HECS debt.
Income: Annual income.
Growth Rate: Expected annual income growth rate (%).
Calculate:
Click the Calculate button to view the repayment schedule and the estimated number of years to repay the debt.
View Results:
Detailed repayment schedule showing year-by-year progress.
Remaining debt and total repayment over time.
Contributing

Contributions are welcome! Follow these steps to contribute:

Fork the Repository
Create a New Branch:
git checkout -b feature/YourFeature
Commit Your Changes:
git commit -m "Add some feature"
Push to the Branch:
git push origin feature/YourFeature
Open a Pull Request
License

This project is licensed under the MIT License.

Contact

Your Name: Jordan Fuller
Email: your.email@example.com
GitHub: yourusername
