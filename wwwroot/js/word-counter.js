(function () {
    function updateCounts() {
        const textarea = document.getElementById('wc-input');
        if (!textarea) return;

        const text = textarea.value || '';

        // Lines
        const lines = text.length ? text.split(/\r\n|\r|\n/).length : 0;

        // Characters
        const charsWith = text.length;
        const charsNo = text.replace(/\s/g, '').length;

        // Words: split on whitespace, filter out empties
        const words = text
            .trim()
            .split(/\s+/)
            .filter(x => x.length > 0).length;

        document.getElementById('wc-lines').textContent = lines;
        document.getElementById('wc-chars-with').textContent = charsWith;
        document.getElementById('wc-chars-no').textContent = charsNo;
        document.getElementById('wc-words').textContent = words;
    }

    function initWordCounter() {
        const textarea = document.getElementById('wc-input');
        if (!textarea) return;

        textarea.addEventListener('input', updateCounts);
        updateCounts(); // initial run
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWordCounter);
    } else {
        initWordCounter();
    }
})();
