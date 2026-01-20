/**
 * Create EMI Calculator Utility
 * Calculates monthly EMI and loan payment details
 */

/**
 * Calculate EMI (Equated Monthly Installment)
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * 
 * @param {number} principal - Loan amount in rupees
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {number} months - Loan tenure in months
 * @returns {object} - EMI details
 */
function calculateEMI(principal, annualRate, months) {
  // Validate inputs
  if (principal <= 0 || annualRate < 0 || months <= 0) {
    return {
      success: false,
      error: 'Invalid input parameters',
    };
  }

  try {
    const monthlyRate = annualRate / 100 / 12;

    let emi;
    let totalInterest;
    let totalAmount;

    if (monthlyRate === 0) {
      // If interest rate is 0, simple division
      emi = principal / months;
      totalInterest = 0;
    } else {
      // Standard EMI calculation
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
      const denominator = Math.pow(1 + monthlyRate, months) - 1;
      emi = (principal * numerator) / denominator;
      totalInterest = emi * months - principal;
    }

    totalAmount = emi * months;

    return {
      success: true,
      data: {
        principal: Math.round(principal),
        annualRate,
        months,
        monthlyEMI: Math.round(emi * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        monthlyRate,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate amortization schedule
 * Shows month-by-month breakdown of EMI
 * 
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} months - Tenure
 * @returns {array} - Monthly payment breakdown
 */
function getAmortizationSchedule(principal, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12;
  const emiResult = calculateEMI(principal, annualRate, months);

  if (!emiResult.success) {
    return {
      success: false,
      error: emiResult.error,
    };
  }

  const monthlyEMI = emiResult.data.monthlyEMI;
  let remainingBalance = principal;
  const schedule = [];

  for (let month = 1; month <= months; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyEMI - interestPayment;
    remainingBalance -= principalPayment;

    schedule.push({
      month,
      emiAmount: Math.round(monthlyEMI * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
    });
  }

  return {
    success: true,
    data: schedule,
  };
}

/**
 * Calculate required EMI from loan amount and monthly budget
 * 
 * @param {number} availableMonthlyAmount - Monthly budget for EMI
 * @param {number} annualRate - Annual interest rate
 * @param {number} months - Tenure
 * @returns {number} - Maximum loan amount
 */
function getMaxLoanAmount(availableMonthlyAmount, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return availableMonthlyAmount * months;
  }

  // Reverse EMI formula to get principal
  const denominator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const numerator = Math.pow(1 + monthlyRate, months) - 1;
  const principal = availableMonthlyAmount * (numerator / denominator);

  return Math.round(principal * 100) / 100;
}

module.exports = {
  calculateEMI,
  getAmortizationSchedule,
  getMaxLoanAmount,
};
