// ========================================
// Charts Component
// ========================================

/**
 * Draw a donut chart
 */
// export function drawDonutChart(ctx, data, centerX, centerY, radius, thickness) {
//     const total = data.reduce((sum, item) => sum + item.value, 0);
//     let startAngle = -Math.PI / 2;

//     // Clear canvas
//     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//     // Draw segments
//     data.forEach(item => {
//         const sliceAngle = (item.value / total) * 2 * Math.PI;

//         ctx.beginPath();
//         ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
//         ctx.arc(centerX, centerY, radius - thickness, startAngle + sliceAngle, startAngle, true);
//         ctx.closePath();

//         ctx.fillStyle = item.color;
//         ctx.fill();

//         startAngle += sliceAngle;
//     });

//     // Draw center circle (for cleaner look)
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius - thickness - 2, 0, 2 * Math.PI);
//     ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-color').trim() || '#fff';
//     ctx.fill();
// }
export function drawDonutChart(ctx, data, centerX, centerY, radius, thickness) {
    const canvas = ctx.canvas;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ensure we have valid data
    if (total === 0) {
        // Draw empty state
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = thickness;
        ctx.stroke();
        return;
    }

    let startAngle = -Math.PI / 2; // Start from top

    // Draw segments
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

/**
 * Draw a bar chart
 */
export function drawBarChart(ctx, data, options = {}) {
    const {
        width = ctx.canvas.width,
        height = ctx.canvas.height,
        padding = 40,
        barColor = '#FF9800',
        labelColor = '#666'
    } = options;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width - padding * 2) / data.length - 10;
    const chartHeight = height - padding * 2;

    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding + index * (barWidth + 10);
        const y = height - padding - barHeight;

        // Draw bar
        ctx.fillStyle = item.color || barColor;
        ctx.beginPath();
        roundRect(ctx, x, y, barWidth, barHeight, 4);
        ctx.fill();

        // Draw label
        ctx.fillStyle = labelColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, height - padding + 15);

        // Draw value
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
    });
}

/**
 * Draw a line chart
 */
export function drawLineChart(ctx, data, options = {}) {
    const {
        width = ctx.canvas.width,
        height = ctx.canvas.height,
        padding = 40,
        lineColor = '#FF9800',
        fillColor = 'rgba(255, 152, 0, 0.1)',
        dotColor = '#FF9800',
        labelColor = '#666'
    } = options;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value));
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = chartWidth / (data.length - 1);

    // Calculate points
    const points = data.map((item, index) => ({
        x: padding + index * stepX,
        y: height - padding - (item.value / maxValue) * chartHeight,
        label: item.label,
        value: item.value
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

    // Draw dots and labels
    points.forEach(point => {
        // Dot
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = labelColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, point.x, height - padding + 15);
    });
}

/**
 * Draw a progress ring
 */
export function drawProgressRing(ctx, value, maxValue, options = {}) {
    const {
        centerX = ctx.canvas.width / 2,
        centerY = ctx.canvas.height / 2,
        radius = 40,
        thickness = 8,
        bgColor = '#E0E0E0',
        fgColor = '#FF9800',
        textColor = '#333'
    } = options;

    const percent = value / maxValue;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (percent * 2 * Math.PI);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

    // Center text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(percent * 100)}%`, centerX, centerY);
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}