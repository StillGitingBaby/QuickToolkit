(function () {
    const valueAInput = document.getElementById('pd-value-a');
    const valueBInput = document.getElementById('pd-value-b');
    const calcBtn = document.getElementById('pd-calc');
    const clearBtn = document.getElementById('pd-clear');

    const changeRadio = document.getElementById('pd-mode-change');
    const diffRadio = document.getElementById('pd-mode-difference');

    const summaryEl = document.getElementById('pd-summary');
    const changeValueEl = document.getElementById('pd-change-value');
    const changeDirEl = document.getElementById('pd-change-direction');
    const diffValueEl = document.getElementById('pd-diff-value');
    const bOfAEl = document.getElementById('pd-b-of-a');
    const aOfBEl = document.getElementById('pd-a-of-b');

    if (!valueAInput || !valueBInput) {
        return;
    }

    const PLACEHOLDER = '–';
    const NA_TEXT = 'N/A';

    function parseNumber(input) {
        const raw = (input.value ?? '').trim();
        if (raw === '') return null;
        const val = parseFloat(raw);
        return isNaN(val) ? null : val;
    }

    function formatPercent(value) {
        if (value === null || !isFinite(value)) {
            return NA_TEXT;
        }
        return value.toFixed(2) + '%';
    }

    function formatRatio(value) {
        if (value === null || !isFinite(value)) {
            return NA_TEXT;
        }
        return value.toFixed(2) + '%';
    }

    function resetOutputs() {
        changeValueEl.textContent = PLACEHOLDER;
        changeDirEl.textContent = '';
        diffValueEl.textContent = PLACEHOLDER;
        bOfAEl.textContent = PLACEHOLDER;
        aOfBEl.textContent = PLACEHOLDER;
    }

    function calculate() {
        const a = parseNumber(valueAInput);
        const b = parseNumber(valueBInput);

        // Nothing or not enough to work with → blankish state, no nagging
        if (a === null || b === null) {
            resetOutputs();
            summaryEl.textContent = 'Enter values for A and B to see the results.';
            return;
        }

        // --- Percentage change from A to B: (B - A) / |A| * 100
        let changePercent = null;
        let directionText = '';
        let changeIsCalculable = true;

        if (a === 0) {
            if (b === 0) {
                changePercent = 0;
                directionText = '(no change)';
            } else {
                // from 0 to non-zero: mathematically "infinite" / undefined
                changePercent = null;
                directionText = '(cannot compute percentage change from 0)';
                changeIsCalculable = false;
            }
        } else {
            changePercent = ((b - a) / Math.abs(a)) * 100;

            if (b > a) {
                directionText = '(increase)';
            } else if (b < a) {
                directionText = '(decrease)';
            } else {
                directionText = '(no change)';
            }
        }

        // --- Symmetric percentage difference: |A - B| / ((|A| + |B|) / 2) * 100
        let diffPercent = null;
        const absA = Math.abs(a);
        const absB = Math.abs(b);
        const avg = (absA + absB) / 2;

        if (avg === 0) {
            // both zero → no difference
            diffPercent = 0;
        } else {
            diffPercent = (Math.abs(a - b) / avg) * 100;
        }

        // --- B as % of A
        let bOfA = null;
        if (a === 0) {
            if (b === 0) {
                bOfA = 100;
            } else {
                bOfA = null; // incalculable
            }
        } else {
            bOfA = (b / a) * 100;
        }

        // --- A as % of B
        let aOfB = null;
        if (b === 0) {
            if (a === 0) {
                aOfB = 100;
            } else {
                aOfB = null;
            }
        } else {
            aOfB = (a / b) * 100;
        }

        // --- Update UI

        // Change value
        if (!changeIsCalculable) {
            changeValueEl.textContent = NA_TEXT;
        } else {
            changeValueEl.textContent = formatPercent(changePercent);
        }
        changeDirEl.textContent = directionText;

        // Symmetric difference always calculable here
        diffValueEl.textContent = formatPercent(diffPercent);

        bOfAEl.textContent = formatRatio(bOfA);
        aOfBEl.textContent = formatRatio(aOfB);

        const activeMode = diffRadio && diffRadio.checked ? 'difference' : 'change';

        if (activeMode === 'change') {
            if (!changeIsCalculable) {
                summaryEl.textContent =
                    `Percentage change from ${a} to ${b} cannot be computed because the starting value is 0.`;
            } else {
                const absChange = changePercent != null ? Math.abs(changePercent) : null;

                if (b === a) {
                    summaryEl.textContent =
                        `A and B are the same (${a}). There is no percentage change.`;
                } else if (absChange === null) {
                    summaryEl.textContent =
                        `Percentage change could not be calculated for these values.`;
                } else {
                    const label =
                        b > a ? 'increase' :
                            b < a ? 'decrease' :
                                'change';

                    summaryEl.textContent =
                        `Going from ${a} to ${b} is a ${formatPercent(absChange)} ${label}.`;
                }
            }
        } else {
            summaryEl.textContent =
                `The symmetric percentage difference between ${a} and ${b} is ${formatPercent(diffPercent)}.`;
        }
    }

    function clearAll() {
        valueAInput.value = '';
        valueBInput.value = '';
        resetOutputs();
        summaryEl.textContent = 'Enter values for A and B to see the results.';
    }

    // --- Event wiring ---

    // Live calculation as you type
    valueAInput.addEventListener('input', calculate);
    valueBInput.addEventListener('input', calculate);

    // Mode change also recalculates
    if (changeRadio) {
        changeRadio.addEventListener('change', calculate);
    }
    if (diffRadio) {
        diffRadio.addEventListener('change', calculate);
    }

    // Buttons still work (but are optional)
    if (calcBtn) {
        calcBtn.addEventListener('click', calculate);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    // Initial state (with whatever defaults you have in the inputs)
    calculate();
})();
