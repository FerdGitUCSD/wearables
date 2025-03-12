// Set the SVG canvas size and margins
const eda_width = 900, eda_height = 500, eda_margin = { top: 20, right: 30, bottom: 50, left: 50 };

const eda_colorMapping = {
    "Stress": "#F3A74F",
    "Aerobic": "#0077B6",
    "Anaerobic": "#F94144"
};

// Create the SVG canvas
const edasvg = d3.select("#eda-chart")
    .append("svg")
    .attr("width", eda_width)
    .attr("height", eda_height);

// Create the chart area
const edachartArea = edasvg.append("g")
    .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`);

// Initialize reference line elements
const edaVerticalLine = edachartArea.append("line")
    .attr("class", "eda-vertical-line")
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .style("opacity", 0);

const edaTimeText = edachartArea.append("text")
    .attr("class", "eda-time-text")
    .style("opacity", 0)
    .style("font-size", "12px")
    .style("fill", "black");

// Create a tooltip
const edatooltip = d3.select("body").append("div")
    .attr("class", "eda-tooltip")
    .style("opacity", 0);

let eda_allData = [];
let selectedSubjects = ["S01"]; // 默认选中第一个受试者
const eda_startTime = new Date(2025, 0, 1, 0, 0, 0);

document.addEventListener("DOMContentLoaded", function () {
    const eda_subjectSelect = document.getElementById("subjectSelect");

    if (!eda_subjectSelect) {
        console.error("❌ Error: subjectSelect element not found!");
        return;
    }

    d3.csv("data/Merged_Data.csv").then(data => {
        eda_allData = data.map(d => ({
            Subject: d.Subject,  
            Experiment: d.Experiment,
            timestamp: new Date(eda_startTime.getTime() + (+d.timestamp * 1000)),
            EDA: +d.EDA,
            Age: +d.Age || 25,
            Gender: d.Gender || 'Unknown'
        }));

        // Initialize Subject selector
        const subjects = [...new Set(eda_allData.map(d => d.Subject))];
        eda_subjectSelect.innerHTML = subjects.map(subject => 
            `<option value="${subject}" ${subject === "S01" ? "selected" : ""}>${subject}</option>`
        ).join("");

        // 修改后的多选逻辑
        eda_subjectSelect.addEventListener("change", function(e) {
            if (e.shiftKey) {
                if (!selectedSubjects.includes(this.value)) {
                    selectedSubjects.push(this.value);
                }
            } else {
                selectedSubjects = [this.value];
            }
            eda_updateChart();
        });

        // 添加实验类型复选框的事件监听器
        document.querySelectorAll('.eda-experiment-controls input').forEach(checkbox => {
            checkbox.addEventListener("change", eda_updateChart);
        });

        eda_updateChart();

    }).catch(error => console.error("❌ Error loading CSV:", error));
});

// New function: Calculate statistics
function calculateStats(data) {
    const stats = {};
    const experiments = [...new Set(data.map(d => d.Experiment))];

    experiments.forEach(exp => {
        const expData = data.filter(d => d.Experiment === exp).map(d => d.EDA);
        stats[exp] = {
            mean: d3.mean(expData).toFixed(2),
            stdDev: d3.deviation(expData).toFixed(2),
            max: d3.max(expData).toFixed(2),
            min: d3.min(expData).toFixed(2),
            peakTime: d3.timeFormat("%M:%S")(data.find(d => d.EDA === d3.max(expData)).timestamp)
        };
    });

    return stats;
}

// New function to update statistics panel
function updateStatsPanel(stats) {
    const panel = document.getElementById("eda-stats-grid");
    if (!panel) {
        console.error("❌ Stats panel element not found");
        return;
    }

    panel.innerHTML = Object.entries(stats).map(([experiment, stat]) => `
        <div class="eda-stat-group">
            <h4 style="color:${eda_colorMapping[experiment]}">${experiment} experiment</h4>
            <div class="eda-stat-row"><span class="eda-stat-label">Mean:</span><span class="eda-stat-value">${stat.mean}</span></div>
            <div class="eda-stat-row"><span class="eda-stat-label">Std Dev:</span><span class="eda-stat-value">${stat.stdDev}</span></div>
            <div class="eda-stat-row"><span class="eda-stat-label">Max:</span><span class="eda-stat-value">${stat.max}</span></div>
            <div class="eda-stat-row"><span class="eda-stat-label">Min:</span><span class="eda-stat-value">${stat.min}</span></div>
            <div class="eda-stat-row"><span class="eda-stat-label">Peak Time:</span><span class="eda-stat-value">${stat.peakTime}</span></div>
        </div>
    `).join("");
}

// Main update function
function eda_updateChart() {
    // Clear old elements
    edachartArea.selectAll(".line").remove();
    edachartArea.selectAll(".legend").remove();
    edachartArea.selectAll(".eda-data-point").remove();
    edachartArea.selectAll(".peak-label").remove();
    edachartArea.on("mousemove", null).on("mouseleave", null);

    // 获取激活的实验类型
    const activeExperiments = Array.from(
        document.querySelectorAll('.eda-experiment-controls input:checked')
    ).map(el => el.value);

    // 过滤数据
    const filteredData = eda_allData.filter(d => 
        selectedSubjects.includes(d.Subject) && 
        activeExperiments.includes(d.Experiment)
    );

    if (filteredData.length === 0) {
        console.error("⚠️ No data available!");
        return;
    }

    // ========== Scale Definitions ==========
    const xScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.timestamp))
        .range([0, eda_width - eda_margin.left - eda_margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.EDA)])
        .range([eda_height - eda_margin.top - eda_margin.bottom, 0]);

    // ========== Axes and Gridlines ==========
    edasvg.selectAll(".grid").remove();
    
    // X-axis grid
    edasvg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${eda_margin.left}, ${eda_height - eda_margin.bottom})`)
        .call(d3.axisBottom(xScale)
            .ticks(5)
            .tickSize(-eda_height + eda_margin.top + eda_margin.bottom)
            .tickFormat(""));

    // Y-axis grid
    edasvg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`)
        .call(d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-eda_width + eda_margin.left + eda_margin.right)
            .tickFormat(""));

    // X-axis
    edasvg.selectAll(".x-axis").remove();
    edasvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_height - eda_margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%M:%S")));

    // Y-axis
    edasvg.selectAll(".y-axis").remove();
    edasvg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`)
        .call(d3.axisLeft(yScale));

    // ========== Draw Experiment Lines ==========
    const experiments = [...new Set(filteredData.map(d => d.Experiment))];
    experiments.forEach(experiment => {
        const experimentData = filteredData.filter(d => d.Experiment === experiment);
        
        // 添加实验特定的class
        edachartArea.append("path")
            .datum(experimentData)
            .attr("class", `line line-${experiment}`) // 添加双重class
            .attr("fill", "none")
            .attr("stroke", eda_colorMapping[experiment])
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => xScale(d.timestamp))
                .y(d => yScale(d.EDA))
            );

        // 峰值标记修正
        const maxDataPoint = d3.max(experimentData, d => d.EDA);
        const peakPoint = experimentData.find(d => d.EDA === maxDataPoint);
        if (peakPoint) {
            edachartArea.append("text")
                .attr("class", "peak-label")
                .attr("x", xScale(peakPoint.timestamp) + 5)
                .attr("y", yScale(peakPoint.EDA) - 5)
                .text("▲ Peak")
                .style("fill", eda_colorMapping[experiment])
                .style("font-size", "10px");
        }
    });

    // ========== Legend with Toggle ==========
    const legend = edachartArea.selectAll(".legend")
        .data(experiments)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${eda_width - 150}, ${i * 20})`);

    legend.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => eda_colorMapping[d]);

    legend.append("text")
        .attr("x", 30)
        .attr("y", 20)
        .attr("font-size", "14px")
        .text(d => d);

    // 图例点击交互
    legend.on("click", function(event, experiment) {
        const line = edachartArea.selectAll(`.line-${experiment}`);
        const currentOpacity = line.style("opacity");
        line.transition().style("opacity", currentOpacity === "0" ? 1 : 0);
        d3.select(this).classed("inactive", currentOpacity !== "0");
    });

    // ========== 双击重置 ==========
    edachartArea.on("dblclick", () => {
        document.querySelectorAll('.eda-experiment-controls input').forEach(el => el.checked = true);
        selectedSubjects = ["S01"]; // 重置为默认值
        document.getElementById("subjectSelect").value = "S01";
        eda_updateChart();
    });

    // ========== Global Mouse Interaction ==========
    const bisect = d3.bisector(d => d.timestamp).left;

    // Merge all experiment data points and sort by time
    const allSortedData = filteredData.sort((a, b) => a.timestamp - b.timestamp);

    edachartArea.on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const chartWidth = eda_width - eda_margin.left - eda_margin.right;
    
        // Boundary check
        if (mouseX < 0 || mouseX > chartWidth) {
            edaVerticalLine.style("opacity", 0);
            edaTimeText.style("opacity", 0);
            edatooltip.style("opacity", 0);
            edachartArea.selectAll(".eda-data-point").style("opacity", 0);
            return;
        }

        // Get current time (based on global data)
        const currentTime = xScale.invert(mouseX);
    
        // Find nearest point in global data
        const index = bisect(allSortedData, currentTime, 1);
        const prevPoint = allSortedData[index - 1];
        const nextPoint = allSortedData[index] || prevPoint;
        const closestGlobal = (currentTime - prevPoint.timestamp) > (nextPoint.timestamp - currentTime) ? nextPoint : prevPoint;

        // Update reference line (based on global nearest point)
        edaVerticalLine
            .attr("x1", xScale(closestGlobal.timestamp))
            .attr("x2", xScale(closestGlobal.timestamp))
            .attr("y1", 0)
            .attr("y2", eda_height - eda_margin.top - eda_margin.bottom)
            .style("opacity", 1);

        // Update time display
        edaTimeText
            .attr("x", xScale(closestGlobal.timestamp) + 10)
            .attr("y", eda_height - eda_margin.bottom - 10)
            .text(d3.timeFormat("%M:%S")(closestGlobal.timestamp))
            .style("opacity", 1);

        // Collect all experiment data
        let tooltipContent = `
            <div class="eda-tooltip-header">Time: ${d3.timeFormat("%M:%S")(closestGlobal.timestamp)}</div>
            <div class="eda-tooltip-row"><strong>Age:</strong> ${closestGlobal.Age}</div>
            <div class="eda-tooltip-row"><strong>Gender:</strong> ${closestGlobal.Gender}</div>
        `;

        let hasData = false;
        experiments.forEach(experiment => {
            const experimentData = filteredData.filter(d => d.Experiment === experiment);
            if (experimentData.length === 0) return;

            const expIndex = bisect(experimentData, closestGlobal.timestamp, 1);
            const expPrev = experimentData[expIndex - 1];
            const expNext = experimentData[expIndex] || expPrev;
            const closest = (closestGlobal.timestamp - expPrev.timestamp) > (expNext.timestamp - closestGlobal.timestamp) ? expNext : expPrev;

            // Update the data point style
            edachartArea.selectAll(`.eda-point-${experiment}`)
                .data([closest])
                .join(
                    enter => enter.append("circle")
                        .attr("class", `eda-data-point eda-point-${experiment}`)
                        .attr("r", 5)
                        .attr("fill", eda_colorMapping[experiment])
                        .attr("cx", xScale(closest.timestamp))
                        .attr("cy", yScale(closest.EDA)),
                    update => update
                        .attr("cx", xScale(closest.timestamp))
                        .attr("cy", yScale(closest.EDA)),
                    exit => exit.remove()
                )
                .style("opacity", 1);

            tooltipContent += `
                <div class="eda-tooltip-row">
                    <span class="eda-color-dot" style="background:${eda_colorMapping[experiment]}"></span>
                    ${experiment}: ${closest.EDA.toFixed(2)} μS
                </div>`;
            hasData = true;
        });

        // Update tooltip
        if (hasData) {
            edatooltip
                .html(tooltipContent)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 28}px`)
                .style("opacity", 0.9);
        }
    }).on("mouseleave", () => {
        edaVerticalLine.style("opacity", 0);
        edaTimeText.style("opacity", 0);
        edatooltip.style("opacity", 0);
        edachartArea.selectAll(".eda-data-point").style("opacity", 0);
    });

    const stats = calculateStats(filteredData);
    updateStatsPanel(stats);
}



