const edadataUrl = "../data/eda_data.csv";  

// Get the drop-down menu element
const edasubjectSelect = document.getElementById("subjectSelect");
const edaexperimentSelect = document.getElementById("experimentSelect");

// Set the chart size
const eda_width = 800, eda_height = 500, eda_margin = { top: 20, right: 30, bottom: 50, left: 50 };

// Create an SVG canvas
const edasvg = d3.select("#eda-chart")
    .append("svg")
    .attr("width", eda_width)
    .attr("height", eda_height);

// Create a drawing area
const edachartArea = edasvg.append("g")
    .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`);

// Create a Tooltip
const edatooltip = d3.select("body").append("div")
    .attr("class", "edatooltip")
    .style("opacity", 0);

let allEdaData = []; 

d3.csv(edadataUrl).then(data => {
    
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S.%L"); 

    allEdaData = data.map(d => ({
        Subject: d.Subject,  
        Experiment: d.Experiment,
        timestamp: parseTime(d.timestamp), 
        EDA: +d.EDA  
    }));

    // Get all the different subjects
    const subjects = [...new Set(allEdaData.map(d => d.Subject))];

    // Fill in the Subject option
    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        edasubjectSelect.appendChild(option);
    });

   
    edasubjectSelect.addEventListener("change", updateedaChart);
    edaexperimentSelect.addEventListener("change", updateedaChart);
    console.log("Raw data:", data); // 查看原始数据
    updateedaChart();
});


console.log("Parsed timestamps:", allEdaData.map(d => d.timestamp));


function updateedaChart() {
    const selectedSubject = edasubjectSelect.value;
    const selectedExperiment = edaexperimentSelect.value;

    // Filter data
    const filteredData = allEdaData.filter(d => d.Subject === selectedSubject && d.Experiment === selectedExperiment);
    console.log("Selected Subject:", selectedSubject);
    console.log("Selected Experiment:", selectedExperiment);
    console.log("Filtered Data:", filteredData);

    if (filteredData.length === 0) {
        console.error("⚠️ No data available！");
        return;
    }

    // Set X/Y axis scaling
    const xScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.timestamp))
        .range([0, eda_width - eda_margin.left - eda_margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.EDA)])
        .range([eda_height - eda_margin.top - eda_margin.bottom, 0]);

    // Clear the old X-axis and redraw it
    edasvg.selectAll(".x-axis").remove();
    edasvg.append("g")
        .attr("transform", `translate(${eda_margin.left}, ${eda_height - eda_margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S")))
        .attr("class", "x-axis");

    // Clear the old Y-axis and redraw it
    edasvg.selectAll(".y-axis").remove();
    edasvg.append("g")
        .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`)
        .call(d3.axisLeft(yScale))
        .attr("class", "y-axis");

    // Bind data and draw polylines
    const line = d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.EDA));

    const path = edachartArea.selectAll(".line").data([filteredData]);

    path.enter().append("path")
        .attr("class", "line")
        .merge(path)
        .transition().duration(1000)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", line);

    
}
