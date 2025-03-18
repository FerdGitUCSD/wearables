console.log("✅ bvp.js is running!");

(function() { 

// Set up dimensions
const margin = { top: 50, right: 30, bottom: 70, left: 80 };
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
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Time (s)");

// Add Y-axis label
svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Blood Volume Pulse (BVP)");

// Add chart title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Blood Volume Pulse (BVP) Over Time");

// Create tooltip
const tooltip = d3.select("#bvp-container").append("div")

    .attr("id", "tooltip-bvp")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("z-index", 1000);

// Create mouse tracking area
const mouseArea = svg.append("rect")
    .attr("class", "mouse-area")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

// Line generator
const line = d3.line()
    .defined(d => !isNaN(d.time_s) && !isNaN(d.bvp))
    .x(d => xScale(d.time_s))
    .y(d => yScale(d.bvp));

// Global variables for animation
let isPlaying = false;
let autoPlayInterval;
let currentTime = 0;
let animationSpeed = 100; // ms between frames
let timeStep = 0.5; // How much to increment time each step
let minTime = 0;
let maxTime = 100;
let data = []; // Will store the loaded data
let originalData = []; // Store the original unfiltered data
let currentData = [];  // Store the currently filtered/displayed data


// Load data and create visualization
d3.csv("data/combined_bvp_f01_f18.csv").then(loadedData => {
    console.log("✅ Data loaded successfully!", loadedData.slice(0, 5));

    // Normalize column names
    const columnNames = Object.keys(loadedData[0]).map(d => d.toLowerCase());

    // Ensure correct columns exist
    if (!columnNames.includes("relative_time") || !columnNames.includes("bvp") || !columnNames.includes("phase")) {
        console.error("❌ Missing expected columns: 'relative_time', 'bvp', or 'phase'. Found:", columnNames);
        return;
    }

    // Phase Mapping
    // Complete phase mapping (case-insensitive)
// Complete phase mapping (case-insensitive)
const phaseMap = {
    "real opinion": "STRESS",
    "opposite opinion": "STRESS",
    "first rest": "AEROBIC",
    "second rest": "ANAEROBIC",
    "baseline": "BASELINE",
    "no phase": "OTHER",
    "tmct": "OTHER",
    "subtract test": "STRESS",
    "cool down": "AEROBIC",
    "rest": "AEROBIC",
    "warm up": "AEROBIC",
    "70 rpm": "AEROBIC",
    "75 rpm": "AEROBIC",
    "80 rpm": "AEROBIC",
    "85 rpm": "AEROBIC",
    "90/95 rpm": "AEROBIC",
    "sprint 1": "ANAEROBIC",
    "sprint 2": "ANAEROBIC",
    "sprint 3": "ANAEROBIC",
    "sprint 4": "ANAEROBIC"
};

// Process data with case-insensitive mapping
// In your data processing section:
loadedData.forEach(d => {
    d.time_s = parseFloat(d.relative_time);
    d.bvp = parseFloat(d.bvp);
    
    // Store original phase
    d.original_phase = d.phase ? d.phase.trim() : "";
    
    // Convert to lowercase for mapping
    const lowercasePhase = d.original_phase.toLowerCase();
    
    // Apply phase mapping
    if (phaseMap[lowercasePhase]) {
        d.phase = phaseMap[lowercasePhase].toUpperCase();
    } else {
        d.phase = "OTHER";
    }
});

// Debug log to verify phase mapping
// After this line in your bvp.js file:
// Remove NaN values and assign to global data variable
originalData = loadedData.filter(d => !isNaN(d.time_s) && !isNaN(d.bvp));
data = [...originalData]; // Make a copy of the original data
console.log("✅ Updated phase values in dataset:", [...new Set(data.map(d => d.phase))]);

// Add your dropdown generation code here:
// Update the dropdowns to match your actual phases
const uniquePhases = ["AEROBIC", "ANAEROBIC", "STRESS"];
const conditionSelect = d3.select("#bvpConditionSelect");

// Clear existing options
conditionSelect.selectAll("option").remove();

// Add options for each unique phase
uniquePhases.forEach(phase => {
    conditionSelect.append("option")
        .attr("value", phase)
        .text(phase);
});

    // Find min and max time values
    minTime = d3.min(data, d => d.time_s);
    maxTime = d3.max(data, d => d.time_s);

    // Set domains
    xScale.domain([minTime, maxTime]);
    yScale.domain(d3.extent(data, d => d.bvp));

    // Draw axes
    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));

    // Select the slider and set limits
    const timeSlider = d3.select("#time-slider")
        .attr("min", minTime)
        .attr("max", maxTime)
        .attr("value", minTime);

    // Tooltip
    const tooltip = d3.select("#tooltip-bvp");

    // Helper function to get color for phase - add this near the beginning of your script
    function getPhaseColor(phase) {
        const phaseUpperCase = phase.toUpperCase();
        if (phaseUpperCase === "AEROBIC") return "#0066ff";  // Blue
        if (phaseUpperCase === "ANAEROBIC") return "#ff3333"; // Red
        if (phaseUpperCase === "STRESS") return "#00cc66";    // Green
        if (phaseUpperCase === "BASELINE") return "#9966cc";  // Purple
        if (phaseUpperCase === "OTHER") return "#666666";     // Gray
        return "#666666"; // Default gray for unknown
    } 

// Unified tooltip handler
// Update tooltip function to show BVP value, time, and arousal phase
function setupTooltipHandlers() {
    // Remove previous event listeners to prevent duplication
    mouseArea.on("mousemove", null).on("mouseout", null);

    mouseArea.on("mousemove", function(event) {
        if (isPlaying) return;  // 🔴 Stop tooltip during animation

        const [mouseX] = d3.pointer(event);
        const hoveredTime = xScale.invert(mouseX);

        // Find the closest actual data point
        const filteredData = data.filter(d => d.time_s <= hoveredTime);
        if (filteredData.length === 0) return;

        const closestPoint = filteredData.reduce((prev, curr) =>
            Math.abs(curr.time_s - hoveredTime) < Math.abs(prev.time_s - hoveredTime) ? curr : prev
        );

        if (!closestPoint) return;

        console.log("✅ Tooltip should show:", closestPoint);

        // Get the bounding box of the chart container
        const container = document.getElementById("bvp-container").getBoundingClientRect();

        // Adjust position relative to the chart
        const tooltipX = Math.min(event.clientX - container.left + 20, container.width - 250);
        const tooltipY = Math.min(event.clientY - container.top + 20, container.height - 100);

        tooltip
            .style("opacity", 1)
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`)
            .html(`
                <div style="font-weight: bold; margin-bottom: 8px;">
                    BVP Data Point
                </div>
                <div><strong>Time:</strong> ${closestPoint.time_s.toFixed(2)}s</div>
                <div><strong>BVP Value:</strong> ${closestPoint.bvp.toFixed(3)}</div>
                <div><strong>Activity Phase:</strong> <span style="color:#ff3333; font-weight: bold;">${closestPoint.phase}</span></div>
            `);
    })
    .on("mouseout", function() {
        if (!isPlaying) {
            tooltip.style("opacity", 0);  // Hide tooltip when leaving
        }
    });
}



    function addTrendLine(data) {
        // Remove any existing trendline
        svg.selectAll(".trend-line").remove();
        
        if (data.length < 2) return; // Need at least 2 points
        
        // Simple linear regression for trendline
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        let n = data.length;
        
        data.forEach(d => {
            sumX += d.time_s;
            sumY += d.bvp;
            sumXY += d.time_s * d.bvp;
            sumX2 += d.time_s * d.time_s;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Create trendline data
        const timeExtent = d3.extent(data, d => d.time_s);
        const trendData = [
            { time_s: timeExtent[0], bvp: slope * timeExtent[0] + intercept },
            { time_s: timeExtent[1], bvp: slope * timeExtent[1] + intercept }
        ];
        
        // Draw the trendline
        svg.append("path")
            .datum(trendData)
            .attr("class", "trend-line")
            .attr("fill", "none")
            .attr("stroke", "#ff6600")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6,3")
            .attr("d", d3.line()
                .x(d => xScale(d.time_s))
                .y(d => yScale(d.bvp))
            );
        
        // Add trendline label
        svg.append("text")
            .attr("class", "trend-line")
            .attr("x", xScale(timeExtent[1]) - 120)
            .attr("y", yScale(trendData[1].bvp) - 10)
            .attr("fill", "#ff6600")
            .attr("font-weight", "bold")
            .attr("font-size", "12px")
            .text(`Trend: ${slope > 0 ? "Rising" : "Falling"} (${slope.toFixed(4)})`);
        
        // Return the trend data for statistics
        return { slope, intercept };
    }
    
    // Create statistics panel in HTML
    
    // Attach event listeners to the BVP line
    // Predict future stress levels using simple moving average with trend detection
function predictStress(windowSize = 20, predictionSteps = 10) {
    // Get the most recent data points
    const recentData = data.filter(d => d.time_s <= currentTime)
                          .slice(-windowSize);
    
    if (recentData.length < windowSize/2) {
        console.log("Not enough data for prediction");
        d3.select("#stress-prediction")
          .html("Stress Prediction: Not enough data")
          .style("color", "gray");
        return;
    }
    
    // Calculate moving average
    const movingAvg = d3.mean(recentData, d => d.bvp);
    
    // Calculate trend (simple linear regression)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recentData.forEach((d, i) => {
        sumX += i;
        sumY += d.bvp;
        sumXY += i * d.bvp;
        sumX2 += i * i;
    });
    
    const n = recentData.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const lastTime = recentData[recentData.length - 1].time_s;
    const predictions = [];
    const timeStep = 0.5; // 0.5 second increment
    
    for (let i = 1; i <= predictionSteps; i++) {
        const predictedTime = lastTime + i * timeStep;
        const predictedValue = intercept + slope * (n + i - 1);
        
        // Add some randomness based on recent volatility
        const volatility = d3.deviation(recentData, d => d.bvp) || 0.05;
        const noise = (Math.random() - 0.5) * volatility * 0.5; // Reduced randomness by half
        
        predictions.push({
            time_s: predictedTime,
            bvp: predictedValue + noise,
            isPrediction: true
        });
    }
    
    // Display predictions on chart
    visualizePredictions(predictions);
    
    // Calculate stress probability
    const stressThreshold = 0.7; // Adjust based on your data
    let stressPoints = predictions.filter(p => p.bvp > stressThreshold).length;
    const stressProbability = stressPoints / predictions.length;
    
    // Update stress prediction display with clearer formatting
    d3.select("#stress-prediction")
      .html(`<strong>Stress Prediction:</strong> <span style="font-size: 16px;">${(stressProbability * 100).toFixed(0)}%</span> 
             chance of stress in next ${(predictionSteps * timeStep).toFixed(1)}s`)
      .style("color", stressProbability > 0.5 ? "#cc0000" : 
                     (stressProbability > 0.25 ? "#ff9900" : "#009900"))
      .style("background-color", "#f8f8f8")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("border-left", stressProbability > 0.5 ? "4px solid #cc0000" : 
                           (stressProbability > 0.25 ? "4px solid #ff9900" : "4px solid #009900"));
    
    return predictions;
}

function removeStatisticsPanel() {
  d3.select("#stats-panel").remove();
}

// Create an enhanced tooltip for the BVP chart
function createEnhancedTooltip() {
  // Remove any existing tooltip
  d3.select("#tooltip-bvp").remove();
  
  // Create a new tooltip
  const tooltip = d3.select("#bvp-container").append("div")

    .attr("id", "tooltip-bvp")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("padding", "12px 15px")
    .style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.15)")
    .style("pointer-events", "none")
    .style("font-size", "13px")
    .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif")
    .style("transition", "opacity 0.2s ease-in-out")
    .style("z-index", "1000")
    .style("max-width", "250px");
  
  return tooltip;
}

// Enhance the mouseover tooltip handler
function enhanceTooltipHandlers() {
  // Add this event listener to the chart area
  svg.select(".mouse-hover-area").remove();
  
  svg.append("rect")
    .attr("class", "mouse-hover-area")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", function(event) {
      const [mouseX] = d3.pointer(event);
      const hoveredTime = xScale.invert(mouseX);

      // Check if we're hovering over actual data or prediction
      const isPrediction = predictions && predictions.length > 0 && 
                          hoveredTime > predictions[0].time_s;
      
      if (isPrediction) {
        // Find the closest prediction point
        const closestPoint = predictions.reduce((prev, curr) =>
          Math.abs(curr.time_s - hoveredTime) < Math.abs(prev.time_s - hoveredTime) ? curr : prev
        );
        
        // Determine if point is a peak or valley
        const pointStatus = determinePeakOrValley(closestPoint, predictions);
        
        // Show prediction tooltip
        d3.select("#tooltip-bvp")
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid purple; padding-bottom: 5px;">
              BVP Prediction
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Time:</strong></span>
              <span>${closestPoint.time_s.toFixed(2)}s</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>BVP Value:</strong></span>
              <span>${closestPoint.bvp.toFixed(3)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Status:</strong></span>
              <span>${pointStatus}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 5px; margin-top: 5px;">
              <span><strong>Estimated Phase:</strong></span>
              <span style="font-weight: bold; color: ${closestPoint.bvp > 0.7 ? '#ff3333' : '#0066ff'}">
                ${closestPoint.bvp > 0.7 ? 'Potential Stress' : 'Normal Activity'}
              </span>
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
          
        // Highlight the prediction point
        highlightPoint(closestPoint, true);
      } else {
        // Find the closest actual data point
        const closestPoint = data.filter(d => d.time_s <= currentTime).reduce((prev, curr) =>
          Math.abs(curr.time_s - hoveredTime) < Math.abs(prev.time_s - hoveredTime) ? curr : prev
        );
        
        // Determine if point is a peak or valley
        const pointStatus = determinePeakOrValley(closestPoint, data.filter(d => d.time_s <= currentTime));
        
        // Get phase with proper formatting
        const phase = closestPoint.phase || "Unknown";
        const phaseColor = getPhaseColor(phase);
        
        // Show regular data tooltip
        d3.select("#tooltip-bvp")
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid ${phaseColor}; padding-bottom: 5px;">
              BVP Data Point
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Time:</strong></span>
              <span>${closestPoint.time_s.toFixed(2)}s</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>BVP Value:</strong></span>
              <span>${closestPoint.bvp.toFixed(3)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Status:</strong></span>
              <span>${pointStatus}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 5px; margin-top: 5px;">
              <span><strong>Phase:</strong></span>
              <span style="font-weight: bold; color: ${phaseColor};">${phase}</span>
            </div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
          
        // Highlight the data point
        highlightPoint(closestPoint, false);
      }
    })
    .on("mouseout", function() {
      // Hide tooltip
      d3.select("#tooltip-bvp").style("opacity", 0);
      
      // Remove point highlights
      svg.selectAll(".highlight-point").remove();
    });
}

// Function to determine if a point is a peak, valley, or neither
function determinePeakOrValley(point, dataArray) {
  const index = dataArray.findIndex(d => d.time_s === point.time_s);
  
  // Need points before and after to determine peak/valley
  if (index <= 0 || index >= dataArray.length - 1) {
    return "Normal";
  }
  
  const prevPoint = dataArray[index - 1];
  const nextPoint = dataArray[index + 1];
  
  // Check for peak
  if (point.bvp > prevPoint.bvp && point.bvp > nextPoint.bvp) {
    return "Peak";
  }
  
  // Check for valley
  if (point.bvp < prevPoint.bvp && point.bvp < nextPoint.bvp) {
    return "Valley";
  }
  
  return "Normal";
}

// Function to highlight a specific point on the chart
function highlightPoint(point, isPrediction) {
  // Remove any existing highlight
  svg.selectAll(".highlight-point").remove();
  
  // Add a highlight circle
  svg.append("circle")
    .attr("class", "highlight-point")
    .attr("cx", xScale(point.time_s))
    .attr("cy", yScale(point.bvp))
    .attr("r", 6)
    .attr("fill", isPrediction ? "purple" : getPhaseColor(point.phase))
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("pointer-events", "none")
    .style("opacity", 0.8);
}


// Visualize the predictions on the chart with improved readability

function visualizePredictions(predictions) {
    // Store predictions globally so tooltip can access them
    window.predictions = predictions;
    
    // Remove old predictions
    svg.selectAll(".prediction-line").remove();
    svg.selectAll(".prediction-point").remove();
    svg.selectAll(".prediction-label").remove();
    svg.selectAll(".prediction-interval").remove();
    
    // Add predicted line with gradient color
    const predictionLine = d3.line()
        .defined(d => !isNaN(d.time_s) && !isNaN(d.bvp))
        .x(d => xScale(d.time_s))
        .y(d => yScale(d.bvp))
        .curve(d3.curveCatmullRom);
    
    // Create gradient for prediction line
    const gradient = svg.append("linearGradient")
        .attr("id", "prediction-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", xScale(predictions[0].time_s))
        .attr("x2", xScale(predictions[predictions.length-1].time_s));
        
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "steelblue");
        
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "purple");
    
    // Add prediction line
    svg.append("path")
        .datum(predictions)
        .attr("class", "prediction-line")
        .attr("fill", "none")
        .attr("stroke", "url(#prediction-gradient)")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5,5")
        .attr("d", predictionLine);
    
    // Add confidence interval (shaded area)
    const volatility = d3.deviation(predictions, d => d.bvp) || 0.05;
    const areaGenerator = d3.area()
        .x(d => xScale(d.time_s))
        .y0(d => yScale(d.bvp - volatility))
        .y1(d => yScale(d.bvp + volatility))
        .curve(d3.curveCatmullRom);
        
    svg.append("path")
        .datum(predictions)
        .attr("class", "prediction-interval")
        .attr("fill", "rgba(128, 0, 128, 0.1)")
        .attr("d", areaGenerator);
    
    // Add key prediction points
    const keyPoints = [
        predictions[0],
        predictions[Math.floor(predictions.length / 2)],
        predictions[predictions.length - 1]
    ];
    
    svg.selectAll(".prediction-key-point")
        .data(keyPoints)
        .enter()
        .append("circle")
        .attr("class", "prediction-point")
        .attr("cx", d => xScale(d.time_s))
        .attr("cy", d => yScale(d.bvp))
        .attr("r", 5)
        .attr("fill", (d, i) => i === 0 ? "steelblue" : (i === 1 ? "mediumpurple" : "purple"))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9);
    
    // Add label to the last prediction point
    svg.append("text")
        .attr("class", "prediction-label")
        .attr("x", xScale(predictions[predictions.length - 1].time_s) + 8)
        .attr("y", yScale(predictions[predictions.length - 1].bvp) - 8)
        .text("Predicted")
        .attr("fill", "purple")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
} 


    // Initial render with empty data
    svg.append("path")
        .attr("class", "bvp-line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Toggle animation function
    function toggleAnimation() {
        if (isPlaying) {
            pauseAnimation();
        } else {
            startAnimation();
        }
    }

    // Start animation function
  // Start animation function
  function startAnimation() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(autoPlay, animationSpeed);
    d3.select("#play-pause-btn").text("Pause");
    isPlaying = true;

    // 🔴 Hide tooltip when animation starts
    tooltip.style("opacity", 0);
}

function pauseAnimation() {
    clearInterval(autoPlayInterval);
    d3.select("#play-pause-btn").text("Play");
    isPlaying = false;

    // ✅ Allow tooltip to show again when hovering
    mouseArea.on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const hoveredTime = xScale.invert(mouseX);

        const closestPoint = data.reduce((prev, curr) =>
            Math.abs(curr.time_s - hoveredTime) < Math.abs(prev.time_s - hoveredTime) ? curr : prev
        );

        if (!closestPoint) return;

        console.log("✅ Tooltip should show:", closestPoint);

        // Get the bounding box of the chart container
        const container = document.getElementById("bvp-container").getBoundingClientRect();

        // Adjust position relative to the chart
        const tooltipX = Math.min(event.clientX - container.left + 20, container.width - 250);
        const tooltipY = Math.min(event.clientY - container.top + 20, container.height - 100);

        tooltip
            .style("opacity", 1)
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`)
            .html(`
                <div style="font-weight: bold; margin-bottom: 8px;">
                    BVP Data Point
                </div>
                <div><strong>Time:</strong> ${closestPoint.time_s.toFixed(2)}s</div>
                <div><strong>BVP Value:</strong> ${closestPoint.bvp.toFixed(3)}</div>
                <div><strong>Arousal Phase:</strong> <span style="color:#ff3333; font-weight: bold;">${closestPoint.phase}</span></div>
            `);
    });
}


    // Auto-play function with smoother transitions
    function autoPlay() {
        if (currentTime < maxTime) {
            currentTime += timeStep;
            
            // Update chart without transition for smoother animation
            updateChartForTimeNoTransition(currentTime);
            
            // Update slider position (without triggering its event)
            timeSlider.property("value", currentTime);
            
            // Get filtered data and update trend line
            const filteredData = data.filter(d => d.time_s <= currentTime);
            if (filteredData.length > 5) {
                updateTrendLineOnly(filteredData);
            }
        } else {
            pauseAnimation();
            currentTime = minTime; // Reset to beginning
        }
    }

    // Update chart based on time
    function updateChartForTime(selectedTime, withTransition = true) {
        currentTime = parseFloat(selectedTime);
        const filteredData = data.filter(d => d.time_s <= currentTime);
        
        // Update domain dynamically
        xScale.domain([minTime, Math.max(currentTime, minTime + 5)]); // At least show 5s window
        
        if (withTransition) {
            xAxis.transition().duration(300).call(d3.axisBottom(xScale));
            
            svg.select(".bvp-line")
                .datum(filteredData)
                .transition()
                .duration(300)
                .attr("d", line);
        } else {
            xAxis.call(d3.axisBottom(xScale));
            updateTrendLineOnly(data);
            
            svg.select(".bvp-line")
                .datum(filteredData)
                .attr("d", line);
        }
        
        // Update time display
        d3.select("#time-display").text(`Current Time: ${currentTime.toFixed(2)}s`);
        updateStatistics(filteredData.slice(0, Math.min(100, filteredData.length)));

    }

    // No transition version for smoother animation
    function updateChartForTimeNoTransition(selectedTime) {
        currentTime = parseFloat(selectedTime);
        const filteredData = data.filter(d => d.time_s <= currentTime);
        
        // Update domain dynamically
        xScale.domain([minTime, Math.max(currentTime, minTime + 5)]); // At least show 5s window
        
        // Update axes without transition
        xAxis.call(d3.axisBottom(xScale));
        
        // Update data line
        svg.select(".bvp-line")
            .datum(filteredData)
            .attr("d", line);
        
        // Update time display
        d3.select("#time-display").text(`Current Time: ${currentTime.toFixed(2)}s`);
        
        // Get the last N points for a moving trend line (more responsive to recent changes)
        const lastNPoints = Math.min(30, filteredData.length);
        const recentData = filteredData.slice(-lastNPoints);

        // Always update trend line if we have enough data points
        if (recentData.length >= 2) {
        // Update trend line only (without full statistics panel refresh for performance)
            updateTrendLineOnly(recentData);
        }
    }
    function updateTrendLineOnly(data) {
        // Remove any existing trendline
        svg.selectAll(".trend-line").remove();
        
        if (data.length < 2) return; // Need at least 2 points
        
        // Simple linear regression for trendline
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        let n = data.length;
        
        data.forEach(d => {
            sumX += d.time_s;
            sumY += d.bvp;
            sumXY += d.time_s * d.bvp;
            sumX2 += d.time_s * d.time_s;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Create trendline data
        const timeExtent = d3.extent(data, d => d.time_s);
        
        // For animation smoothness, extend the trend line a bit beyond current data
        // but keep it within the visible area
        const visibleMax = xScale.domain()[1];
        const extendedMax = Math.min(timeExtent[1] + 2, visibleMax);
        
        const trendData = [
            { time_s: timeExtent[0], bvp: slope * timeExtent[0] + intercept },
            { time_s: extendedMax, bvp: slope * extendedMax + intercept }
        ];
        
        // Draw the trendline
        svg.append("path")
            .datum(trendData)
            .attr("class", "trend-line")
            .attr("fill", "none")
            .attr("stroke", "#ff6600")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6,3")
            .attr("d", d3.line()
                .x(d => xScale(d.time_s))
                .y(d => yScale(d.bvp))
            );
        
        // Add trendline label
        const labelX = xScale(trendData[1].time_s) - 120;
        const labelY = yScale(trendData[1].bvp) - 10;
        
        // Only add label if it's within the visible area
        if (labelX > 0 && labelX < width && labelY > 0 && labelY < height) {
            svg.append("text")
                .attr("class", "trend-line")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("fill", "#ff6600")
                .attr("font-weight", "bold")
                .attr("font-size", "12px")
                .text(`Trend: ${slope > 0 ? "Rising" : "Falling"} (${slope.toFixed(4)})`);
        }
        
        // Update trend value in stats panel if it exists
        const trendCell = d3.select("#stats-panel").select("tr:nth-child(9) td:nth-child(2)");
        if (!trendCell.empty()) {
            trendCell
                .style("color", slope > 0 ? "#00aa44" : "#dd4444")
                .style("font-weight", "bold")
                .text(`${slope.toFixed(4)} ${slope > 0 ? "↗" : "↘"}`);
        }
        
        return { slope, intercept };
    }
        

    // Function to update chart based on condition
    // Modified updateChart function to fix the blank chart issue
    function updateChart(condition) {
        console.log(`⚠️ Chart updating for condition: "${condition}"`);
        
        // Start from the original complete dataset
        let filteredData;
        
        // Since there's no "all" option anymore, directly filter by condition
        filteredData = originalData.filter(d => {
            if (!d.phase) return false;
            
            // Case-insensitive exact match for our target conditions
            return d.phase.toUpperCase() === condition.toUpperCase();
        });
        
        // Debug log
        console.log(`Filtered data for condition "${condition}": ${filteredData.length} points`);
        
        if (filteredData.length === 0) {
            console.error(`❌ No data found for condition: ${condition}`);
            alert(`No data found for condition: ${condition}. Check console for details.`);
            return;
        }
        
        // Update domains
        xScale.domain(d3.extent(filteredData, d => d.time_s));
        yScale.domain(d3.extent(filteredData, d => d.bvp));
        
        // Update axes
        xAxis.transition().duration(500).call(d3.axisBottom(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft(yScale));
        
        // Update line class for proper styling - add the condition class
        svg.select(".bvp-line")
            .attr("class", `bvp-line ${condition.toLowerCase()}`);
        
        // Update line data
        svg.select(".bvp-line")
            .datum(filteredData)
            .transition()
            .duration(500)
            .attr("d", line);
        
        // Reset animation state
        currentTime = minTime = d3.min(filteredData, d => d.time_s);
        maxTime = d3.max(filteredData, d => d.time_s);
        
        // Update slider with new range
        const timeSlider = d3.select("#time-slider")
            .attr("min", minTime)
            .attr("max", maxTime)
            .property("value", currentTime);
        
        pauseAnimation();
        
        // Use the filtered data for current visualization
        data = filteredData;
        
        // Reset any predictions
        svg.selectAll(".prediction-line").remove();
        svg.selectAll(".prediction-point").remove();
        svg.selectAll(".prediction-interval").remove();
        svg.selectAll(".prediction-label").remove();
        d3.select("#stress-prediction").html("Stress Prediction: N/A");
        
        // Update statistics panel with initial data
        const initialData = filteredData.filter(d => d.time_s <= minTime + 5);
        updateStatistics(initialData);
        
        // Update time display
        d3.select("#time-display").text(`Current Time: ${currentTime.toFixed(2)}s`);
        
        // Update trend line with the filtered data
        if (filteredData.length >= 2) {
            updateTrendLineOnly(filteredData);
        }
    }

    function updateStatistics(filteredData) {
    // Intentionally empty
    }
    // Predict future stress levels using simple moving average with trend detection
    // Predict future stress levels using simple moving average with trend detection
function predictStress(windowSize = 20, predictionSteps = 10) {
    // Get the most recent data points
    const recentData = data.filter(d => d.time_s <= currentTime)
                          .slice(-windowSize);
    
    if (recentData.length < windowSize/2) {
        console.log("Not enough data for prediction");
        d3.select("#stress-prediction")
          .html("Stress Prediction: Not enough data")
          .style("color", "gray");
        return;
    }
    
    // Calculate moving average
    const movingAvg = d3.mean(recentData, d => d.bvp);
    
    // Calculate trend (simple linear regression)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    recentData.forEach((d, i) => {
        sumX += i;
        sumY += d.bvp;
        sumXY += i * d.bvp;
        sumX2 += i * i;
    });
    
    const n = recentData.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const lastTime = recentData[recentData.length - 1].time_s;
    const predictions = [];
    const timeStep = 0.5; // 0.5 second increment
    
    for (let i = 1; i <= predictionSteps; i++) {
        const predictedTime = lastTime + i * timeStep;
        const predictedValue = intercept + slope * (n + i - 1);
        
        // Add some randomness based on recent volatility
        const volatility = d3.deviation(recentData, d => d.bvp) || 0.05;
        const noise = (Math.random() - 0.5) * volatility * 0.5; // Reduced randomness by half
        
        predictions.push({
            time_s: predictedTime,
            bvp: predictedValue + noise,
            isPrediction: true
        });
    }
    
    // Display predictions on chart
    visualizePredictions(predictions);
    
    // Calculate stress probability
    const stressThreshold = 0.7; // Adjust based on your data
    let stressPoints = predictions.filter(p => p.bvp > stressThreshold).length;
    const stressProbability = stressPoints / predictions.length;
    
    // Update stress prediction display with clearer formatting
    d3.select("#stress-prediction")
      .html(`<strong>Stress Prediction:</strong> <span style="font-size: 16px;">${(stressProbability * 100).toFixed(0)}%</span> 
             chance of stress in next ${(predictionSteps * timeStep).toFixed(1)}s`)
      .style("color", stressProbability > 0.5 ? "#cc0000" : 
                     (stressProbability > 0.25 ? "#ff9900" : "#009900"))
      .style("background-color", "#f8f8f8")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("border-left", stressProbability > 0.5 ? "4px solid #cc0000" : 
                           (stressProbability > 0.25 ? "4px solid #ff9900" : "4px solid #009900"));
    
    return predictions;
}

// Visualize the predictions on the chart with improved readability
function visualizePredictions(predictions) {
    // Remove old predictions
    svg.selectAll(".prediction-line").remove();
    svg.selectAll(".prediction-point").remove();
    svg.selectAll(".prediction-label").remove();
    
    // Add predicted line with gradient color
    const predictionLine = d3.line()
        .defined(d => !isNaN(d.time_s) && !isNaN(d.bvp))
        .x(d => xScale(d.time_s))
        .y(d => yScale(d.bvp))
        .curve(d3.curveCatmullRom); // Smoother curve
    
    // Create gradient for prediction line
    const gradient = svg.append("linearGradient")
        .attr("id", "prediction-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", xScale(predictions[0].time_s))
        .attr("x2", xScale(predictions[predictions.length-1].time_s));
        
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "steelblue");
        
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "purple");
    
    // Add prediction line
    svg.append("path")
        .datum(predictions)
        .attr("class", "prediction-line")
        .attr("fill", "none")
        .attr("stroke", "url(#prediction-gradient)")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5,5")
        .attr("d", predictionLine);
    
    // Add confidence interval (shaded area)
    const volatility = d3.deviation(predictions, d => d.bvp) || 0.05;
    const areaGenerator = d3.area()
        .x(d => xScale(d.time_s))
        .y0(d => yScale(d.bvp - volatility))
        .y1(d => yScale(d.bvp + volatility))
        .curve(d3.curveCatmullRom);
        
    svg.append("path")
        .datum(predictions)
        .attr("class", "prediction-interval")
        .attr("fill", "rgba(128, 0, 128, 0.1)")
        .attr("d", areaGenerator);
    
    // Add key prediction points with labels
    const keyPoints = [
        predictions[0],                                      // First point
        predictions[Math.floor(predictions.length / 2)],     // Middle point
        predictions[predictions.length - 1]                  // Last point
    ];
    
    // Add key prediction points with improved visualization
    svg.selectAll(".prediction-key-point")
        .data(keyPoints)
        .enter()
        .append("circle")
        .attr("class", "prediction-point")
        .attr("cx", d => xScale(d.time_s))
        .attr("cy", d => yScale(d.bvp))
        .attr("r", 5)
        .attr("fill", (d, i) => i === 0 ? "steelblue" : (i === 1 ? "mediumpurple" : "purple"))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9);
    
    // Add label to the last prediction point
    svg.append("text")
        .attr("class", "prediction-label")
        .attr("x", xScale(predictions[predictions.length - 1].time_s) + 8)
        .attr("y", yScale(predictions[predictions.length - 1].bvp) - 8)
        .text("Predicted")
        .attr("fill", "purple")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
    
    // Add transparent event catcher for tooltips
    svg.append("rect")
        .attr("class", "prediction-overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const hoveredTime = xScale.invert(mouseX);
            
            // Find if we're in the prediction area
            if (hoveredTime > predictions[0].time_s) {
                // Find the closest prediction point
                const closestPoint = predictions.reduce((prev, curr) =>
                    Math.abs(curr.time_s - hoveredTime) < Math.abs(prev.time_s - hoveredTime) ? curr : prev
                );
                
                // Show tooltip
                d3.select("#tooltip-bvp")
                    .style("opacity", 1)
                    .html(`<strong>Prediction</strong><br>Time: ${closestPoint.time_s.toFixed(2)}s<br>BVP: ${closestPoint.bvp.toFixed(2)}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
                    .style("background-color", "rgba(128, 0, 128, 0.8)")
                    .style("color", "white");
            }
        })
        .on("mouseout", () => d3.select("#tooltip-bvp").style("opacity", 0));
}

    // Setup speed slider if it exists
    // Setup speed slider with better scaling
const speedSlider = d3.select("#speed-slider");
if (!speedSlider.empty()) {
    speedSlider.on("input", function() {
        const sliderValue = parseInt(this.value);
        // Create a more intuitive mapping: higher value = faster animation (lower delay)
        animationSpeed = 500 - (sliderValue * 5);
        if (animationSpeed < 10) animationSpeed = 10; // Prevent too fast animation
        
        // Update display if it exists
        const speedDisplay = d3.select("#speed-value");
        if (!speedDisplay.empty()) {
            speedDisplay.text(`${Math.round((sliderValue/100) * 100)}%`);
        }
        
        if (isPlaying) {
            // Restart with new speed (clear and restart interval)
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(autoPlay, animationSpeed);
        }
    });
}

    // Setup reset button if it exists
    const resetBtn = d3.select("#reset-btn");
    if (!resetBtn.empty()) {
        // Update the reset button handler);
        resetBtn.on("click", function() {
    // Reset current time
    currentTime = minTime;
    timeSlider.property("value", currentTime);
    
    // Clear ALL visualization elements
    svg.selectAll(".trend-line").remove();
    svg.selectAll(".prediction-line").remove();
    svg.selectAll(".prediction-point").remove();
    svg.selectAll(".prediction-interval").remove();
    svg.selectAll(".prediction-label").remove();
    svg.selectAll(".highlight-point").remove();
    
    // Reset predictions
    window.predictions = null;
    
    // Clear stress prediction
    d3.select("#stress-prediction").html("Stress Prediction: N/A");
    
    // Update the chart with minimal data
    const filteredData = data.filter(d => d.time_s <= minTime);
    
    // Update domain dynamically
    xScale.domain([minTime, minTime + 5]); // Show 5s window
    xAxis.call(d3.axisBottom(xScale));
    
    // Update data line
    svg.select(".bvp-line")
        .datum(filteredData)
        .attr("d", line);
    
    // Update time display
    d3.select("#time-display").text(`Current Time: ${minTime.toFixed(2)}s`);
    
    // Stop animation
    pauseAnimation();
});
    }

    // Setup predict button if it exists
    const predictBtn = d3.select("#predict-btn");
    if (!predictBtn.empty()) {
        predictBtn.on("click", function() {
            predictStress();
        });
    }

    // Add condition toggle button
// Add condition toggle buttons
const controlPanel = d3.select(".control-panel") || d3.select("#control-panel");
if (!controlPanel.empty()) {
    // Create a button container
    const buttonContainer = controlPanel.append("div")
        .attr("class", "control-row")
        .style("margin-top", "10px");
    
    // Add label
    buttonContainer.append("label")
        .text("Activity Type:")
        .style("margin-right", "10px");
    
    // Add a button for each condition
    uniquePhases.forEach((phase, index) => {
        const colors = {
            "AEROBIC": ["#2e7bff", "#5291ff"],
            "ANAEROBIC": ["#ff4d4d", "#ff7373"],
            "STRESS": ["#00d87a", "#33e699"]
        };
        
        const buttonColor = colors[phase] || ["#9966cc", "#ab7ae0"];
        
        buttonContainer.append("button")
            .attr("class", "condition-button")
            .attr("data-condition", phase)
            .html(phase)
            .style("margin", "0 5px")
            .style("background", `linear-gradient(45deg, ${buttonColor[0]}, ${buttonColor[1]})`)
            .style("color", "white")
            .style("padding", "8px 15px")
            .style("border", "none")
            .style("border-radius", "5px")
            .style("cursor", "pointer")
            .style("font-weight", index === 0 ? "bold" : "normal")
            .style("opacity", index === 0 ? "1" : "0.7")
            .style("box-shadow", index === 0 ? "0 3px 8px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.2)")
            .on("click", function() {
                // Update all buttons to inactive style
                d3.selectAll(".condition-button")
                    .style("font-weight", "normal")
                    .style("opacity", "0.7")
                    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");
                
                // Set this button to active style
                d3.select(this)
                    .style("font-weight", "bold")
                    .style("opacity", "1")
                    .style("box-shadow", "0 3px 8px rgba(0,0,0,0.3)");
                
                // Get the condition from the button's data attribute
                const selectedCondition = this.getAttribute("data-condition");
                
                // Update dropdown value to match (in case it's still visible)
                d3.select("#bvpConditionSelect").property("value", selectedCondition);
                
                // Update chart
                updateChart(selectedCondition);
            });
    });
}
    // Automatically update prediction during playback
    function updateWithPrediction() {
        if (isPlaying && currentTime > minTime + 10) { // Need some data first
            predictStress();
        }
    }

    // Call prediction update periodically if enabled
    const predictionInterval = setInterval(updateWithPrediction, 2000); // Every 2 seconds

    // Attach event listeners
    d3.select("#play-pause-btn").on("click", toggleAnimation);

    // Use input and change for the slider
    timeSlider.on("input", function() {
        pauseAnimation();
        updateChartForTime(this.value);
    });

    d3.select("#bvpConditionSelect").on("change", function() {
        updateChart(this.value);
    });
    
    // Select the first condition by default
    d3.select("#bvpConditionSelect").property("value", uniquePhases[0]);
    d3.select("#bvpConditionSelect").style("display", "none");


    // Initialize the time display
    d3.select("#time-display").text(`Current Time: ${minTime.toFixed(2)}s`);

    // Initialize toggle button label with the first phase
d3.select("#condition-toggle").html(`Activity: <strong>${uniquePhases[0]}</strong>`);

// Initialize the chart with the first phase
updateChart(uniquePhases[0]);

const styleElement = document.createElement('style');
styleElement.textContent = `
    .trend-line {
        pointer-events: none;
    }
    #stats-panel table {
        width: 100%;
    }
    #stats-panel table tr:nth-child(even) {
        background-color: #f5f5f5;
    }
    .stats-header {
        cursor: move;
    }
`;
document.head.appendChild(styleElement);

// Make the stats panel draggable
function makeStatsPanelDraggable() {
    const statsPanel = document.getElementById('stats-panel');
    if (!statsPanel) return;
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    document.querySelector('.stats-header').onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        statsPanel.style.top = (statsPanel.offsetTop - pos2) + "px";
        statsPanel.style.left = (statsPanel.offsetLeft - pos1) + "px";
        statsPanel.style.right = "auto";
    }
    
    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
function initializeEnhancedTooltips() {
    console.log("🔧 Initializing enhanced tooltips...");
    const tooltip = d3.select("#tooltip-bvp");

    if (tooltip.empty()) {
        console.error("❌ Tooltip element #tooltip-bvp is missing from the HTML!");
        return;
    }

    tooltip.style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "8px")
        .style("padding", "10px")
        .style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.2)")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    console.log("✅ Enhanced tooltips initialized.");
}

setTimeout(initializeEnhancedTooltips, 1000);
setupTooltipHandlers();

// Select the first condition by default
d3.select("#bvpConditionSelect").property("value", uniquePhases[0]);

}).catch(error => console.error("Error loading CSV:", error));

})(); // End IIFE