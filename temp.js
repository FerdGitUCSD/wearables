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
    const margin = { top: 20, right: 200, bottom: 100, left: 100 }; // Increased bottom margin
    const width = 1000 - margin.left - margin.right;
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
        .domain([30, 36]) // Temperature range from your original scale
        .range([thermHeight, 0]);
    
    const timeAxis = svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height + 30})`) // Move x-axis down by increasing y-value
    .call(d3.axisBottom(timeScale));
    
    svg.append('text')
        .attr('transform', `translate(${width / 2},${height + 70})`)
        .style('text-anchor', 'middle')
        .text('Time (seconds)');
        
    // Add thermometer background
    const thermGroup = svg.append('g')
        .attr('class', 'thermometer')
        .attr('transform', `translate(${width / 2 - thermWidth / 2}, 10)`); // Adjusted y-position

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
    
    // Temperature scale on thermometer with improved readability
    const tempTicks = tempScale.ticks(10);
    const tempAxisGroup = svg.append('g')
        .attr('class', 'temp-axis')
        .attr('transform', `translate(${width/2 - thermWidth/2 - 40}, 10)`);
    
    // Add temperature axis title
    tempAxisGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -thermHeight/2)
        .attr('y', -100)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        // .attr('font-weight', 'bold')
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
            .attr('x1', width / 2 + thermWidth / 3)
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
        .attr('y2', height + 24)
        .attr('stroke', '#ff0000')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    // Find the maximum time value in the dataset
    const maxTime = d3.max(data, d => d.time);
    
    // Create a control panel container
    const controlPanel = d3.select('#control-panel')
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

    // Add temperature display
    controlPanel.append('div')
        .attr('id', 'temp-value')
        .style('margin', '10px 20px')
        .style('padding', '8px 15px')
        .style('background', '#fff')
        .style('border-radius', '4px')
        .style('font-weight', 'bold')
        .style('min-width', '120px')
        .style('text-align', 'center')
        .text('Temperature: --°C');
    
    // Function to update the thermometer based on the current time
    function updateThermometer(time) {
        // Update time indicator position
        timeIndicator
            .attr('x1', timeScale(time))
            .attr('x2', timeScale(time));
        
        // Update time display
        d3.select('#time-display').text(`Time: ${Math.round(time)}s`);
        
        // For each selected session, update the thermometer mercury
        selectedSessions.forEach(condition => {
            const filteredData = data.filter(d => 
                d.condition === condition && 
                d.time <= time
            );
            
            if (filteredData.length > 0) {
                // Get the temperature at this time point
                // Find the closest time point that's less than or equal to the current time
                const closestData = filteredData.reduce((prev, curr) => {
                    return (Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev);
                });
                
                // Check for valid temperature (prevent negative heights)
                let temp = closestData.temperature;
                
                // Clamp temperature to scale domain to prevent negative heights
                temp = Math.max(tempScale.domain()[0], Math.min(tempScale.domain()[1], temp));
                
                // Calculate mercury height (ensure it's not negative)
                const mercuryHeight = Math.max(0, thermHeight - tempScale(temp));
                
                const mercury = mercuryElements[condition].tube;
                const bulbMercury = mercuryElements[condition].bulb;

                // Adjust opacity based on the number of selected sessions
                const opacity = selectedSessions.length > 1 ? 0.6 : 1; // Semi-transparent for multiple sessions
                
                mercury.transition()
                    .duration(animationSpeed * 0.8) // Make transition slightly faster than animation speed
                    .attr('y', tempScale(temp))
                    .attr('height', mercuryHeight)
                    .attr('opacity', opacity);
                
                bulbMercury.attr('opacity', opacity);
                
                // Update temperature value display
                d3.select('#temp-value')
                    .text(`Temp: ${temp.toFixed(2)}°C`)
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

    // Function to get description for phases
    function getPhaseDescription(phaseName) {
        const descriptions = {
            'Baseline': 'Initial resting period',
            'Warm up': 'Gradual exercise start',
            'Sprint 1': 'First high-intensity interval',
            'Sprint 2': 'Second high-intensity interval',
            'Sprint 3': 'Third high-intensity interval',
            'Sprint 4': 'Fourth high-intensity interval',
            'Cool Down': 'Reducing intensity period',
            'Rest': 'Final recovery period',
            '70 rpm': 'Pedaling at 70 revolutions/minute',
            '75 rpm': 'Pedaling at 75 revolutions/minute',
            '80 rpm': 'Pedaling at 80 revolutions/minute',
            '85 rpm': 'Pedaling at 85 revolutions/minute',
            '90/95 rpm': 'Pedaling at 90-95 revolutions/minute',
            'TMCT': 'Toronto Modified Consonant Trigrams test',
            'First Rest': 'Initial recovery period',
            'Real Opinion': 'Expressing genuine viewpoint',
            'Opposite Opinion': 'Expressing contrary viewpoint',
            'Second Rest': 'Secondary recovery period',
            'Subtract Test': 'Mental arithmetic task'
        };
        
        return descriptions[phaseName] || 'No description available';
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
                    .attr('height', height + 24)
                    .attr('fill', colorScale(condition))
                    .attr('opacity', 0.2);
                
                // Add phase label
                svg.append('text')
                    .attr('class', 'phase-highlight')
                    .attr('x', timeScale(currentPhase.start) + 5)
                    .attr('y', 10)
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
            d3.select('#play-button-text').html('⏸ Pause');
            animate();
        }
    }
    
    function stopAnimation() {
        clearTimeout(animationTimer);
        animationRunning = false;
        d3.select('#play-button-text').html('▶ Play');
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
    
    // Create the legend container
    const legend = d3.select("#activity-legend");
    const conditionDescriptions = {
        'AEROBIC': 'Steady-state cardio exercise',
        'ANAEROBIC': 'High-intensity interval training',
        'STRESS': 'Mental stress test activities'
    };    

    // Add checkboxes for each condition
    conditions.forEach((condition) => {
        // Create container without click handler initially
        const conditionContainer = legend.append("div")
            .attr("class", "legend-label")
            .style("border-left-color", colorScale(condition));
        
        // Create the checkbox input
        const checkbox = conditionContainer.append("input")
            .attr("type", "checkbox")
            .attr("id", `checkbox-${condition}`)
            .property("checked", true); // Initially checked
        
        // Add color indicator
        conditionContainer.append("div")
            .attr("class", "color-indicator")
            .style("background-color", colorScale(condition));

        // Add condition name
        conditionContainer.append("div")
            .attr("class", "condition-name")
            .text(condition);

        // Add condition description
        conditionContainer.append("div")
            .attr("class", "condition-description")
            .text(conditionDescriptions[condition] || "");
        
        // Add event listener to the checkbox using standard DOM methods
        // This ensures better compatibility with checkbox default behavior
        document.getElementById(`checkbox-${condition}`).addEventListener('change', function(event) {
            // Stop the event from bubbling up to the container
            event.stopPropagation();
            
            // Update the selection based on the checkbox state
            updateSelection(condition, this.checked);
        });
        
        // Add event listener to the container using standard DOM
        conditionContainer.node().addEventListener('click', function(event) {
            // Ignore clicks on the checkbox itself
            if (event.target.tagName === 'INPUT') {
                return;
            }
            
            // Get the checkbox
            const checkboxElem = document.getElementById(`checkbox-${condition}`);
            
            // Toggle the checkbox
            checkboxElem.checked = !checkboxElem.checked;
            
            // Create and dispatch a change event on the checkbox
            const changeEvent = new Event('change');
            checkboxElem.dispatchEvent(changeEvent);
        });
    });

    // First, determine the maximum time for each condition
    const conditionMaxTimes = {};
    conditions.forEach(condition => {
        const conditionData = data.filter(d => d.condition === condition);
        conditionMaxTimes[condition] = d3.max(conditionData, d => d.time);
    });

    // Modify your updateSelection function to update the x-axis
    function updateSelection(condition, isSelected) {
        if (isSelected) {
            selectedSessions.push(condition);
        } else {
            selectedSessions = selectedSessions.filter((c) => c !== condition);
        }

        // Update visibility of mercury for each condition
        conditions.forEach((c) => {
            const isSelected = selectedSessions.includes(c);
            mercuryElements[c].tube
                .transition()
                .duration(300)
                .attr("opacity", isSelected ? 1 : 0);

            mercuryElements[c].bulb
                .transition()
                .duration(300)
                .attr("opacity", isSelected ? 1 : 0);
        });

        // Calculate new x-axis domain based on selected sessions
        let newMaxTime = 0;
        if (selectedSessions.length === 1) {
            // If only one session is selected, use its max time
            newMaxTime = conditionMaxTimes[selectedSessions[0]];
        } else if (selectedSessions.length > 1) {
            // If multiple sessions are selected, use the maximum of all selected
            newMaxTime = d3.max(selectedSessions, s => conditionMaxTimes[s]);
        } else {
            // If no sessions are selected, use the overall max
            newMaxTime = d3.max(conditions, c => conditionMaxTimes[c]);
        }

        // Update the time scale with new domain
        timeScale.domain([0, newMaxTime]);
        
        // Transition the x-axis to the new scale
        svg.select(".x-axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(timeScale));
        
        // Update the phase highlights and other elements that depend on the time scale
        if (selectedSessions.length === 1) {
            updatePhaseHighlight(selectedSessions[0], currentTime);
        } else {
            svg.selectAll(".phase-highlight").remove();
        }

        // If the current time is beyond the new max time, reset it
        if (currentTime > newMaxTime) {
            currentTime = 0;
            updateThermometer(currentTime);
        } else {
            // Otherwise, just update with the current time
            updateThermometer(currentTime);
        }
    }
    
    // Initialize visualization with the first frame
    updateThermometer(0);
});