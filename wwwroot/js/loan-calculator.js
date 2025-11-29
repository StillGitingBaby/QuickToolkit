(function () {
    function parseNumber(id) {
        const el = document.getElementById(id);
        if (!el) return 0;
        const val = parseFloat(el.value);
        return isNaN(val) ? 0 : val;
    }

    function formatMoney(amount) {
        if (!isFinite(amount)) return '–';
        return '£' + amount.toFixed(2);
    }

    function calculateLoan() {
        const principal = parseNumber('loan-amount'); // P
        const annualRate = parseNumber('loan-rate');  // % per year
        const years = parseNumber('loan-years');
        const extraMonthly = parseNumber('loan-extra');

        const monthlyRate = annualRate / 100 / 12;    // r
        const totalMonths = years * 12;               // n

        if (principal <= 0 || years <= 0) {
            updateResults(null, null, null, null);
            renderAmortisationTable([]);
            return;
        }

        let baseMonthly;

        if (monthlyRate === 0) {
            // No interest case: simple division
            baseMonthly = principal / totalMonths;
        } else {
            // Standard amortisation formula: P * r / (1 - (1 + r)^-n)
            const factor = Math.pow(1 + monthlyRate, totalMonths);
            baseMonthly = principal * monthlyRate / (1 - 1 / factor);
        }

        let plannedMonthly = baseMonthly;
        if (extraMonthly > 0) {
            plannedMonthly += extraMonthly;
        }

        // If extra payment is tiny, avoid “never repaid” cases
        if (monthlyRate > 0 && plannedMonthly <= principal * monthlyRate) {
            // Payment does not even cover interest:
            updateResults(plannedMonthly, NaN, NaN, 'Never (payment too low)');
            renderAmortisationTable([]);
            return;
        }

        // Simulate the loan month-by-month
        let balance = principal;
        let monthCount = 0;
        let totalPaid = 0;
        const amortRows = [];

        while (balance > 0 && monthCount < 1000 * 12) { // safety cap
            monthCount++;

            const interest = monthlyRate * balance;
            let payment = plannedMonthly;

            if (payment > balance + interest) {
                // Last payment: only pay what's left
                payment = balance + interest;
            }

            const principalPaid = payment - interest;
            balance -= principalPaid;

            if (balance < 0) balance = 0;

            totalPaid += payment;

            amortRows.push({
                month: monthCount,
                payment: payment,
                interest: interest,
                principal: principalPaid,
                balance: balance
            });

            if (balance <= 0.01) {
                balance = 0;
                break;
            }
        }

        const totalInterest = totalPaid - principal;

        let payoffTime;
        if (!isFinite(totalInterest) || monthCount === 0) {
            payoffTime = null;
        } else {
            const yearsPart = Math.floor(monthCount / 12);
            const monthsPart = monthCount % 12;

            if (yearsPart === 0) {
                payoffTime = `${monthsPart} month${monthsPart === 1 ? '' : 's'}`;
            } else if (monthsPart === 0) {
                payoffTime = `${yearsPart} year${yearsPart === 1 ? '' : 's'}`;
            } else {
                payoffTime = `${yearsPart} year${yearsPart === 1 ? '' : 's'} and ${monthsPart} month${monthsPart === 1 ? '' : 's'}`;
            }
        }

        updateResults(plannedMonthly, totalPaid, totalInterest, payoffTime);
        renderAmortisationTable(amortRows);
        renderLoanChart(amortRows);
    }

    function updateResults(monthly, totalPaid, totalInterest, payoffTime) {
        const monthlyEl = document.getElementById('loan-monthly');
        const totalPaidEl = document.getElementById('loan-total-paid');
        const totalInterestEl = document.getElementById('loan-total-interest');
        const payoffTimeEl = document.getElementById('loan-payoff-time');

        if (!monthlyEl || !totalPaidEl || !totalInterestEl || !payoffTimeEl) return;

        if (monthly === null) {
            monthlyEl.textContent = '–';
            totalPaidEl.textContent = '–';
            totalInterestEl.textContent = '–';
            payoffTimeEl.textContent = '–';
            return;
        }

        monthlyEl.textContent = formatMoney(monthly);
        totalPaidEl.textContent = isFinite(totalPaid) ? formatMoney(totalPaid) : '–';
        totalInterestEl.textContent = isFinite(totalInterest) ? formatMoney(totalInterest) : '–';
        payoffTimeEl.textContent = payoffTime ?? '–';
    }
    function renderAmortisationTable(rows) {
        const tbody = document.getElementById('loan-amort-body');
        if (!tbody) return;

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No schedule to display.</td></tr>';
            return;
        }

        const maxRows = 480; // cap at 40 years of monthly payments
        let html = '';

        rows.slice(0, maxRows).forEach(row => {
            html += `<tr>
            <td>${row.month}</td>
            <td>${formatMoney(row.payment)}</td>
            <td>${formatMoney(row.interest)}</td>
            <td>${formatMoney(row.principal)}</td>
            <td>${formatMoney(row.balance)}</td>
        </tr>`;
        });

        if (rows.length > maxRows) {
            html += `<tr>
            <td colspan="5">Schedule truncated to first ${maxRows} months.</td>
        </tr>`;
        }

        tbody.innerHTML = html;
    }
    function renderLoanChart(amortRows) {
        if (!window.QTCharts || !amortRows || amortRows.length === 0) {
            // Clear chart if needed by rendering empty data
            return QTCharts && QTCharts.renderLineChart
                ? QTCharts.renderLineChart('loan-balance-chart', {
                    labels: [],
                    datasets: [],
                    title: 'Balance over time',
                    xLabel: 'Month',
                    yLabel: 'Balance',
                    yBeginAtZero: false,
                    showLegend: false
                })
                : null;
        }

        const labels = amortRows.map(r => r.month);
        const balances = amortRows.map(r => r.balance);

        QTCharts.renderLineChart('loan-balance-chart', {
            labels: labels,
            datasets: [
                {
                    label: 'Balance',
                    data: balances,
                    // Chart.js will auto-pick a colour; you can customise later if you want
                    tension: 0.1
                }
            ],
            title: 'Loan balance over time',
            xLabel: 'Month',
            yLabel: 'Balance (£)',
            yBeginAtZero: false,
            showLegend: false,
            tooltipCallbacks: {
                label: function (ctx) {
                    const value = ctx.parsed.y;
                    return 'Balance: £' + value.toFixed(2);
                }
            }
        });
    }

    function initLoanCalculator() {
        const btn = document.getElementById('loan-calc-btn');
        if (!btn) return;

        btn.addEventListener('click', calculateLoan);

        // Also recalc live when inputs change
        const inputs = document.querySelectorAll('#loan-amount, #loan-rate, #loan-years, #loan-extra');
        inputs.forEach(i => {
            i.addEventListener('input', calculateLoan);
        });

        calculateLoan();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoanCalculator);
    } else {
        initLoanCalculator();
    }
})();
