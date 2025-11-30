(function () {
    function getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function applyTheme(theme, persist) {
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) {
            try {
                localStorage.setItem('qt-theme', theme);
            } catch (e) {
                // ignore
            }
        }
        updateToggleLabel(theme);
    }

    function updateToggleLabel(theme) {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        if (theme === 'dark') {
            btn.textContent = '☀️'; // show sun when in dark mode
            btn.title = 'Switch to light mode';
        } else {
            btn.textContent = '🌙';
            btn.title = 'Switch to dark mode';
        }
    }

    function initTheme() {
        var stored = null;
        try {
            stored = localStorage.getItem('qt-theme');
        } catch (e) { }

        var theme;
        if (stored === 'light' || stored === 'dark') {
            theme = stored;
        } else {
            // No stored preference → use system
            theme = getSystemPreference();
        }

        applyTheme(theme, false);

        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next, true);
        });

        // Optional: react to system changes if user hasn't set a preference
        if (!stored && window.matchMedia) {
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            mq.addEventListener('change', function (e) {
                var newTheme = e.matches ? 'dark' : 'light';
                applyTheme(newTheme, false);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
