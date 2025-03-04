const edadataUrl = "/data/Averaged_EDA_Data.csv";  // Path to the CSV data file

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
d3.csv(edadataUrl).then(data => {
    console.log("Raw data:", data);
    console.log("Timestamps:", data.map(d => d.timestamp));

    // Convert data format
    allEdaData = data.map(d => ({
        Subject: d.Subject,  
        Experiment: d.Experiment,
        timestamp: new Date(startTime.getTime() + (+d.timestamp * 1000)),  // Convert timestamps to Date
        EDA: +d.EDA  // Ensure EDA values are numerical
    }));

    console.log("Converted timestamps:", allEdaData.map(d => d.timestamp));

    // Get unique subjects and populate the subject dropdown
    const subjects = [...new Set(allEdaData.map(d => d.Subject))];

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        edasubjectSelect.appendChild(option);
    });

    // Add event listeners for dropdown changes
    edasubjectSelect.addEventListener("change", updateedaChart);
    edaexperimentSelect.addEventListener("change", updateedaChart);

    // Initial chart update
    updateedaChart();
});

// Function to update the chart based on selected subject and experiment
function updateedaChart() {
    const selectedSubject = edasubjectSelect.value;
    const selectedExperiment = edaexperimentSelect.value;

    // Filter data based on selection
    const filteredData = allEdaData.filter(d => d.Subject === selectedSubject && d.Experiment === selectedExperiment);
    
    if (filteredData.length === 0) {
        console.error("⚠️ No data available!");
        return;
    }

    // Define X scale (time-based)
    const xScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.timestamp))
        .range([0, eda_width - eda_margin.left - eda_margin.right]);

    // Define Y scale (EDA values)
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.EDA)])
        .range([eda_height - eda_margin.top - eda_margin.bottom, 0]);

    // Remove existing X-axis and add a new one
    edasvg.selectAll(".x-axis").remove();
    edasvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_height - eda_margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%M:%S")));

    // Remove existing Y-axis and add a new one
    edasvg.selectAll(".y-axis").remove();
    edasvg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${eda_margin.left}, ${eda_margin.top})`)
        .call(d3.axisLeft(yScale));

    // Define the line generator
    const line = d3.line()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d.EDA));

    // Bind data and draw the line
    const path = edachartArea.selectAll(".line").data([filteredData]);

    path.enter().append("path")
        .attr("class", "line")
        .merge(path)
        .transition().duration(1000)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Remove old points and add new ones
    //const points = edachartArea.selectAll(".point").data(filteredData);

    //points.enter()
    //    .append("circle")
    //    .attr("class", "point")
    //    .merge(points)
     //   .attr("cx", d => xScale(d.timestamp))
    //    .attr("cy", d => yScale(d.EDA))
    //    .attr("r", 0.5)  // Point size
    //    .attr("fill", "red");

    //points.exit().remove();  // Remove old points

    // Add X-axis label
    edasvg.selectAll(".x-label").remove();
    edasvg.append("text")
        .attr("class", "x-label")
        .attr("x", eda_width / 2)
        .attr("y", eda_height - 10)  // Position below the X-axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Time (Minutes:Seconds)");

    // Add Y-axis label
    edasvg.selectAll(".y-label").remove();
    edasvg.append("text")
        .attr("class", "y-label")
        .attr("transform", `translate(15, ${eda_height / 2}) rotate(-90)`) 
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("EDA Value (µS)");
}
