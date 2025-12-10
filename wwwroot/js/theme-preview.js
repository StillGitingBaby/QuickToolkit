(function () {
    // ================================
    // SPLITTER (flex-based)
    // ================================
    function initSplitter() {
        var layout = document.querySelector('.tp-split-layout');
        var sidebar = layout ? layout.querySelector('.tool-section.tool-input') : null;
        var splitter = document.getElementById('tp-splitter');

        if (!layout || !sidebar || !splitter) return;

        var dragging = false;

        splitter.addEventListener('mousedown', function () {
            if (window.innerWidth < 900) {
                return; // stacked layout – ignore drag
            }
            dragging = true;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;

            var rect = layout.getBoundingClientRect();
            var newWidth = e.clientX - rect.left;

            if (newWidth < 260) newWidth = 260;
            if (newWidth > 600) newWidth = 600;

            sidebar.style.flexBasis = newWidth + 'px';
        });

        document.addEventListener('mouseup', function () {
            if (!dragging) return;
            dragging = false;
            document.body.style.userSelect = '';
        });
    }

    // Helper
    function getEl(id) {
        return document.getElementById(id);
    }

    function applyColourVar(preview, inputId, cssVar) {
        var input = getEl(inputId);
        if (!input || !preview) return;

        function sync() {
            if (input.value) {
                preview.style.setProperty(cssVar, input.value);
            }
        }

        input.addEventListener('input', sync);
        sync();
    }

    function updateRadius(preview) {
        var slider = getEl('tp-radius');
        var label = getEl('tp-radius-value');
        if (!slider || !label || !preview) return;

        function sync() {
            var px = parseInt(slider.value || '12', 10);
            preview.style.setProperty('--tp-radius', px + 'px');
            label.textContent = px + 'px';
        }

        slider.addEventListener('input', sync);
        sync();
    }

    function updateShadow(preview) {
        var slider = getEl('tp-shadow');
        var label = getEl('tp-shadow-value');
        if (!slider || !label || !preview) return;

        function sync() {
            var level = parseInt(slider.value || '2', 10);
            var elevated;
            var soft;
            var text;

            if (level === 0) {
                elevated = 'none';
                soft = 'none';
                text = 'None';
            } else if (level === 1) {
                elevated = '0 10px 18px rgba(15, 23, 42, 0.45)';
                soft = '0 6px 12px rgba(15, 23, 42, 0.4)';
                text = 'Light';
            } else if (level === 2) {
                elevated = '0 14px 28px rgba(15, 23, 42, 0.55)';
                soft = '0 8px 18px rgba(15, 23, 42, 0.45)';
                text = 'Medium';
            } else {
                elevated = '0 22px 40px rgba(15, 23, 42, 0.7)';
                soft = '0 12px 25px rgba(15, 23, 42, 0.6)';
                text = 'Strong';
            }

            preview.style.setProperty('--tp-shadow-elevated', elevated);
            preview.style.setProperty('--tp-shadow-soft', soft);
            label.textContent = text;
        }

        slider.addEventListener('input', sync);
        sync();
    }

    function updateSpacing(preview) {
        var slider = getEl('tp-spacing');
        var label = getEl('tp-spacing-value');
        if (!slider || !label || !preview) return;

        function sync() {
            var level = parseInt(slider.value || '2', 10);
            var basePx;
            var text;

            if (level === 0) {
                basePx = 3;
                text = 'Compact';
            } else if (level === 1) {
                basePx = 5;
                text = 'Tight';
            } else if (level === 2) {
                basePx = 6;
                text = 'Normal';
            } else if (level === 3) {
                basePx = 7;
                text = 'Roomy';
            } else {
                basePx = 8;
                text = 'Spacious';
            }

            preview.style.setProperty('--tp-space', basePx + 'px');
            label.textContent = text;
        }

        slider.addEventListener('input', sync);
        sync();
    }

    function updateDarkMode(preview) {
        var checkbox = getEl('tp-dark-mode');
        var toggleBtn = getEl('tp-dark-toggle');
        if (!checkbox || !preview) return;

        function apply() {
            if (checkbox.checked) {
                preview.classList.add('tp-theme-dark');
                preview.classList.remove('tp-theme-light');
                if (toggleBtn) toggleBtn.classList.add('tp-toggle-on');
            } else {
                preview.classList.remove('tp-theme-dark');
                preview.classList.add('tp-theme-light');
                if (toggleBtn) toggleBtn.classList.remove('tp-toggle-on');
            }
        }

        checkbox.addEventListener('change', apply);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                checkbox.checked = !checkbox.checked;
                apply();
            });
        }

        apply();
    }

    function updateFonts(preview) {
        var familySelect = getEl('tp-font-family');
        var scaleSelect = getEl('tp-font-size-scale');
        if (!preview || !familySelect || !scaleSelect) return;

        function syncFamily() {
            var val = familySelect.value;
            var stack;

            if (val === 'serif') {
                stack = '"Georgia","Times New Roman",serif';
            } else if (val === 'mono') {
                stack = '"JetBrains Mono","Fira Code",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace';
            } else {
                stack = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
            }

            preview.style.setProperty('--tp-font-family', stack);
        }

        function syncSize() {
            var val = parseInt(scaleSelect.value || '1', 10);
            var size;

            if (val === 0) size = '13px';
            else if (val === 2) size = '16px';
            else size = '14px';

            preview.style.setProperty('--tp-font-size-base', size);
        }

        familySelect.addEventListener('change', syncFamily);
        scaleSelect.addEventListener('change', syncSize);

        syncFamily();
        syncSize();
    }

    function initReset() {
        var resetBtn = getEl('tp-reset');
        if (!resetBtn) return;

        resetBtn.addEventListener('click', function () {
            window.location.reload();
        });
    }

    // Sidebar list → scroll to section
    function initComponentNav() {
        var items = document.querySelectorAll('.tp-sidebar-list li');
        if (!items.length) return;

        function setActive(li) {
            for (var i = 0; i < items.length; i++) {
                items[i].classList.remove('active');
            }
            li.classList.add('active');
        }

        for (var i = 0; i < items.length; i++) {
            (function (li) {
                li.addEventListener('click', function () {
                    var targetId = li.getAttribute('data-target');
                    var target = targetId ? getEl(targetId) : null;
                    if (target) {
                        setActive(li);
                        try {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } catch (e) {
                            target.scrollIntoView(true);
                        }
                    }
                });
            })(items[i]);
        }
    }

    // ================================
    // TOKEN SNAPSHOT + EXPORT
    // ================================

    function readToken(preview, name) {
        if (!preview) return '';
        var styles = window.getComputedStyle(preview);
        return (styles.getPropertyValue(name) || '').trim();
    }

    function normaliseColour(value) {
        if (!value) return value;
        return value.replace(/\s+/g, ' ');
    }

    function getTokens(preview) {
        return {
            colours: {
                primary: normaliseColour(readToken(preview, '--tp-primary')),
                secondary: normaliseColour(readToken(preview, '--tp-secondary')),
                accent: normaliseColour(readToken(preview, '--tp-accent')),
                success: normaliseColour(readToken(preview, '--tp-success')),
                warning: normaliseColour(readToken(preview, '--tp-warning')),
                danger: normaliseColour(readToken(preview, '--tp-danger')),
                info: normaliseColour(readToken(preview, '--tp-info')),
                bg: normaliseColour(readToken(preview, '--tp-bg')),
                surface: normaliseColour(readToken(preview, '--tp-surface')),
                surfaceMuted: normaliseColour(readToken(preview, '--tp-surface-muted')),
                text: normaliseColour(readToken(preview, '--tp-text')),
                textMuted: normaliseColour(readToken(preview, '--tp-text-muted'))
            },
            radius: readToken(preview, '--tp-radius'),
            spacingBase: readToken(preview, '--tp-space'),
            shadows: {
                elevated: readToken(preview, '--tp-shadow-elevated'),
                soft: readToken(preview, '--tp-shadow-soft')
            },
            typography: {
                baseSize: readToken(preview, '--tp-font-size-base'),
                fontFamily: readToken(preview, '--tp-font-family')
            }
        };
    }

    function buildCss(tokens) {
        var c = tokens.colours;
        var lines = [];
        lines.push(':root {');
        lines.push('  /* Brand colours */');
        lines.push('  --color-primary: ' + c.primary + ';');
        lines.push('  --color-secondary: ' + c.secondary + ';');
        lines.push('  --color-accent: ' + c.accent + ';');
        lines.push('');
        lines.push('  /* Semantic colours */');
        lines.push('  --color-success: ' + c.success + ';');
        lines.push('  --color-warning: ' + c.warning + ';');
        lines.push('  --color-danger: ' + c.danger + ';');
        lines.push('  --color-info: ' + c.info + ';');
        lines.push('');
        lines.push('  /* Surfaces & text */');
        lines.push('  --color-bg: ' + c.bg + ';');
        lines.push('  --color-surface: ' + c.surface + ';');
        lines.push('  --color-surface-muted: ' + c.surfaceMuted + ';');
        lines.push('  --color-text: ' + c.text + ';');
        lines.push('  --color-text-muted: ' + c.textMuted + ';');
        lines.push('');
        lines.push('  /* Radii and spacing */');
        lines.push('  --radius-base: ' + tokens.radius + ';');
        lines.push('  --space-base: ' + tokens.spacingBase + ';');
        lines.push('');
        lines.push('  /* Shadows */');
        lines.push('  --shadow-elevated: ' + tokens.shadows.elevated + ';');
        lines.push('  --shadow-soft: ' + tokens.shadows.soft + ';');
        lines.push('');
        lines.push('  /* Typography */');
        lines.push('  --font-size-base: ' + tokens.typography.baseSize + ';');
        lines.push('  --font-family-base: ' + tokens.typography.fontFamily + ';');
        lines.push('}');
        return lines.join('\n');
    }

    function buildTailwind(tokens) {
        var c = tokens.colours;

        var lines = [];
        lines.push('// tailwind.config.js');
        lines.push('module.exports = {');
        lines.push('  theme: {');
        lines.push('    extend: {');
        lines.push('      colors: {');
        lines.push("        brand: {");
        lines.push("          primary: '" + c.primary + "',");
        lines.push("          secondary: '" + c.secondary + "',");
        lines.push("          accent: '" + c.accent + "',");
        lines.push("          success: '" + c.success + "',");
        lines.push("          warning: '" + c.warning + "',");
        lines.push("          danger: '" + c.danger + "',");
        lines.push("          info: '" + c.info + "',");
        lines.push("          bg: '" + c.bg + "',");
        lines.push("          surface: '" + c.surface + "',");
        lines.push("          surfaceMuted: '" + c.surfaceMuted + "',");
        lines.push("          text: '" + c.text + "',");
        lines.push("          textMuted: '" + c.textMuted + "'");
        lines.push('        }');
        lines.push('      },');
        lines.push('      borderRadius: {');
        lines.push("        brand: '" + tokens.radius + "'");
        lines.push('      },');
        lines.push('      boxShadow: {');
        lines.push("        brand: '" + tokens.shadows.elevated + "',");
        lines.push("        'brand-soft': '" + tokens.shadows.soft + "'");
        lines.push('      },');
        lines.push('      fontFamily: {');
        lines.push("        brand: '" + tokens.typography.fontFamily + "'");
        lines.push('      },');
        lines.push('      fontSize: {');
        lines.push("        base: '" + tokens.typography.baseSize + "'");
        lines.push('      }');
        lines.push('    }');
        lines.push('  }');
        lines.push('};');
        return lines.join('\n');
    }

    function buildJson(tokens) {
        return JSON.stringify(tokens, null, 2);
    }

    function initExport(preview) {
        var formatSelect = getEl('tp-export-format');
        var refreshBtn = getEl('tp-export-refresh');
        var copyBtn = getEl('tp-export-copy');
        var output = getEl('tp-export-output');

        if (!preview || !formatSelect || !refreshBtn || !copyBtn || !output) return;

        function generate() {
            var tokens = getTokens(preview);
            var format = formatSelect.value || 'css';
            var text;

            if (format === 'tailwind') {
                text = buildTailwind(tokens);
            } else if (format === 'json') {
                text = buildJson(tokens);
            } else {
                text = buildCss(tokens);
            }

            output.value = text;
        }

        function copy() {
            if (!output.value) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(output.value).catch(function () { });
            } else {
                output.select();
                try {
                    document.execCommand('copy');
                } catch (e) { }
            }
        }

        refreshBtn.addEventListener('click', generate);
        formatSelect.addEventListener('change', generate);
        copyBtn.addEventListener('click', copy);

        // Generate once on load
        generate();
    }

    // ================================
    // MAIN INIT
    // ================================
    function initThemePreview() {
        var preview = getEl('tp-preview');
        if (!preview) return;

        // Colour tokens
        applyColourVar(preview, 'tp-primary', '--tp-primary');
        applyColourVar(preview, 'tp-secondary', '--tp-secondary');
        applyColourVar(preview, 'tp-accent', '--tp-accent');
        applyColourVar(preview, 'tp-success', '--tp-success');
        applyColourVar(preview, 'tp-warning', '--tp-warning');
        applyColourVar(preview, 'tp-danger', '--tp-danger');
        applyColourVar(preview, 'tp-bg', '--tp-bg');
        applyColourVar(preview, 'tp-surface', '--tp-surface');
        applyColourVar(preview, 'tp-text', '--tp-text');
        applyColourVar(preview, 'tp-muted', '--tp-text-muted');

        // Other controls
        updateRadius(preview);
        updateShadow(preview);
        updateSpacing(preview);
        updateDarkMode(preview);
        updateFonts(preview);
        initReset();
        initComponentNav();
        initExport(preview);
    }

    function onReady() {
        initSplitter();
        initThemePreview();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
