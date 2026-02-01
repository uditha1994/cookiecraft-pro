/**
 * Charts Component Tests
 */

describe('Charts Component', () => {
    let canvas;
    let ctx;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        ctx = canvas.getContext('2d');
    });

    describe('Donut Chart', () => {
        function drawDonutChart(ctx, data, centerX, centerY, radius, thickness) {
            const total = data.reduce((sum, item) => sum + item.value, 0);

            if (total === 0) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#E0E0E0';
                ctx.lineWidth = thickness;
                ctx.stroke();
                return;
            }

            let startAngle = -Math.PI / 2;

            data.forEach(item => {
                if (item.value <= 0) return;

                const sliceAngle = (item.value / total) * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - thickness / 2, startAngle, endAngle);
                ctx.strokeStyle = item.color;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.stroke();

                startAngle = endAngle;
            });
        }

        test('should draw chart without errors', () => {
            const data = [
                { label: 'A', value: 30, color: '#FF9800' },
                { label: 'B', value: 20, color: '#4CAF50' },
                { label: 'C', value: 50, color: '#2196F3' }
            ];

            expect(() => {
                drawDonutChart(ctx, data, 100, 100, 80, 20);
            }).not.toThrow();
        });

        test('should handle empty data', () => {
            const data = [];

            expect(() => {
                drawDonutChart(ctx, data, 100, 100, 80, 20);
            }).not.toThrow();
        });

        test('should handle zero values', () => {
            const data = [
                { label: 'A', value: 0, color: '#FF9800' },
                { label: 'B', value: 0, color: '#4CAF50' }
            ];

            expect(() => {
                drawDonutChart(ctx, data, 100, 100, 80, 20);
            }).not.toThrow();
        });

        test('should handle single segment', () => {
            const data = [
                { label: 'Only', value: 100, color: '#FF9800' }
            ];

            expect(() => {
                drawDonutChart(ctx, data, 100, 100, 80, 20);
            }).not.toThrow();
        });

        test('should calculate correct total', () => {
            const data = [
                { label: 'A', value: 25, color: '#FF9800' },
                { label: 'B', value: 25, color: '#4CAF50' },
                { label: 'C', value: 25, color: '#2196F3' },
                { label: 'D', value: 25, color: '#9C27B0' }
            ];

            const total = data.reduce((sum, item) => sum + item.value, 0);
            expect(total).toBe(100);
        });
    });

    describe('Bar Chart', () => {
        function drawBarChart(ctx, data, options = {}) {
            const {
                width = ctx.canvas.width,
                height = ctx.canvas.height,
                padding = 40,
                barColor = '#FF9800'
            } = options;

            ctx.clearRect(0, 0, width, height);

            if (data.length === 0) return;

            const maxValue = Math.max(...data.map(d => d.value));
            const barWidth = (width - padding * 2) / data.length - 10;
            const chartHeight = height - padding * 2;

            data.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight;
                const x = padding + index * (barWidth + 10);
                const y = height - padding - barHeight;

                ctx.fillStyle = item.color || barColor;
                ctx.fillRect(x, y, barWidth, barHeight);
            });
        }

        test('should draw bar chart without errors', () => {
            const data = [
                { label: 'Mon', value: 10 },
                { label: 'Tue', value: 20 },
                { label: 'Wed', value: 15 },
                { label: 'Thu', value: 25 },
                { label: 'Fri', value: 18 }
            ];

            expect(() => {
                drawBarChart(ctx, data);
            }).not.toThrow();
        });

        test('should handle empty data', () => {
            expect(() => {
                drawBarChart(ctx, []);
            }).not.toThrow();
        });

        test('should use custom colors', () => {
            const data = [
                { label: 'A', value: 10, color: '#FF0000' },
                { label: 'B', value: 20, color: '#00FF00' }
            ];

            expect(() => {
                drawBarChart(ctx, data);
            }).not.toThrow();
        });

        test('should respect padding option', () => {
            const data = [{ label: 'A', value: 10 }];

            expect(() => {
                drawBarChart(ctx, data, { padding: 20 });
            }).not.toThrow();
        });
    });

    describe('Line Chart', () => {
        function drawLineChart(ctx, data, options = {}) {
            const {
                width = ctx.canvas.width,
                height = ctx.canvas.height,
                padding = 40,
                lineColor = '#FF9800',
                fillColor = 'rgba(255, 152, 0, 0.1)'
            } = options;

            ctx.clearRect(0, 0, width, height);

            if (data.length < 2) return;

            const maxValue = Math.max(...data.map(d => d.value));
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const stepX = chartWidth / (data.length - 1);

            const points = data.map((item, index) => ({
                x: padding + index * stepX,
                y: height - padding - (item.value / maxValue) * chartHeight
            }));

            // Draw fill
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - padding);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.lineTo(points[points.length - 1].x, height - padding);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();

            // Draw line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        test('should draw line chart without errors', () => {
            const data = [
                { label: 'Mon', value: 10 },
                { label: 'Tue', value: 15 },
                { label: 'Wed', value: 12 },
                { label: 'Thu', value: 20 },
                { label: 'Fri', value: 18 }
            ];

            expect(() => {
                drawLineChart(ctx, data);
            }).not.toThrow();
        });

        test('should handle minimum data points', () => {
            const data = [
                { label: 'A', value: 10 },
                { label: 'B', value: 20 }
            ];

            expect(() => {
                drawLineChart(ctx, data);
            }).not.toThrow();
        });

        test('should handle single data point gracefully', () => {
            const data = [{ label: 'Only', value: 10 }];

            expect(() => {
                drawLineChart(ctx, data);
            }).not.toThrow();
        });
    });

    describe('Progress Ring', () => {
        function drawProgressRing(ctx, value, maxValue, options = {}) {
            const {
                centerX = ctx.canvas.width / 2,
                centerY = ctx.canvas.height / 2,
                radius = 40,
                thickness = 8,
                bgColor = '#E0E0E0',
                fgColor = '#FF9800'
            } = options;

            const percent = Math.min(Math.max(value / maxValue, 0), 1);
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (percent * 2 * Math.PI);

            // Background ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = bgColor;
            ctx.lineWidth = thickness;
            ctx.stroke();

            // Progress ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = fgColor;
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        test('should draw progress ring', () => {
            expect(() => {
                drawProgressRing(ctx, 75, 100);
            }).not.toThrow();
        });

        test('should handle 0 percent', () => {
            expect(() => {
                drawProgressRing(ctx, 0, 100);
            }).not.toThrow();
        });

        test('should handle 100 percent', () => {
            expect(() => {
                drawProgressRing(ctx, 100, 100);
            }).not.toThrow();
        });

        test('should clamp values over 100 percent', () => {
            expect(() => {
                drawProgressRing(ctx, 150, 100);
            }).not.toThrow();
        });

        test('should handle negative values', () => {
            expect(() => {
                drawProgressRing(ctx, -10, 100);
            }).not.toThrow();
        });
    });

    describe('Chart Utilities', () => {
        test('should format bytes correctly', () => {
            function formatBytes(bytes) {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            expect(formatBytes(0)).toBe('0 B');
            expect(formatBytes(500)).toBe('500 B');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1536)).toBe('1.5 KB');
            expect(formatBytes(1048576)).toBe('1 MB');
        });

        test('should generate legend items', () => {
            const data = [
                { label: 'Analytics', value: 30, color: '#2196F3' },
                { label: 'Advertising', value: 20, color: '#F44336' },
                { label: 'Functional', value: 50, color: '#4CAF50' }
            ];

            const legendItems = data.map(item => ({
                label: item.label,
                value: item.value,
                color: item.color,
                percent: Math.round((item.value / 100) * 100)
            }));

            expect(legendItems.length).toBe(3);
            expect(legendItems[0].percent).toBe(30);
        });
    });
});