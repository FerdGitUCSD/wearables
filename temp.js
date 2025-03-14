// Updated temperature visualization as a thermometer
d3.csv('data/combined_temperature_data2.csv').then(function(data) {
    console.log(data);

    // Convert time and temperature to numbers
    data.forEach(function(d) {
        d.time = +d.time;
        d.temperature = +d.temperature;
    });

    // Define phases for each session (unchanged)
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

    // Set up SVG container for thermometer view
    const margin = { top: 40, right: 200, bottom: 50, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select('#temp-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define color scale with more distinct, readable colors
    const colorScale = d3.scaleOrdinal()
        .domain(['AEROBIC', 'ANAEROBIC', 'STRESS'])
        .range(['#00CC00', '#FF3300', '#0066FF']); // Brighter green, red, and blue

    // Get unique conditions (sessions)
    const conditions = Array.from(new Set(data.map(d => d.condition)));

    // Create thermometer dimensions - larger for better visibility
    const thermWidth = 100;
    const thermHeight = height - 100;
    const bulbRadius = thermWidth / 2;
    const tubeWidth = thermWidth / 3;

    // Define scales for thermometer and timeline
    const timeScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.time)])
        .range([0, width]);
    
    const tempScale = d3.scaleLinear()
        .domain([30, 35]) // Temperature range from your original scale
        .range([thermHeight, 0]);
    
    // Create axes
    const timeAxis = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - 50})`)
        .call(d3.axisBottom(timeScale));
    
    svg.append('text')
        .attr('transform', `translate(${width / 2},${height})`)
        .style('text-anchor', 'middle')
        .text('Time (seconds)');
        
    // Add thermometer background
    const thermGroup = svg.append('g')
        .attr('class', 'thermometer')
        .attr('transform', `translate(${width/2 - thermWidth/2}, 10)`);
    
    // Thermometer bulb with better visual style
    thermGroup.append('circle')
        .attr('cx', thermWidth / 2)
        .attr('cy', thermHeight + bulbRadius)
        .attr('r', bulbRadius)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#555')
        .attr('stroke-width', 3);
        
    // Add glass reflection effect to bulb
    thermGroup.append('circle')
        .attr('cx', thermWidth / 2 - bulbRadius/3)
        .attr('cy', thermHeight + bulbRadius - bulbRadius/3)
        .attr('r', bulbRadius/4)
        .attr('fill', 'white')
        .attr('opacity', 0.5);
    
    // Thermometer tube with improved styling
    thermGroup.append('rect')
        .attr('x', (thermWidth - tubeWidth) / 2)
        .attr('y', 0)
        .attr('width', tubeWidth)
        .attr('height', thermHeight)
        .attr('rx', tubeWidth / 2)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#555')
        .attr('stroke-width', 3);
        
    // Add glass reflection effect to tube
    thermGroup.append('rect')
        .attr('x', (thermWidth - tubeWidth) / 2 + tubeWidth * 0.7)
        .attr('y', 5)
        .attr('width', tubeWidth * 0.2)
        .attr('height', thermHeight - 10)
        .attr('rx', tubeWidth * 0.1)
        .attr('fill', 'white')
        .attr('opacity', 0.3);
        
    // Add title to the thermometer
    svg.append('text')
        .attr('x', width/2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .text('Body Temperature Response');
    
    // Temperature scale on thermometer with improved readability
    const tempTicks = tempScale.ticks(10);
    const tempAxisGroup = svg.append('g')
        .attr('class', 'temp-axis')
        .attr('transform', `translate(${width/2 - thermWidth/2 - 40}, 10)`);
    
    // Add temperature axis title
    tempAxisGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -thermHeight/2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('Temperature (°C)');
    
    // Add tick marks with improved styling
    tempAxisGroup.selectAll('.temp-tick')
        .data(tempTicks)
        .enter()
        .append('g')
        .attr('class', 'temp-tick')
        .attr('transform', d => `translate(0, ${tempScale(d)})`)
        .call(g => {
            g.append('line')
                .attr('x1', 0)
                .attr('x2', 15)
                .attr('stroke', '#333')
                .attr('stroke-width', 1.5);
            g.append('text')
                .attr('x', -8)
                .attr('y', 4)
                .attr('text-anchor', 'end')
                .attr('font-size', '12px')
                .attr('font-weight', d => (d % 1 === 0) ? 'bold' : 'normal')
                .text(d => d + '°C');
        });
        
    // Add temperature thresholds with labels and horizontal lines across chart
    const thresholds = [
        { temp: 31, label: 'Low', color: '#00BFFF' },
        { temp: 32.5, label: 'Normal', color: '#32CD32' },
        { temp: 34, label: 'High', color: '#FF6347' }
    ];
    
    thresholds.forEach(threshold => {
        // Add threshold line
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', tempScale(threshold.temp))
            .attr('x2', width)
            .attr('y2', tempScale(threshold.temp))
            .attr('stroke', threshold.color)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.7);
            
        // Add threshold label
        svg.append('text')
            .attr('x', width - 5)
            .attr('y', tempScale(threshold.temp) - 5)
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .attr('fill', threshold.color)
            .attr('font-weight', 'bold')
            .text(threshold.label);
    });
    
    // Tooltip for temperature info
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-temp")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    // Store selected sessions
    let selectedSessions = conditions;  // Initially all sessions are selected
    let currentTime = 0;
    let animationSpeed = 10; // milliseconds per time unit
    let animationRunning = false;
    let animationTimer;
    
    // Create a mercury element for each condition
    const mercuryElements = {};
    
    conditions.forEach(condition => {
        // Create the mercury in the tube
        const mercury = thermGroup.append('rect')
            .attr('class', `mercury-${condition}`)
            .attr('x', (thermWidth - tubeWidth) / 2)
            .attr('y', thermHeight) // Start at the bottom
            .attr('width', tubeWidth)
            .attr('height', 0) // Start with zero height
            .attr('fill', colorScale(condition))
            .attr('opacity', 0); // Hidden initially
        
        // Create the mercury in the bulb
        const bulbMercury = thermGroup.append('circle')
            .attr('class', `mercury-bulb-${condition}`)
            .attr('cx', thermWidth / 2)
            .attr('cy', thermHeight + bulbRadius)
            .attr('r', bulbRadius - 2) // Slightly smaller than bulb
            .attr('fill', colorScale(condition))
            .attr('opacity', 0); // Hidden initially
        
        mercuryElements[condition] = { tube: mercury, bulb: bulbMercury };
    });
    
    // Create progress indicator (timeline cursor)
    const timeIndicator = svg.append('line')
        .attr('class', 'time-indicator')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', height - 50)
        .attr('stroke', '#ff0000')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    // Find the maximum time value in the dataset
    const maxTime = d3.max(data, d => d.time);
    
    // Create a control panel container
    const controlPanel = d3.select('#chart-container')
        .append('div')
        .attr('id', 'control-panel')
        .style('margin', '15px auto')
        .style('padding', '15px')
        .style('background-color', '#f8f8f8')
        .style('border-radius', '8px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
        .style('max-width', '600px')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('align-items', 'center');
    
    // Add control panel title
    controlPanel.append('div')
        .style('width', '100%')
        .style('text-align', 'center')
        .style('margin-bottom', '10px')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .text('Visualization Controls');
    
    // Add play/pause button with icon
    const playButton = controlPanel.append('button')
        .attr('id', 'play-button')
        .style('margin', '10px')
        .style('padding', '8px 20px')
        .style('cursor', 'pointer')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .on('click', toggleAnimation);
    
    playButton.append('span')
        .html('▶ Play')
        .attr('id', 'play-button-text');
    
    // Add reset button with icon
    const resetButton = controlPanel.append('button')
        .attr('id', 'reset-button')
        .style('margin', '10px')
        .style('padding', '8px 20px')
        .style('cursor', 'pointer')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .on('click', resetAnimation);
    
    resetButton.append('span')
        .html('↻ Reset');
    
    // Add time display
    const timeDisplay = controlPanel.append('div')
        .attr('id', 'time-display')
        .style('margin', '10px 20px')
        .style('padding', '8px 15px')
        .style('background', '#fff')
        .style('border-radius', '4px')
        .style('font-weight', 'bold')
        .style('min-width', '120px')
        .style('text-align', 'center')
        .text('Time: 0s');
    
    // Add speed control slider with better labeling
    const speedControlContainer = controlPanel.append('div')
        .style('margin', '10px')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center');
        
    speedControlContainer.append('label')
        .attr('for', 'speed-slider')
        .style('margin-bottom', '5px')
        .style('font-weight', 'bold')
        .text('Animation Speed');
        
    const speedControl = speedControlContainer.append('input')
        .attr('id', 'speed-slider')
        .attr('type', 'range')
        .attr('min', 1)
        .attr('max', 50)
        .attr('value', 10)
        .style('width', '150px')
        .on('input', function() {
            animationSpeed = 51 - this.value; // Invert so higher value = faster
            
            // Update speed label
            const speedPercentage = Math.round((this.value / 50) * 100);
            d3.select('#speed-value').text(`${speedPercentage}%`);
        });
        
    speedControlContainer.append('span')
        .attr('id', 'speed-value')
        .style('margin-top', '5px')
        .text('20%');
    
    // Function to update the thermometer based on the current time
    function updateThermometer(time) {
        // Update time indicator position
        timeIndicator.attr('x1', timeScale(time))
            .attr('x2', timeScale(time));
        
        // Update time display
        d3.select('#time-display').text(`Time: ${Math.round(time)}s`);
        
        // For each selected session, update the thermometer mercury
        selectedSessions.forEach(condition => {
            const filteredData = data.filter(d => 
                d.condition === condition && 
                d.temperature <= 40 &&
                d.time <= time
            );
            
            if (filteredData.length > 0) {
                // Get the temperature at this time point
                // Find the closest time point that's less than or equal to the current time
                const closestData = filteredData.reduce((prev, curr) => {
                    return (Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev);
                });
                
                const temp = closestData.temperature;
                
                // Update the thermometer mercury height and position with smooth transition
                const mercuryHeight = thermHeight - tempScale(temp);
                const mercury = mercuryElements[condition].tube;
                const bulbMercury = mercuryElements[condition].bulb;
                
                mercury.transition()
                      .duration(animationSpeed * 0.8) // Make transition slightly faster than animation speed
                      .attr('y', tempScale(temp))
                      .attr('height', mercuryHeight)
                      .attr('opacity', 1);
                
                bulbMercury.attr('opacity', 1);
                
                // Update temperature value display
                d3.select('#temp-value')
                  .text(`${temp.toFixed(2)}°C`)
                  .style('color', getTemperatureColor(temp));
                
                // Update phase highlight if we have exactly one session selected
                if (selectedSessions.length === 1) {
                    updatePhaseHighlight(condition, time);
                }
            }
        });
        
        // Update current phase label with better formatting
        if (selectedSessions.length === 1) {
            const condition = selectedSessions[0];
            const currentPhase = getCurrentPhase(condition, time);
            
            if (currentPhase) {
                const phaseDescription = getPhaseDescription(currentPhase);
                d3.select('#current-phase')
                    .html(`<span style="color:${colorScale(condition)}">▮</span> <strong>${currentPhase}</strong>: ${phaseDescription}`)
                    .style('opacity', 1);
            } else {
                d3.select('#current-phase')
                    .html(`<span style="color:#999">▮</span> <strong>No active phase</strong>`)
                    .style('opacity', 0.7);
            }
        } else if (selectedSessions.length > 1) {
            d3.select('#current-phase')
                .html(`<strong>Multiple sessions selected</strong>: Select a single session to see phase details.`)
                .style('opacity', 0.7);
        } else {
            d3.select('#current-phase')
                .html(`<strong>No sessions selected</strong>: Please select at least one session.`)
                .style('opacity', 0.7);
        }
    }
    
    // Helper function to get color based on temperature value
    function getTemperatureColor(temp) {
        if (temp < 32) return '#00BFFF'; // Cool blue for low temp
        if (temp < 33) return '#32CD32'; // Green for normal temp
        if (temp < 34) return '#FFA500'; // Orange for warm temp
        return '#FF4500';                // Red-orange for high temp
    }
    
    // Function to get the current phase name
    function getCurrentPhase(condition, time) {
        const sessionPhases = phases[condition];
        if (sessionPhases) {
            for (const phase of sessionPhases) {
                if (time >= phase.start && time <= phase.end) {
                    return phase.label;
                }
            }
        }
        return null;
    }
    
    // Function to create/update the phase highlights
    function updatePhaseHighlight(condition, time) {
        // Remove existing highlights
        svg.selectAll('.phase-highlight').remove();
        
        const sessionPhases = phases[condition];
        if (sessionPhases) {
            // Find current phase
            const currentPhase = sessionPhases.find(phase => 
                time >= phase.start && time <= phase.end
            );
            
            if (currentPhase) {
                // Add highlight for current phase
                svg.append('rect')
                    .attr('class', 'phase-highlight')
                    .attr('x', timeScale(currentPhase.start))
                    .attr('y', 0)
                    .attr('width', timeScale(currentPhase.end) - timeScale(currentPhase.start))
                    .attr('height', height - 50)
                    .attr('fill', colorScale(condition))
                    .attr('opacity', 0.2);
                
                // Add phase label
                svg.append('text')
                    .attr('class', 'phase-highlight')
                    .attr('x', timeScale(currentPhase.start) + 5)
                    .attr('y', 20)
                    .text(`Phase: ${currentPhase.label}`)
                    .attr('fill', '#333')
                    .attr('font-weight', 'bold');
            }
        }
    }
    
    // Animation function
    function animate() {
        if (currentTime >= maxTime) {
            stopAnimation();
            return;
        }
        
        updateThermometer(currentTime);
        currentTime += 10; // Increment by 10 seconds each frame
        
        animationTimer = setTimeout(animate, animationSpeed);
    }
    
    // Start/stop animation
    function toggleAnimation() {
        if (animationRunning) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }
    
    function startAnimation() {
        if (!animationRunning) {
            animationRunning = true;
            playButton.text('Pause');
            animate();
        }
    }
    
    function stopAnimation() {
        clearTimeout(animationTimer);
        animationRunning = false;
        playButton.text('Play');
    }
    
    function resetAnimation() {
        stopAnimation();
        currentTime = 0;
        updateThermometer(currentTime);
        
        // Clear all mercury
        conditions.forEach(condition => {
            mercuryElements[condition].tube.attr('height', 0).attr('opacity', 0);
            mercuryElements[condition].bulb.attr('opacity', 0);
        });
        
        // Reset phase highlight
        svg.selectAll('.phase-highlight').remove();
        d3.select('#current-phase').text('');
    }
    
    // Add current phase display
    d3.select('#chart-container')
        .append('div')
        .attr('id', 'current-phase')
        .style('margin-top', '10px')
        .style('font-weight', 'bold')
        .style('font-size', '16px');
    
    // Create an enhanced legend for condition selection
    const legend = d3.select("#legend")
        .style('padding', '15px')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('border-radius', '8px')
        .style('border', '1px solid #ddd')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
        .style('max-width', '250px');
    
    // Add legend title
    legend.append('div')
        .style('font-weight', 'bold')
        .style('font-size', '16px')
        .style('margin-bottom', '10px')
        .style('border-bottom', '1px solid #ddd')
        .style('padding-bottom', '5px')
        .text('Activity Types');
    
    // Add description
    legend.append('div')
        .style('font-size', '12px')
        .style('margin-bottom', '10px')
        .style('color', '#666')
        .text('Select one or more activities to compare temperature responses:');
    
    // Create condition descriptions
    const conditionDescriptions = {
        'AEROBIC': 'Steady-state cardio exercise',
        'ANAEROBIC': 'High-intensity interval training',
        'STRESS': 'Mental stress test activities'
    };
    
    // Add checkboxes for each condition with better styling
    conditions.forEach(condition => {
        const conditionContainer = legend.append('div')
            .style('margin', '12px 0')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('background-color', 'rgba(240, 240, 240, 0.5)')
            .style('border-left', `4px solid ${colorScale(condition)}`);
        
        const label = conditionContainer.append('label')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('cursor', 'pointer');
        
        label.append('input')
            .attr('type', 'checkbox')
            .attr('id', `checkbox-${condition}`)
            .property('checked', true)
            .style('margin-right', '10px')
            .style('transform', 'scale(1.2)')
            .on('change', function() {
                // Update selected sessions based on checkbox state
                selectedSessions = conditions.filter(c => 
                    d3.select(`#checkbox-${c}`).property('checked'));
                
                // Update visibility of mercury for each condition
                conditions.forEach(c => {
                    const isSelected = selectedSessions.includes(c);
                    mercuryElements[c].tube
                        .transition()
                        .duration(300)
                        .attr('opacity', isSelected ? 1 : 0);
                    
                    mercuryElements[c].bulb
                        .transition()
                        .duration(300)
                        .attr('opacity', isSelected ? 1 : 0);
                });
                
                // Update phase highlight if needed
                if (selectedSessions.length === 1) {
                    updatePhaseHighlight(selectedSessions[0], currentTime);
                } else {
                    svg.selectAll('.phase-highlight').remove();
                }
                
                // Update current phase info
                updateThermometer(currentTime);
            });
        
        // Add condition name with color indicator
        const nameContainer = label.append('div')
            .style('flex-grow', '1');
        
        nameContainer.append('div')
            .style('font-weight', 'bold')
            .style('display', 'flex')
            .style('align-items', 'center')
            .html(`<span style="display:inline-block; width:12px; height:12px; background-color:${colorScale(condition)}; margin-right:8px; border-radius:2px;"></span> ${condition}`);
        
        // Add condition description
        nameContainer.append('div')
            .style('font-size', '11px')
            .style('color', '#666')
            .style('margin-top', '3px')
            .style('margin-left', '20px')
            .text(conditionDescriptions[condition] || '');
    });
    
    // Add a compare button to quickly toggle between single/multiple selection
    legend.append('button')
        .attr('id', 'compare-button')
        .style('width', '100%')
        .style('padding', '8px')
        .style('margin-top', '10px')
        .style('border-radius', '4px')
        .style('background-color', '#f0f0f0')
        .style('border', '1px solid #ddd')
        .style('cursor', 'pointer')
        .text('Compare All')
        .on('click', function() {
            const allChecked = conditions.every(c => 
                d3.select(`#checkbox-${c}`).property('checked'));
            
            if (allChecked) {
                // If all are selected, keep only the first one
                conditions.forEach((c, i) => {
                    d3.select(`#checkbox-${c}`).property('checked', i === 0);
                });
                d3.select(this).text('Compare All');
            } else {
                // Otherwise select all
                conditions.forEach(c => {
                    d3.select(`#checkbox-${c}`).property('checked', true);
                });
                d3.select(this).text('Show Single');
            }
            
            // Trigger the change event on the first checkbox to update the view
            d3.select(`#checkbox-${conditions[0]}`).dispatch('change');
        });
        
    // Add temperature value display
    controlPanel.append('div')
        .attr('id', 'temp-display')
        .style('margin', '10px 20px')
        .style('padding', '8px 15px')
        .style('background', '#fff')
        .style('border-radius', '4px')
        .style('font-weight', 'bold')
        .style('min-width', '120px')
        .style('text-align', 'center');
    
    // Add temperature value in the display
    d3.select('#temp-display')
        .append('span')
        .attr('id', 'temp-value')
        .style('font-size', '16px')
        .text('--°C');
    
    // Initialize with first frame
    updateThermometer(0);
});