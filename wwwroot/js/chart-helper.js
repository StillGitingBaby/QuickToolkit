// Simple global helper for QuickToolbox charts
(function () {
    const charts = {};

    function renderLineChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destroy previous chart on this canvas if it exists
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: config.labels,
                datasets: config.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: config.showLegend ?? true
                    },
                    title: {
                        display: !!config.title,
                        text: config.title || ''
                    },
                    tooltip: {
                        callbacks: config.tooltipCallbacks || {}
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: !!config.xLabel,
                            text: config.xLabel || ''
                        }
                    },
                    y: {
                        title: {
                            display: !!config.yLabel,
                            text: config.yLabel || ''
                        },
                        beginAtZero: config.yBeginAtZero ?? true
                    }
                }
            }
        });
    }

    window.QTCharts = {
        renderLineChart
    };
})();
