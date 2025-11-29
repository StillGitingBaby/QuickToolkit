(function () {
    function cleanText() {
        const inputEl = document.getElementById('tf-input');
        const outputEl = document.getElementById('tf-output');
        if (!inputEl || !outputEl) return;

        let text = inputEl.value || '';

        const trimLines = document.getElementById('tf-trim-lines')?.checked;
        const collapseSpaces = document.getElementById('tf-collapse-spaces')?.checked;
        const removeEmptyLines = document.getElementById('tf-remove-empty-lines')?.checked;
        const singleLine = document.getElementById('tf-single-line')?.checked;
        const fixPunctuation = document.getElementById('tf-fix-punctuation')?.checked;


        // Normalise line endings
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        let lines = text.split('\n');

        if (trimLines) {
            lines = lines.map(l => l.trim());
        }

        if (removeEmptyLines) {
            lines = lines.filter(l => l.length > 0);
        }

        text = lines.join('\n');

        if (collapseSpaces) {
            // Collapse sequences of spaces/tabs into a single space
            text = text.replace(/[ \t]+/g, ' ');
        }
        if (fixPunctuation) {
            // 1) Remove spaces before punctuation marks
            text = text.replace(/\s+([,.;:!?])/g, '$1');

            // 2) Ensure a single space after punctuation if followed immediately by a non-space
            text = text.replace(/([,.;:!?])([^\s])/g, '$1 $2');
        }

        if (singleLine) {
            // Replace newlines with a single space, then collapse extra spaces again
            text = text.replace(/\n+/g, ' ');
            text = text.replace(/[ \t]+/g, ' ').trim();
        }

      


        outputEl.value = text;
    }

    function copyOutput() {
        const outputEl = document.getElementById('tf-output');
        if (!outputEl) return;
        outputEl.select();
        document.execCommand('copy');
    }

 

    function initTextFormatter() {
        const cleanBtn = document.getElementById('tf-clean');
        const copyBtn = document.getElementById('tf-copy');

        if (!cleanBtn) return;

        cleanBtn.addEventListener('click', cleanText);
        copyBtn?.addEventListener('click', copyOutput);

        // Optional: live formatting as user types / toggles
        const inputEl = document.getElementById('tf-input');
        const options = document.querySelectorAll('#tf-trim-lines, #tf-collapse-spaces, #tf-remove-empty-lines, #tf-single-line, #tf-fix-punctuation');

        inputEl?.addEventListener('input', cleanText);
        options.forEach(opt => opt.addEventListener('change', cleanText));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTextFormatter);
    } else {
        initTextFormatter();
    }
})();
