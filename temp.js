// Load the CSV data
d3.csv('data/combined_temperature_data2.csv').then(function(data) {
    console.log(data);
    
    // Convert time and temperature to numbers
    data.forEach(function(d) {
        d.time = +d.time; // Convert time to number
        d.temperature = +d.temperature; // Convert temperature to number
    });

    // Set up the SVG container for the line chart
    const margin = { top: 20, right: 150, bottom: 50, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#temp-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Get unique conditions for the filter
    const conditions = Array.from(new Set(data.map(d => d.condition)));

    // Set up the X scale (Time)
    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.time), d3.max(data, d => d.time)])
        .range([0, width]);

    // Set up the Y scale (Temperature) with a max of 40 and 0.5-degree intervals
    const y = d3.scaleLinear()
        .domain([22, 38])  // Explicitly set the Y-axis maximum to 40°C
        .nice()
        .range([height, 0]);

    // Create X and Y axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y)); // 80 ticks for 0.5-degree intervals from 0 to 40°C

    // Add X-axis label
    svg.append('text')
        .attr('transform', `translate(${width / 2},${height + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Time (seconds)');

    // Add Y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Temperature (°C)');

    // Function to draw the line chart
    function updateChart(selectedCondition) {
        // Filter the data based on selected condition and exclude temperatures greater than 40°C
        const filteredData = data.filter(d => d.condition === selectedCondition && d.temperature <= 40);

        // Group the data by participant
        const participants = Array.from(new Set(filteredData.map(d => d.participant_id)));

        // Remove any existing lines and legends
        svg.selectAll('.line').remove();
        svg.selectAll('.legend').remove(); // Remove legend circles
        svg.selectAll('.legend-text').remove(); // Remove legend text

        // Create a line generator function
        const line = d3.line()
            .x(d => x(d.time))
            .y(d => y(d.temperature));

        // Draw a line for each participant
        participants.forEach((participant, index) => {
            const participantData = filteredData.filter(d => d.participant_id === participant);

            svg.append('path')
                .datum(participantData)
                .attr('class', 'line')
                .attr('d', line)
                .attr('stroke', colorScale(index))
                .attr('stroke-width', 2)
                .attr('fill', 'none')
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round');

            // Add legend for each participant
            svg.append('circle')
                .attr('class', 'legend')  // Add class to legend circles
                .attr('cx', width + 20)  // Position of legend circle
                .attr('cy', 20 + index * 25)  // Vertical spacing for each legend item
                .attr('r', 6)
                .attr('fill', colorScale(index));

            svg.append('text')
                .attr('class', 'legend-text')  // Add class to legend text
                .attr('x', width + 40)  // Position of legend text
                .attr('y', 20 + index * 25)  // Vertical spacing for each legend item
                .text(participant)
                .style('font-size', '14px')
                .style('fill', colorScale(index));
        });
    }

    // Set up the filter for condition dropdown
    d3.select('#condition-filter').on('change', function() {
        const selectedCondition = this.value;
        updateChart(selectedCondition);
    });

    // Initially load the chart with a default condition
    updateChart('ANAEROBIC');
});
