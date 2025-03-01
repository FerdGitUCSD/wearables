// Chart dimensions
const margin = { top: 30, right: 30, bottom: 120, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Timeline bar height
const timelineHeight = 60;

// Global references
let svgContainers = {}; // Store SVG containers by condition
let allData; // Store all data globally for filtering

// Fixed y-axis range (63 to 140 bpm)
const fixedYMin = 63;
const fixedYMax = 140;

// Animation duration in milliseconds
const animationDuration = 750;

// Protocol definitions
const protocols = {
  "old": "Old Protocol",
  "new": "New Protocol"
};

// Protocol segments by condition and version
const protocolSegments = {
  "STRESS": {
    "old": [
      { name: "Baseline", duration: 180, color: "#A4D16F" },
      { name: "Stroop", duration: 120, color: "#F5B850" },
      { name: "First Rest", duration: 300, color: "#F0914F" },
      { name: "TMCT", duration: 180, color: "#F5B850" },
      { name: "Second Rest", duration: 300, color: "#F0914F" },
      { name: "Real Opinion", duration: 30, color: "#F5B850" },
      { name: "Opposite Opinion", duration: 30, color: "#F5B850" },
      { name: "Subtract Test", duration: 30, color: "#F5B850" }
    ],
    "new": [
      { name: "Baseline", duration: 180, color: "#A4D16F" },
      { name: "TMCT", duration: 180, color: "#F5B850" },
      { name: "First Rest", duration: 600, color: "#F0914F" },
      { name: "Real Opinion", duration: 30, color: "#F5B850" },
      { name: "Opposite Opinion", duration: 30, color: "#F5B850" },
      { name: "Second Rest", duration: 600, color: "#F0914F" },
      { name: "Subtract Test", duration: 30, color: "#F5B850" }
    ]
  },
  "AEROBIC": {
    "old": [
      { name: "Warm up", duration: 180, color: "#F5B850" },
      { name: "60 rpm", duration: 180, color: "#F0914F" },
      { name: "70 rpm", duration: 180, color: "#F0914F" },
      { name: "75 rpm", duration: 180, color: "#F0914F" },
      { name: "80 rpm", duration: 180, color: "#F0914F" },
      { name: "85 rpm", duration: 180, color: "#F0914F" },
      { name: "90 rpm", duration: 180, color: "#F0914F" },
      { name: "95 rpm", duration: 120, color: "#F0914F" },
      { name: "100 rpm", duration: 120, color: "#F0914F" },
      { name: "105 rpm", duration: 120, color: "#F0914F" },
      { name: "110 rpm", duration: 120, color: "#F0914F" },
      { name: "Cool Down", duration: 240, color: "#87CEEB" },
      { name: "Rest", duration: 120, color: "#F7E76D" }
    ],
    "new": [
      { name: "Baseline", duration: 270, color: "#A4D16F" },
      { name: "Warm up", duration: 135, color: "#F5B850" },
      { name: "70 rpm", duration: 90, color: "#F0914F" },
      { name: "75 rpm", duration: 90, color: "#F0914F" },
      { name: "80 rpm", duration: 90, color: "#F0914F" },
      { name: "85 rpm", duration: 675, color: "#F0914F" },
      { name: "90/95 rpm", duration: 270, color: "#F0914F" },
      { name: "Cool Down", duration: 180, color: "#87CEEB" },
      { name: "Rest", duration: 120, color: "#F7E76D" }
    ]
  },
  "ANAEROBIC": {
    "old": [
      { name: "Warm up", duration: 180, color: "#F5B850" },
      { name: "Sprint 1", duration: 30, color: "#F0914F" },
      { name: "Cool Down", duration: 240, color: "#87CEEB" },
      { name: "Sprint 2", duration: 30, color: "#F0914F" },
      { name: "Cool Down", duration: 240, color: "#87CEEB" },
      { name: "Sprint 3", duration: 30, color: "#F0914F" },
      { name: "Cool Down", duration: 240, color: "#87CEEB" },
      { name: "Rest", duration: 120, color: "#F7E76D" }
    ],
    "new": [
      { name: "Baseline", duration: 270, color: "#A4D16F" },
      { name: "Warm up", duration: 270, color: "#F5B850" },
      { name: "Sprint 1", duration: 45, color: "#F0914F" },
      { name: "Cool Down", duration: 255, color: "#87CEEB" },
      { name: "Sprint 2", duration: 45, color: "#F0914F" },
      { name: "Cool Down", duration: 225, color: "#87CEEB" },
      { name: "Sprint 3", duration: 45, color: "#F0914F" },
      { name: "Cool Down", duration: 225, color: "#87CEEB" },
      { name: "Sprint 4", duration: 45, color: "#F0914F" },
      { name: "Cool Down", duration: 225, color: "#87CEEB" },
      { name: "Rest", duration: 120, color: "#F7E76D" }
    ]
  }
};

// Function to check if a participant belongs to old or new protocol
function getProtocol(participant, condition) {
  const id = participant.toLowerCase();
  
  // Extract the participant type (s or f) and number
  const type = id.charAt(0);
  const num = parseInt(id.substring(1), 10);
  
  if (condition === "STRESS") {
    // Stress First version -> S01-S18
    // Stress Second Version -> f01-f18
    if (type === 's' && num >= 1 && num <= 18) {
      return "old"; // All S participants are old protocol
    } else if (type === 'f' && num >= 1 && num <= 18) {
      return "new"; // All F participants are new protocol
    }
  } 
  else if (condition === "AEROBIC") {
    // Aerobic First Version -> S01-S18
    // Aerobic Second Version-> f01-f13
    if (type === 's' && num >= 1 && num <= 18) {
      return "old"; // All S participants are old protocol
    } else if (type === 'f' && num >= 1 && num <= 13) {
      return "new"; // All F participants are new protocol
    }
  }
  else if (condition === "ANAEROBIC") {
    // Anaerobic First Version -> S01-S18
    // Anaerobic Second Version -> f01-f13
    if (type === 's' && num >= 1 && num <= 18) {
      return "old"; // All S participants are old protocol
    } else if (type === 'f' && num >= 1 && num <= 13) {
      return "new"; // All F participants are new protocol
    }
  }
  
  return "unknown"; // Fallback
}

// Function to calculate the total duration of a protocol
function calculateProtocolDuration(segments) {
  return segments.reduce((total, segment) => total + segment.duration, 0);
}

// Function to create individual chart for each condition
function createChartForCondition(condition) {
  // Create container for this condition if it doesn't exist
  if (!document.getElementById(`chart-${condition}`)) {
    const chartDiv = document.createElement("div");
    chartDiv.id = `chart-${condition}`;
    chartDiv.className = "condition-chart";
    document.getElementById("chart").appendChild(chartDiv);
    
    // Add title for this condition
    const titleDiv = document.createElement("h3");
    titleDiv.textContent = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase() + " Condition";
    chartDiv.appendChild(titleDiv);
    
    // Add protocol selector for this condition
    const controlDiv = document.createElement("div");
    controlDiv.className = "condition-control";
    chartDiv.appendChild(controlDiv);
    
    const label = document.createElement("label");
    label.textContent = "Protocol: ";
    label.setAttribute("for", `protocolSelect-${condition}`);
    controlDiv.appendChild(label);
    
    const select = document.createElement("select");
    select.id = `protocolSelect-${condition}`;
    controlDiv.appendChild(select);
    
    // Populate protocol dropdown
    Object.entries(protocols).forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    
    select.value = "old"; // Default to old protocol
    select.addEventListener("change", function() {
      updateChart(allData, condition, this.value);
    });
  }
  
  // Create SVG
  const svg = d3.select(`#chart-${condition}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + timelineHeight);
  
  // Create group for heart rate chart
  const chartGroup = svg.append("g")
    .attr("class", "chart-group")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  // Create group for timeline
  const timelineGroup = svg.append("g")
    .attr("class", "timeline-group")
    .attr("transform", `translate(${margin.left}, ${margin.top + height + 30})`);
  
  // Create scales
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([fixedYMin, fixedYMax])
    .range([height, 0]);
  
  // Create line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.HR));
  
  // Create axis groups
  const xAxisGroup = chartGroup.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0, ${height})`);
  
  const yAxisGroup = chartGroup.append("g")
    .attr("class", "axis axis--y");
  
  // Grid groups
  const xGridGroup = chartGroup.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`);
  
  const yGridGroup = chartGroup.append("g")
    .attr("class", "grid");
  
  // Axis labels
  chartGroup.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(${width / 2}, ${height + 30})`)
    .style("text-anchor", "middle")
    .text("Time (s)");
  
  chartGroup.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Average HR (bpm)");
  
  // Create path for the line
  chartGroup.append("path")
    .attr("class", "red-line")
    .attr("fill", "none")
    .attr("stroke", "#ff6666")
    .attr("stroke-width", 2);
  
  // Store references to SVG elements
  svgContainers[condition] = {
    svg,
    chartGroup,
    timelineGroup,
    xScale,
    yScale,
    xAxisGroup,
    yAxisGroup,
    xGridGroup,
    yGridGroup,
    lineGenerator
  };
}

// Function to draw protocol timeline
function drawTimeline(condition, protocol) {
  const { timelineGroup, xScale } = svgContainers[condition];
  
  // Clear previous timeline
  timelineGroup.selectAll("*").remove();
  
  // Skip if protocol is unknown
  if (protocol === "unknown") return;
  
  // Get protocol segments based on condition and version
  const segments = protocolSegments[condition][protocol];
  
  if (!segments) return;
  
  // Calculate segment positions
  let currentPosition = 0;
  const timelineSegments = segments.map(segment => {
    const start = currentPosition;
    currentPosition += segment.duration;
    return {
      ...segment,
      start,
      end: currentPosition
    };
  });
  
  // Draw segment rectangles
  timelineGroup.selectAll(".segment-rect")
    .data(timelineSegments)
    .enter()
    .append("rect")
    .attr("class", "segment-rect")
    .attr("x", d => xScale(d.start))
    .attr("y", 0)
    .attr("width", d => Math.max(1, xScale(d.end) - xScale(d.start))) // Ensure at least 1px width
    .attr("height", timelineHeight / 2)
    .attr("fill", d => d.color)
    .attr("stroke", "#333")
    .attr("stroke-width", 1);
  
  // Add segment labels
  timelineGroup.selectAll(".segment-label")
    .data(timelineSegments)
    .enter()
    .append("text")
    .attr("class", "segment-label")
    .attr("x", d => xScale(d.start + (d.end - d.start) / 2))
    .attr("y", timelineHeight / 2 + 15)
    .attr("text-anchor", "middle")
    .attr("transform", d => {
      const segmentWidth = xScale(d.end) - xScale(d.start);
      const rotation = segmentWidth < 60 ? -45 : 0; // Rotate narrow labels
      const x = xScale(d.start + (d.end - d.start) / 2);
      const y = timelineHeight / 2 + 15;
      return rotation ? `rotate(${rotation},${x},${y})` : null;
    })
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text(d => d.name);
  
  // Add time markers
  timelineGroup.selectAll(".time-marker")
    .data(timelineSegments)
    .enter()
    .append("text")
    .attr("class", "time-marker")
    .attr("x", d => xScale(d.start + (d.end - d.start) / 2))
    .attr("y", timelineHeight / 2 + 30)
    .attr("text-anchor", "middle")
    .style("font-size", "9px")
    .text(d => {
      const minutes = Math.floor(d.duration / 60);
      const seconds = d.duration % 60;
      return seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}m`;
    });
}

function updateChart(allData, condition, protocol) {
  // Skip if no data
  if (!allData || !condition || !protocol) {
    console.error("Missing required parameters:", { allData: !!allData, condition, protocol });
    return;
  }
  
  // Check if container exists
  if (!svgContainers[condition]) {
    console.error(`SVG container for ${condition} not found`);
    return;
  }
  
  // Get references for this condition
  const {
    svg,
    chartGroup,
    xScale,
    yScale,
    xAxisGroup,
    yAxisGroup,
    xGridGroup,
    yGridGroup,
    lineGenerator
  } = svgContainers[condition];
  
  // Filter data by condition and protocol
  let filtered = allData.filter(d => d.condition === condition);
  
  // Apply protocol filter
  filtered = filtered.filter(d => d.protocol === protocol);
  
  // Check if we have data after filtering
  if (filtered.length === 0) {
    // Display message when no data is available
    chartGroup.select(".red-line").style("opacity", 0);
    chartGroup.selectAll(".no-data-message").remove();
    chartGroup.append("text")
      .attr("class", "no-data-message")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`No data available for ${condition} with ${protocols[protocol]}`);
    return;
  }
  
  // Remove no data message if exists
  chartGroup.selectAll(".no-data-message").remove();
  
  // Group by integer second -> average HR
  const roll = d3.rollup(
    filtered,
    v => d3.mean(v, d => d.HR),
    d => Math.round(d.time_s)
  );
  
  // Convert to array
  let avgData = Array.from(roll, ([time, HR]) => ({ time, HR }));
  avgData.sort((a, b) => a.time - b.time);
  
  // Determine x-axis domain based on data and protocol segments
  const maxDataTime = d3.max(avgData, d => d.time);
  
  // Get relevant segments for timeline
  let maxProtocolTime;
  if (protocol !== "unknown") {
    maxProtocolTime = calculateProtocolDuration(protocolSegments[condition][protocol]);
  } else {
    maxProtocolTime = 0;
  }
  
  // Use the larger of data max time or protocol max time, with some padding
  const maxTime = Math.max(maxDataTime, maxProtocolTime) * 1.05;
  
  // Update x scale domain
  xScale.domain([0, maxTime]);
  
  // Update axes
  xAxisGroup.transition()
    .duration(animationDuration)
    .call(d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => {
        // Format ticks as minutes
        const minutes = Math.floor(d / 60);
        return `${minutes}m`;
      })
    );
  
  yAxisGroup.call(d3.axisLeft(yScale).ticks(10));
  
  // Update grid
  const xGrid = d3.axisBottom(xScale)
    .tickSize(-height)
    .tickFormat('')
    .ticks(10);
  
  const yGrid = d3.axisLeft(yScale)
    .tickSize(-width)
    .tickFormat('')
    .ticks(10);
  
  xGridGroup.call(xGrid);
  yGridGroup.call(yGrid);
  
  // Remove domain lines from grid
  xGridGroup.select(".domain").remove();
  yGridGroup.select(".domain").remove();
  
  // Draw timeline for this condition and protocol
  drawTimeline(condition, protocol);
  
  // Select the line and update it with transition
  chartGroup.select(".red-line")
    .datum(avgData)
    .transition()
    .duration(animationDuration)
    .attr("d", lineGenerator)
    .style("opacity", 1);
  
  // Tooltip
  const tooltip = d3.select("#tooltip");
  
  // Remove old hover elements
  chartGroup.selectAll(".hover-circle").remove();
  
  // Hover circle
  const hoverCircle = chartGroup.append("circle")
    .attr("class", "hover-circle")
    .attr("r", 5)
    .style("fill", "#ff6666")
    .style("stroke", "#333")
    .style("stroke-width", 1)
    .style("opacity", 0);
  
  // Bisector
  const bisect = d3.bisector(d => d.time).left;
  
  // Overlay for capturing mouse events
  chartGroup.selectAll(".overlay-rect").remove();
  chartGroup.append("rect")
    .attr("class", "overlay-rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);
  
  function mousemove(event) {
    const [mx, my] = d3.pointer(event);
    const xVal = xScale.invert(mx);
    
    // Check if we have any data points
    if (avgData.length === 0) return;
    
    const idx = bisect(avgData, xVal);
    
    // Handle edge cases
    if (idx <= 0) {
      showTooltip(avgData[0]);
    } else if (idx >= avgData.length) {
      showTooltip(avgData[avgData.length - 1]);
    } else {
      const d0 = avgData[idx - 1];
      const d1 = avgData[idx];
      
      // Find the closest point
      const dClosest = (xVal - d0.time) < (d1.time - xVal) ? d0 : d1;
      showTooltip(dClosest);
    }
    
    function showTooltip(dataPoint) {
      // Show circle
      hoverCircle
        .style("opacity", 1)
        .attr("cx", xScale(dataPoint.time))
        .attr("cy", yScale(dataPoint.HR));
      
      // Convert seconds to minutes and seconds
      const minutes = Math.floor(dataPoint.time / 60);
      const seconds = Math.floor(dataPoint.time % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Find which protocol segment this time belongs to
      let segmentInfo = "";
      if (protocol !== "unknown") {
        const segments = protocolSegments[condition][protocol];
        
        if (segments) {
          let currentTime = 0;
          for (const segment of segments) {
            const endTime = currentTime + segment.duration;
            if (dataPoint.time >= currentTime && dataPoint.time < endTime) {
              segmentInfo = `<br/><strong>Segment:</strong> ${segment.name}`;
              break;
            }
            currentTime = endTime;
          }
        }
      }
      
      // Update tooltip position to follow mouse
      tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(`
          <strong>Time:</strong> ${timeStr} (min:sec)<br/>
          <strong>Avg HR:</strong> ${dataPoint.HR.toFixed(1)} bpm${segmentInfo}
        `);
    }
  }
  
  function mouseout() {
    hoverCircle.style("opacity", 0);
    tooltip.style("opacity", 0);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Clear the chart container
  document.getElementById("chart").innerHTML = "";
  
  // Hide the global controls as we'll have individual controls per chart
  document.getElementById("controls").style.display = "none";
  
  // Load CSV
  d3.csv("data/combined_HR_data.csv")
    .then(data => {
      console.log("CSV data loaded successfully");
      
      // Store data globally
      allData = data;
      
      // Convert numeric fields
      allData.forEach(d => {
        d.time_s = +d.time_s;
        d.HR = +d.HR;
        // Add protocol property to each data point
        d.protocol = getProtocol(d.participant, d.condition);
      });
      
      console.log("Data processed, protocols assigned");
      
      // Get unique conditions (should be STRESS, AEROBIC, ANAEROBIC)
      const conditions = [...new Set(allData.map(d => d.condition))];
      console.log("Found conditions:", conditions);
      
      // Create a chart for each condition
      conditions.forEach(condition => {
        console.log(`Creating chart for ${condition}`);
        createChartForCondition(condition);
        
        // Update with "old" protocol as default
        setTimeout(() => {
          console.log(`Initializing ${condition} chart with old protocol`);
          updateChart(allData, condition, "old");
        }, 100); // Add small delay between chart updates
      });
    })
    .catch(error => {
      console.error("Error loading data:", error);
      // Display error message on the page
      d3.select("#chart").append("p")
        .attr("class", "error-message")
        .style("color", "red")
        .text("Error loading data. Please check the console for details.");
    });
});