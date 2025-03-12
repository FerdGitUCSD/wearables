d3.csv('data/combined_temperature_data2.csv').then(function(data) {
    console.log(data);

    // Convert time and temperature to numbers
    data.forEach(function(d) {
        d.time = +d.time;
        d.temperature = +d.temperature;
    });

    // Define phases for each session
    const phases = {
        ANAEROBIC: [
            { start: 0, end: 270, label: 'Baseline' },
            { start: 270, end: 540, label: 'Warm up' },
            { start: 540, end: 585, label: 'Sprint 1' },
            { start: 585, end: 840, label: 'Cool Down' },
            { start: 840, end: 885, label: 'Sprint 2' },
            { start: 885, end: 1110, label: 'Cool Down' },
            { start: 1110, end: 1155, label: 'Sprint 3' },
            { start: 1155, end: 1380, label: 'Cool Down' },
            { start: 1380, end: 1425, label: 'Sprint 4' },
            { start: 1425, end: 1650, label: 'Cool Down' },
            { start: 1650, end: 1770, label: 'Rest' }
        ],
        AEROBIC: [
            { start: 0, end: 270, label: 'Baseline' },
            { start: 270, end: 405, label: 'Warm up' },
            { start: 405, end: 495, label: '70 rpm' },
            { start: 495, end: 585, label: '75 rpm' },
            { start: 585, end: 675, label: '80 rpm' },
            { start: 675, end: 1350, label: '85 rpm' },
            { start: 1350, end: 1620, label: '90/95 rpm' },
            { start: 1620, end: 1800, label: 'Cool Down' },
            { start: 1800, end: 1920, label: 'Rest' }
        ],
        STRESS: [
            { start: 180, end: 360, label: 'TMCT' },
            { start: 360, end: 960, label: 'First Rest' },
            { start: 960, end: 990, label: 'Real Opinion' },
            { start: 990, end: 1020, label: 'Opposite Opinion' },
            { start: 1020, end: 1620, label: 'Second Rest' },
            { start: 1620, end: 1650, label: 'Subtract Test' }
        ]
    };

    // Set up the SVG container (larger width and height)
    const margin = { top: 20, right: 200, bottom: 120, left: 60 };  // Adjust margins if necessary
    const width = 900 - margin.left - margin.right;  // Increase width
    const height = 600 - margin.top - margin.bottom;  // Increase height

    const svg = d3.select('#temp-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Get unique conditions (sessions)
    const conditions = Array.from(new Set(data.map(d => d.condition)));

    // Create a static color map for conditions to ensure consistency
    const colorMap = new Map();
    conditions.forEach((condition, index) => {
        colorMap.set(condition, colorScale(index)); // Assign a fixed color to each session
    });

    // Define scales
    const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.time)])  // Ensure the max time in the data is being correctly captured
    .range([0, width]);
    const y = d3.scaleLinear().domain([30, 35]).nice().range([height, 0]);

    // Create axes
    const xAxis = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    const yAxis = svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y));

    // Add axis labels
    svg.append('text')
        .attr('transform', `translate(${width / 2},${height + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .text('Time (seconds)');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .style('text-anchor', 'middle')
        .text('Temperature (°C)');

    // Tooltip for temperature info
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip-temp")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none");  // Ensure tooltip doesn't block other events


    // Line generator
    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.temperature));

    // Brush for zooming
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

    svg.append("g").attr("class", "brush").call(brush);

    // Store selected sessions
    let selectedSessions = conditions;  // Initially all sessions are selected

    const customColors = ['#FF6347', '#FFD700', '#32CD32', '#1E90FF', '#FF1493', '#8A2BE2', '#A52A2A', '#D2691E'];

    const phaseColorScale = d3.scaleOrdinal()
        .domain(['Baseline', 'Warm up', 'Sprint 1', 'Cool Down', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Rest', 'TMCT', 'First Rest', 'Real Opinion', 'Opposite Opinion', 'Second Rest', 'Subtract Test'])
        .range(customColors);  // Use custom colors here

    function addPhaseShadows(session) {
        const sessionPhases = phases[session];
        if (sessionPhases) {
            sessionPhases.forEach(phase => {
                // Add the phase shadow rectangle
                const phaseRect = svg.append('rect')
                    .attr('x', x(phase.start))
                    .attr('y', 0)
                    .attr('width', x(phase.end) - x(phase.start))
                    .attr('height', height)
                    .attr('fill', phaseColorScale(phase.label))
                    .attr('opacity', 0.1)
                    .attr('class', 'phase-shadow')
                    .style('pointer-events', 'none');
    
                // Add a transparent overlay for tooltips
                svg.append('rect')
                    .attr('x', x(phase.start))
                    .attr('y', 0)
                    .attr('width', x(phase.end) - x(phase.start))
                    .attr('height', height)
                    .attr('fill', 'transparent')
                    .attr('class', 'phase-tooltip-overlay')
                    .style('pointer-events', 'all')
                    .on('mouseover', function(event) {
                        // Only show tooltip when exactly one session is selected
                        if (selectedSessions.length === 1) {
                            tooltip.transition()
                                .duration(200)
                                .style('opacity', 0.9);
    
                            // Set the tooltip content with detailed description
                            const phaseDescription = getPhaseDescription(phase.label);
                            tooltip.html(`
                                <strong>Phase:</strong> ${phase.label}<br>
                                <strong>Start:</strong> ${phase.start}s<br>
                                <strong>End:</strong> ${phase.end}s<br>
                                <strong>Description:</strong> ${phaseDescription}
                            `)
                                .style('left', (event.pageX + 5) + 'px')
                                .style('top', (event.pageY - 28) + 'px');
                        }
                    })
                    .on('mouseout', function() {
                        // Hide the custom tooltip
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', 0);
                    });
            });
        }
        
    }
    
    // Function to get phase descriptions
    function getPhaseDescription(phaseLabel) {
        const descriptions = {
            'Baseline': 'Initial resting measurement with minimal external stimuli to establish baseline heart rate.',
            'Warm up': 'Gradual increase in activity to prepare the body.',
            'Sprint 1': 'Short burst of high-intensity activity.',
            'Sprint 2': 'Second burst of high-intensity activity.',
            'Sprint 3': 'Third burst of high-intensity activity.',
            'Sprint 4': 'Final burst of high-intensity activity.',
            'Cool Down': 'Gradual decrease in activity to return to resting state.',
            'Rest': 'Recovery period after initial stress task, allowing physiological measures to return toward baseline.',
            'TMCT': 'Trier Mental Challenge Test: Mathematical tasks with time pressure and annoying sounds to induce stress.',
            'First Rest': 'Initial rest period after the TMCT.',
            'Real Opinion': 'Participants express their genuine opinions.',
            'Opposite Opinion': 'Participants argue against their true beliefs, creating cognitive dissonance.',
            'Second Rest': 'Additional recovery period after subsequent stress tasks.',
            'Subtract Test': 'Participants count backward from 1022 in steps of 13, speaking answers aloud.',
            '75 rpm': 'Cycling at 75 revolutions per minute.',
            '80 rpm': 'Cycling at 80 revolutions per minute.',
            '85 rpm': 'Cycling at 85 revolutions per minute.',
            '90/95 rpm': 'Cycling at 90 or 95 revolutions per minute.'
        };
        return descriptions[phaseLabel] || 'No description available.';
    }
    

    // Function to remove phase shadows
    function removePhaseShadows() {
        svg.selectAll('.phase-shadow').remove();
    }

    // Update function for summary stats
    function updateSummaryStats(avg, min, max) {
        // Remove any previous summary statistics
        d3.selectAll('.summary-stats').remove();
    
        // Create a div container for the summary statistics below the plot
        const summaryDiv = d3.select('#summary-stats');
    
        // Ensure avg, min, and max are valid numbers before applying .toFixed()
        avg = (typeof avg === 'number' && !isNaN(avg)) ? avg.toFixed(2) : 'N/A';
        min = (typeof min === 'number' && !isNaN(min)) ? min : 'N/A';
        max = (typeof max === 'number' && !isNaN(max)) ? max : 'N/A';
    
        // Add the statistics
        summaryDiv
            .html('')  // Clear any previous content
            .append('div')
            .attr('class', 'summary-stat')
            .html(`<strong>Avg:</strong> ${avg}°C`);
    
        summaryDiv
            .append('div')
            .attr('class', 'summary-stat')
            .html(`<strong>Min:</strong> ${min}°C`);
    
        summaryDiv
            .append('div')
            .attr('class', 'summary-stat')
            .html(`<strong>Max:</strong> ${max}°C`);
    }

    function brushed(event) {
        if (!event.selection) return;
    
        const [x0, x1] = event.selection.map(x.invert);
    
        // Get the brushed data range filtered by selected sessions
        const selectedData = data.filter(d => 
            selectedSessions.includes(d.condition) && d.time >= x0 && d.time <= x1);
    
        // Filter out temperatures above 40°C for the summary statistics
        const filteredTemperatures = selectedData.map(d => d.temperature).filter(temp => temp <= 40);
    
        // Check if filteredTemperatures is empty, and show an appropriate message
        if (filteredTemperatures.length === 0) {
            updateSummaryStats("No valid data in selected range", "N/A", "N/A");
            return;
        }
    
        // Calculate summary statistics
        const avgTemp = d3.mean(filteredTemperatures);
        const minTemp = d3.min(filteredTemperatures);
        const maxTemp = d3.max(filteredTemperatures);
    
        // Display summary statistics below the plot
        updateSummaryStats(avgTemp, minTemp, maxTemp);
    }
    

    // Create checkboxes for condition selection (sessions)
    const legend = d3.select("#legend");
    conditions.forEach((condition, index) => {
        const label = legend.append("label");
        label.append("input")
            .attr("type", "checkbox")
            .attr("id", `checkbox-${condition}`)
            .property("checked", true)
            .on("change", function() {
                // Update selected sessions based on checkbox state
                selectedSessions = conditions.filter(c => d3.select(`#checkbox-${c}`).property('checked'));

                // After updating selected sessions, update the chart and summary stats
                updateChart();
            });

        label.append("span").text(condition).style("color", colorMap.get(condition)); // Use the color from the map
        legend.append("br");
    });

    // Bisector function to find the closest data point on the line
    const bisect = d3.bisector(d => d.time).left;

    function updateChart() {
        const selectedConditions = selectedSessions;
    
        // Calculate the maximum time for the selected sessions
        let maxTime = 0;
        selectedConditions.forEach((condition) => {
            const filteredData = data.filter(d => d.condition === condition && d.temperature <= 40);
            const sessionMaxTime = d3.max(filteredData, d => d.time);
            if (sessionMaxTime > maxTime) {
                maxTime = sessionMaxTime;
            }
        });
    
        // Update the x-axis domain based on the maximum time of the selected sessions
        x.domain([0, maxTime]);
    
        // Update the x-axis with a smooth transition
        svg.select('.x-axis')
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .call(d3.axisBottom(x));
    
        // Bind data to lines and update/enter/exit
        const lines = svg.selectAll('.line')
            .data(selectedConditions, d => d); // Use session name as key
    
        // Remove lines for unselected sessions
        lines.exit()
            .transition()
            .duration(1000)
            .attr('opacity', 0) // Fade out
            .remove();
    
        // Update existing lines with transitions
        lines.transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr('d', d => {
                const filteredData = data.filter(dd => dd.condition === d && dd.temperature <= 40);
                const timeMap = d3.rollup(filteredData, v => d3.mean(v, dd => dd.temperature), dd => dd.time);
                const avgData = Array.from(timeMap, ([time, temperature]) => ({ time: +time, temperature }))
                    .sort((a, b) => a.time - b.time);
                return line(avgData);
            })
            .attr('stroke', d => colorMap.get(d))
            .attr('opacity', 1); // Ensure lines are visible
    
        // Add new lines for newly selected sessions
        lines.enter()
            .append('path')
            .attr('class', 'line')
            .attr('stroke', d => colorMap.get(d))
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('opacity', 0)
            .attr('d', d => {
                const filteredData = data.filter(dd => dd.condition === d && dd.temperature <= 40);
                const timeMap = d3.rollup(filteredData, v => d3.mean(v, dd => dd.temperature), dd => dd.time);
                const avgData = Array.from(timeMap, ([time, temperature]) => ({ time: +time, temperature }))
                    .sort((a, b) => a.time - b.time);
                return line(avgData);
            })
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
    
                // Get the mouse position
                const [mx, my] = d3.pointer(event);
    
                // Find the closest data point
                const xVal = x.invert(mx);
                const filteredData = data.filter(dd => dd.condition === d && dd.temperature <= 40);
                const idx = bisect(filteredData, xVal);
                const closestDataPoint = filteredData[idx];
    
                if (closestDataPoint) {
                    tooltip.html(`
                        <strong>Session:</strong> ${d}<br>
                        <strong>Time:</strong> ${closestDataPoint.time.toFixed(2)}s<br>
                        <strong>Temperature:</strong> ${closestDataPoint.temperature.toFixed(2)}°C
                    `)
                        .style('left', (event.pageX + 5) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                }
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            })
            .transition()
            .duration(1000)
            .attr('opacity', 1);
    
        // Add phase shadows only when exactly one session is selected
        if (selectedConditions.length === 1) {
            addPhaseShadows(selectedConditions[0]);
        } else {
            removePhaseShadows();
        }
    
        // Re-trigger brush to update summary stats
        brushed({ selection: [x(0), x(maxTime)] });
    }
    

    // Initial chart setup
    updateChart();
});


