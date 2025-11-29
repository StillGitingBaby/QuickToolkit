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

    function calculateSavings() {
        const start = parseNumber('sv-start');
        const goal = parseNumber('sv-goal');
        const monthly = parseNumber('sv-monthly');
        const annualRate = parseNumber('sv-rate');
        const maxYears = parseNumber('sv-max-years');
        const history = [];


        const monthlyRate = annualRate / 100 / 12;

        if (goal <= 0 || (start <= 0 && monthly <= 0)) {
            updateSavingsResults(null, null, null, null);
            return;
        }

        if (start >= goal) {
            // Already at or above goal
            updateSavingsResults('0 months (goal already reached)', 0, 0, start);
            return;
        }

        const maxMonths = maxYears * 12;
        let balance = start;
        let month = 0;
        let totalContrib = 0;

        while (balance < goal && month < maxMonths) {
            month++;

            // Interest for the month
            const interest = balance * monthlyRate;

            // Add contribution at end of month
            balance += interest;

            if (monthly > 0) {
                balance += monthly;
                totalContrib += monthly;
            }

            history.push({
                month,
                balance
            });
        }

        if (balance < goal) {
            // Didn't reach goal within maxYears
            updateSavingsResults(
                `Not reached within ${maxYears} years`,
                totalContrib,
                balance - start - totalContrib,
                balance
            );
            return;
        }

        const totalInterest = balance - start - totalContrib;

        // Convert months to years + months
        const yearsPart = Math.floor(month / 12);
        const monthsPart = month % 12;

        let timeString;
        if (yearsPart === 0) {
            timeString = `${monthsPart} month${monthsPart === 1 ? '' : 's'}`;
        } else if (monthsPart === 0) {
            timeString = `${yearsPart} year${yearsPart === 1 ? '' : 's'}`;
        } else {
            timeString = `${yearsPart} year${yearsPart === 1 ? '' : 's'} and ${monthsPart} month${monthsPart === 1 ? '' : 's'}`;
        }

        updateSavingsResults(timeString, totalContrib, totalInterest, balance);
        renderSavingsChart(history);
    }

    function renderSavingsChart(history) {
        if (!window.QTCharts) return;

        if (!history || history.length === 0) {
            QTCharts.renderLineChart('savings-balance-chart', {
                labels: [],
                datasets: [],
                title: 'Balance over time',
                xLabel: 'Month',
                yLabel: 'Balance',
                yBeginAtZero: true,
                showLegend: false
            });
            return;
        }

        const labels = history.map(h => h.month);
        const balances = history.map(h => h.balance);

        QTCharts.renderLineChart('savings-balance-chart', {
            labels: labels,
            datasets: [
                {
                    label: 'Balance',
                    data: balances,
                    tension: 0.1
                }
            ],
            title: 'Savings balance over time',
            xLabel: 'Month',
            yLabel: 'Balance (£)',
            yBeginAtZero: true,
            showLegend: false,
            tooltipCallbacks: {
                label: function (ctx) {
                    const value = ctx.parsed.y;
                    return 'Balance: £' + value.toFixed(2);
                }
            }
        });
    }


    function updateSavingsResults(time, totalContrib, totalInterest, finalBalance) {
        const timeEl = document.getElementById('sv-time');
        const contribEl = document.getElementById('sv-total-contrib');
        const interestEl = document.getElementById('sv-total-interest');
        const finalEl = document.getElementById('sv-final-balance');

        if (!timeEl || !contribEl || !interestEl || !finalEl) return;

        if (time === null) {
            timeEl.textContent = '–';
            contribEl.textContent = '–';
            interestEl.textContent = '–';
            finalEl.textContent = '–';
            return;
        }

        timeEl.textContent = time;
        contribEl.textContent = formatMoney(totalContrib ?? 0);
        interestEl.textContent = formatMoney(totalInterest ?? 0);
        finalEl.textContent = formatMoney(finalBalance ?? 0);
    }

    function initSavingsCalculator() {
        const btn = document.getElementById('sv-calc-btn');
        if (!btn) return;

        btn.addEventListener('click', calculateSavings);

        const inputs = document.querySelectorAll('#sv-start, #sv-goal, #sv-monthly, #sv-rate, #sv-max-years');
        inputs.forEach(i => i.addEventListener('input', calculateSavings));

        calculateSavings();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSavingsCalculator);
    } else {
        initSavingsCalculator();
    }
})();
