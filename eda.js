// Get the HTML select elements
const edasubjectSelect = document.getElementById("subjectSelect");
const edaexperimentSelect = document.getElementById("experimentSelect");

// Set the SVG canvas size and margins
const eda_width = 800, eda_height = 500, eda_margin = { top: 20, right: 30, bottom: 50, left: 50 };

// Create the SVG canvas
const edasvg = d3.select("#eda-chart")
    .append("svg")
    .attr("width", eda_width)
    .attr("height", eda_height);

// Create the chart area
const edachartArea = edasvg.append("g")
    .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`);

// Create a tooltip (for displaying data on hover)
const edatooltip = d3.select("body").append("div")
    .attr("class", "edatooltip")
    .style("opacity", 0);

let allEdaData = []; // Store all EDA data

const startTime = new Date(2025, 0, 1, 0, 0, 0); // Set the starting time

// Load the CSV data
d3.csv("data/Averaged_EDA_Data.csv").then(data => {
    console.log("✅ Data loaded successfully!", data.slice(0, 5)); // Debugging

    // 转换数据格式
    allEdaData = data.map(d => ({
        Subject: d.Subject,  
        Experiment: d.Experiment,
        timestamp: new Date(startTime.getTime() + (+d.timestamp * 1000)),  // 转换时间戳
        EDA: +d.EDA  // 转换 EDA 为数值
    }));

    console.log("✅ Converted timestamps:", allEdaData.map(d => d.timestamp));

    // 获取唯一的 Subject 并填充下拉框
    const subjects = [...new Set(allEdaData.map(d => d.Subject))];

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        edasubjectSelect.appendChild(option);
    });

    // 绑定事件监听
    edasubjectSelect.addEventListener("change", updateedaChart);
    edaexperimentSelect.addEventListener("change", updateedaChart);

    // 初始更新图表
    updateedaChart();
}).catch(error => console.error("❌ Error loading CSV:", error));


function updateedaChart() {
    const selectedSubject = edasubjectSelect.value;
    const selectedExperiment = edaexperimentSelect.value;

    // Filter data
    const filteredData = allEdaData.filter(d => d.Subject === selectedSubject && d.Experiment === selectedExperiment);

    if (filteredData.length === 0) {
        console.error("⚠️ No data available!");
        edachartArea.selectAll(".line").remove();
        return;
    }

    // Define scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.timestamp))
        .range([0, eda_width - eda_margin.left - eda_margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.EDA)])
        .range([eda_height - eda_margin.top - eda_margin.bottom, 0]);

    // Update axes
    edasvg.selectAll(".x-axis").remove();
    edasvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_height - eda_margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%M:%S")));

    edasvg.selectAll(".y-axis").remove();
    edasvg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`)
        .call(d3.axisLeft(yScale));

    // Remove old line and draw new one
    edachartArea.selectAll(".line").remove();
    edachartArea.append("path")
        .datum(filteredData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", d3.line().x(d => xScale(d.timestamp)).y(d => yScale(d.EDA)));
}
