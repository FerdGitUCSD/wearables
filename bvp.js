console.log("✅ bvp.js is running!");

(function() { // Start IIFE (Immediately Invoked Function Expression)

// Set up dimensions
const margin = { top: 50, right: 30, bottom: 70, left: 80 }; // Increased margins for labels
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#bvp-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Axis
const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

// Add X-axis label
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50) // Position below x-axis
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Time (s)");

// Add Y-axis label
svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60) // Position left of y-axis
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Blood Volume Pulse (BVP)");

// Add chart title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20) // Position above graph
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Blood Volume Pulse (BVP) Over Time");

// Tooltip
const tooltip = d3.select("#tooltip-bvp");

// Line generator
const line = d3.line()
    .defined(d => !isNaN(d.time_s) && !isNaN(d.bvp)) // Ignore NaN values
    .x(d => xScale(d.time_s))
    .y(d => yScale(d.bvp));

// Load data and create visualization
d3.csv("data/combined_bvp_f01_f18.csv").then(data => {
    console.log("✅ Data loaded successfully!", data.slice(0, 5)); // Debugging

    // Normalize column names
    const columnNames = Object.keys(data[0]).map(d => d.toLowerCase());
    console.log("✅ CSV Column Names (normalized):", columnNames);

    // Ensure the correct column names exist
    if (!columnNames.includes("relative_time") || !columnNames.includes("bvp") || !columnNames.includes("phase")) {
        console.error("❌ Missing expected columns: 'relative_time', 'bvp', or 'phase'. Found:", columnNames);
        return;
    }

    // Phase Mapping
    const phaseMap = {
        "REAL OPINION": "STRESS",
        "OPPOSITE OPINION": "STRESS",
        "FIRST REST": "AEROBIC",
        "SECOND REST": "ANAEROBIC"
    };

    // Process data
    data.forEach(d => {
        d.time_s = parseFloat(d.relative_time); // Rename 'relative_time' to 'time_s'
        d.bvp = parseFloat(d.bvp); // Ensure BVP is numeric
        d.phase = d.phase ? d.phase.trim().toUpperCase() : ""; // Standardize phase

        // Map phases
        if (phaseMap[d.phase]) {
            d.phase = phaseMap[d.phase];
        }

        if (isNaN(d.time_s) || isNaN(d.bvp)) {
            console.warn("⚠️ Invalid data detected:", d);
        }
    });

    // Remove NaN values
    data = data.filter(d => !isNaN(d.time_s) && !isNaN(d.bvp));

    // Debug: Log unique phases
    const uniquePhases = [...new Set(data.map(d => d.phase))];
    console.log("✅ Updated phase values in dataset:", uniquePhases);

    // Ensure we have valid data
    if (data.length === 0) {
        console.error("❌ No valid data points after filtering!");
        return;
    }

    // Get unique conditions
    const conditions = ["AEROBIC", "ANAEROBIC", "STRESS"];

    // Set domains
    xScale.domain(d3.extent(data, d => d.time_s));
    yScale.domain(d3.extent(data, d => d.bvp));

    // Draw axes
    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));

    // Function to update chart based on selected condition
    function updateChart(condition) {
        console.log("🟢 Updating chart for condition:", condition);

        let filteredData;
        
        if (condition === "all") {
            filteredData = data;
        } else {
            filteredData = data.filter(d => d.phase === condition);
        }

        console.log("🔵 Filtered Data:", filteredData.length, "entries");

        // Remove old lines using D3's enter/update/exit pattern
        const path = svg.selectAll(".bvp-line").data([filteredData]);

        path.exit().remove(); // Remove old paths

        path.enter()
            .append("path")
            .attr("class", `bvp-line ${condition.toLowerCase()}`)
            .merge(path) // Merge enter and update selections
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    console.log("Checking if SVG exists:", d3.select("#bvp-chart").select("svg").node());

    // Initial render
    setTimeout(() => {
        updateChart("all");
    }, 500);

    // Event listener for dropdown
    d3.select("#bvpConditionSelect").on("change", function() {
        updateChart(this.value);
    });

}).catch(error => console.error("Error loading CSV:", error));

})(); // End IIFE
