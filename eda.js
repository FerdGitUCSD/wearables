document.addEventListener("DOMContentLoaded", function () {
    // Canvas size
    const edaMargin = { top: 50, right: 50, bottom: 50, left: 60 };
    const edaWidth = 900 - edaMargin.left - edaMargin.right;
    const edaHeight = 500 - edaMargin.top - edaMargin.bottom;

    //experiment time line
    const EXPERIMENT_PHASES = {
        "Aerobic": [
          { name: "Baseline", start: 0, end: 270 },      // 4:30
          { name: "Warm up", start: 270, end: 405 },    // +2:15
          { name: "70 rpm", start: 405, end: 495 },     // +1:30
          { name: "75 rpm", start: 495, end: 615 },     // +1:30
          { name: "80 rpm", start: 615, end: 735 },     // +1:30
          { name: "85 rpm", start: 735, end: 1350 },    // +11:15
          { name: "Cool Down", start: 1350, end: 1620 },// +4:30
          { name: "Rest", start: 1620, end: 3200 }      // +3:00
        ],
        "Anaerobic": [
          { name: "Baseline", start: 0, end: 270 },      // 4:30
          { name: "Warm up", start: 270, end: 540 },     // +4:30
          { name: "Sprint 1", start: 540, end: 585 },    // +0:45
          { name: "Cool Down", start: 585, end: 840 }, 
          { name: "Sprint 2", start: 840, end: 885 },
          { name: "Cool Down", start: 885, end: 1110 },
          { name: "Sprint 3", start: 1110, end: 1155 },
          { name: "Cool Down", start: 1155, end: 1380 },
          { name: "Sprint 4", start: 1380, end: 1425 },
          { name: "Cool Down", start: 1425, end: 1650 },
          { name: "Rest", start: 1650, end: 4000 }
          
        ],
        "Stress": [
          { name: "Baseline", start: 0, end: 180 },       // 3:00        // +10:00
          { name: "TMCT", start: 180, end: 360 },
          { name: "First Rest", start: 360, end: 960 },
          { name: "Real Opinion", start: 960, end: 990 },
          { name: "Opposite Opinion", start: 990, end: 1020 },
          { name: "Second Rest", start: 1020, end: 1620 },
          { name: "Subtract Test", start: 1620, end: 5000 }
          
        ]
      };

   // Select SVG and add canvas
    const edaSvg = d3.select("#eda-chart")
        .append("svg")
        .attr("width", edaWidth + edaMargin.left + edaMargin.right)
        .attr("height", edaHeight + edaMargin.top + edaMargin.bottom)
        .append("g")
        .attr("transform", `translate(${edaMargin.left},${edaMargin.top})`);

    

    
    
    d3.csv("data/Merged_Data.csv").then(function (edaData) {
        edaData.forEach(d => {
            d.timestamp = +d.timestamp;
            d.EDA = +d.EDA;
            d.Gender = d.Gender ? d.Gender.trim() : "Unknown";
            d.Experiment = d.Experiment ? d.Experiment.trim() : "Unknown"; 
        });
    
        const experimentGroups = Array.from(new Set(edaData.map(d => d.Experiment))); // 使用正确的列名
        console.log("Experiment Groups:", experimentGroups);

        const genderOptions = Array.from(new Set(edaData.map(d => d.Gender)))
            .filter(g => g !== "Unknown" && g !== ""); 
        d3.select("#eda-gender-dropdown")
            .selectAll("option")
            .data(["all", ...genderOptions])
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        d3.select("#eda-gender-dropdown").on("change", edaupdateChart);
        
        // Sort in a specified order
        const preferredOrder = ["Aerobic", "Anaerobic", "Stress"];
        experimentGroups.sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

        console.log("Sorted Experiment Groups:", experimentGroups);
    

         // Calculate the average EDA per second
        const edaAverages = d3.rollup(edaData, 
            v => d3.mean(v, d => d.EDA), 
            d => d.Experiment, 
            d => Math.floor(d.timestamp) 
        );
        
        // Generate transformed data
        const processedData = experimentGroups.map(exp => ({
            experiment: exp,
            values: Array.from(edaAverages.get(exp) || []).map(([timestamp, avgEDA]) => ({
                timestamp: timestamp,
                EDA: avgEDA
            }))
        }));

        // Set X-axis (timestamp)
        const edaXScale = d3.scaleLinear()
            .domain(d3.extent(edaData, d => d.timestamp))
            .range([0, edaWidth]);

        const edaXAxis = d3.axisBottom(edaXScale);

       // Set Y-axis (EDA)
        const edaYScale = d3.scaleLinear()
            .domain([0, d3.max(processedData, g => d3.max(g.values, d => d.EDA))])
            .range([edaHeight, 0]);

        const edaYAxis = d3.axisLeft(edaYScale);

        // Draw X-axis
        edaSvg.append("g")
            .attr("class", "x-axis") 
            .attr("transform", `translate(0,${edaHeight})`)
            .call(edaXAxis)
            .append("text")
            .attr("x", edaWidth / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text("Timestamp (seconds)");

        // Draw Y-axis
        edaSvg.append("g")
            .attr("class", "y-axis") 
            .call(edaYAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -edaHeight / 2)
            .attr("y", -40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text("Average EDA");

        // Define line generator
        const edaLine = d3.line()
            .x(d => edaXScale(d.timestamp))
            .y(d => edaYScale(d.EDA))
            .curve(d3.curveMonotoneX);

        // Add dropdown menu
        const dropdown = d3.select("#eda-dropdown")
            .on("change", edaupdateChart)
            .selectAll("option")
            .data(experimentGroups)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

       
         // Initially draw the first experiment
        let currentExperiment = experimentGroups[0];

         // Function to convert rgba to solid color
        function hexToSolid(rgba) {
         
            const colorMap = {
                "rgba(0, 255, 0, 0.1)": "#00cc00", 
                "rgba(0, 0, 255, 0.1)": "#0066ff",  
                "rgba(255, 0, 0, 0.1)": "#ff4444",  
                "rgba(255, 0, 0, 0.2)": "#ff0000"   
            };
            return colorMap[rgba] || "#333";
        }

        let isPlaying = false;
        let animationTimer = null;


        function updateLineVisibility(currentTime) {
            const linePath = edaSvg.select(".eda-line");
            const totalLength = linePath.node().getTotalLength();
            
            // 计算当前时间的显示比例
            const progress = currentTime / edaXScale.domain()[1];
            const visibleLength = totalLength * progress;
            
            // 使用虚线技巧显示部分线条
            linePath.style("stroke-dasharray", `${visibleLength} ${totalLength}`);
        }

        function initEDAPlayControls() {
            const playButton = d3.select("#eda-play-btn");
            const timeSlider = d3.select("#eda-time-slider");

            playButton.on("click", function() {
                isPlaying = !isPlaying;
                playButton.text(isPlaying ? "⏸ Pause" : "▶ Play");

                
        
                if(isPlaying) {
                    const maxTime = +d3.select("#eda-time-slider").attr("max");
                    const duration = 15000; // 15秒完成动画
            
                    const startTime = Date.now();
                    const startValue = +timeSlider.property("value");
            
                    animationTimer = d3.interval(() => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const currentTime = startValue + (maxTime - startValue) * progress; // 使用滑块max值
                        
                        timeSlider.property("value", currentTime);
                        updateLineVisibility(currentTime);
                        
                        if(progress >= 1) {
                            animationTimer.stop();
                            isPlaying = false;
                            playButton.text("▶ Play");
                        }
                    }, 50);
                    
                } else {
                    if(animationTimer) animationTimer.stop();
                }
            });

            timeSlider.on("input", function() {
                if(isPlaying) return;
                updateLineVisibility(+this.value);
            });
        }




        function edaupdateChart() {
            // Get selected gender and experiment group
            const currentGender = d3.select("#eda-gender-dropdown").property("value");
            const currentExperiment = d3.select("#eda-dropdown").property("value");
        
            // Filter data based on gender and experiment
            let filteredData = edaData;
            if (currentGender !== "all") {
                filteredData = filteredData.filter(d => d.Gender === currentGender);
            }
            filteredData = filteredData.filter(d => d.Experiment === currentExperiment);
        
            // Calculate average EDA per second
            const edaAverages = d3.rollup(
                filteredData,
                v => d3.mean(v, d => d.EDA),
                d => Math.floor(d.timestamp)
            );
        
           
            const processedData = {
                experiment: currentExperiment,
                values: Array.from(edaAverages, ([timestamp, avgEDA]) => ({
                    timestamp: +timestamp,
                    EDA: avgEDA
                })).sort((a, b) => a.timestamp - b.timestamp)
            };
        
            const currentPhases = EXPERIMENT_PHASES[currentExperiment] || [];
            currentPhases.sort((a,b) => (a.priority || 0) - (b.priority || 0)); 

            const xDomain = [
                d3.min(currentPhases, d => d.start) || 0,  // 使用start字段
                d3.max(currentPhases, d => d.end) || d3.max(filteredData, d => d.timestamp)
              ];
            edaXScale.domain(xDomain);
            edaSvg.select(".x-axis").call(edaXAxis);

            const maxTime = xDomain[1];
        
            const yMax = d3.max(processedData.values, d => d.EDA) || 0;
            edaYScale.domain([0, yMax]);
            edaSvg.select(".y-axis").call(edaYAxis);
        
            
            const lines = edaSvg.selectAll(".eda-line")
                .data([processedData.values]);

            const thresholds = [
                    { value: 2, color: "green", label: "Calm (<2μS)" },
                    { value: 5, color: "blue", label: "Mild Arousal (2-5μS)" },
                    { value: 5, color: "red", label: "Moderate Arousal (5-10μS)" },
                    { value: 10, color: "darkred", label: "High Arousal (>10μS)" }
                    
            ];
            
            const zones = [
                { y1: 0, y2: 2, color: "rgba(0, 255, 0, 0.1)", label: "Calm (<2μS)" },  
                { y1: 2, y2: 5, color: "rgba(0, 0, 255, 0.1)", label: "Mild Arousal (2-5μS)" }, 
                { y1: 5, y2: 10, color: "rgba(255, 0, 0, 0.1)", label: "Moderate Arousal (5-10μS)" }, 
                { y1: 10, y2: Infinity, color: "rgba(255, 0, 0, 0.2)", label: "High Arousal (>10μS)" } 
            ];

            const bands = edaSvg.selectAll(".eda-background-band")
            .data(zones);


            const thresholdLines = edaSvg.selectAll(".eda-threshold-line")
            .data(thresholds);

            thresholdLines.enter()
                .append("line")
                .attr("class", d => `eda-threshold-line eda-${d.color}-line`) 
                .merge(thresholdLines)
                .attr("x1", 0)
                .attr("x2", edaWidth)
                .attr("y1", d => edaYScale(d.value))
                .attr("y2", d => edaYScale(d.value))
                .attr("stroke", d => d.color)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5") 
                .style("opacity", 0.7);

            const thresholdLabels = edaSvg.selectAll(".eda-threshold-label")
                .data(thresholds);

            edaSvg.selectAll(".phase-marker, .phase-label").remove();

             
            const bisectTime = d3.bisector(d => d.timestamp).left;

            
            
            currentPhases.forEach((phase, phaseIndex) => {


                
                
                const index = bisectTime(processedData.values, phase.start, 0);
                const dataPoint = processedData.values[Math.min(index, processedData.values.length - 1)];

                if (dataPoint) {
                
                edaSvg.append("circle")
                    .attr("class", "phase-marker")
                    .attr("cx", edaXScale(dataPoint.timestamp))
                    .attr("cy", edaYScale(dataPoint.EDA))
                    .attr("r", 4)
                    .attr("fill", "none")      
                    .attr("stroke", "#ff5722") 
                    .attr("stroke-width", 2);

                
                
                const labelX = edaXScale(dataPoint.timestamp) + 0; 
                const verticalOffset = phaseIndex % 2 === 0 ? -25 : 25; 
                const labelY = edaYScale(dataPoint.EDA) + verticalOffset;
                
                edaSvg.append("text")
                    .attr("class", "phase-label")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("dy", ".35em")
                    .text(phase.name)
                    .style("font-size", "10px")
                    .style("fill", "#333")
                    .style("font-weight", "bold")
                    .style("text-anchor", "start")
                    .style("pointer-events", "none");
                }
            });



            thresholdLabels.enter()
                .append("text")
                .attr("class", "eda-threshold-label")
                .merge(thresholdLabels)
                .attr("x",  650+edaWidth - 650) 
                .attr("y", d => {
                    
                    const baseY = edaYScale(d.value);
                    
                    if(d.value === 2) return baseY + 26;  
                    if(d.value === 5 & d.label == 'Mild Arousal (2-5μS)') return baseY + 40; 
                    if(d.value === 5 & d.label == 'Moderate Arousal (5-10μS)') return baseY - 40;
                    if(d.value === 10) return baseY - 50; 
                })
                .attr("fill", d => d.color)
                .style("font-size", "12px")
                .style("text-anchor", "end")
                .text(d => d.label);


            bands.enter()
                .append("rect")
                .attr("class", "eda-background-band")
                .merge(bands)
                .attr("x", 0)
                .attr("width", edaWidth)
                .attr("y", d => edaYScale(Math.min(d.y2, yMax))) 
                .attr("height", d => {
                    const top = edaYScale(Math.min(d.y2, yMax));
                    const bottom = edaYScale(d.y1);
                    return bottom - top;
                })
                .attr("fill", d => d.color)
                .attr("stroke", "none");
            
        
            lines.enter()
                .append("path")
                .merge(lines)
                .transition().duration(500)
                .attr("fill", "none")
                .attr("stroke",  "#4682b4")
                .attr("stroke-width", 2)
                .attr("d", edaLine)
                .attr("class", "eda-line");
        

            lines.exit().remove();
            thresholdLines.exit().remove();
            thresholdLabels.exit().remove();
            bands.exit().remove();


            edaSvg.selectAll(".overlay").remove();

            
            const overlay = edaSvg.append("rect")
            .attr("class", "overlay")
            .attr("width", edaWidth)
            .attr("height", edaHeight)
            .style("opacity", 0)
            .on("mousemove", function(event) {
                const mouseX = d3.pointer(event)[0];
                const timestamp = edaXScale.invert(mouseX);
                const currentExpName = currentExperiment;
                const currentGender = d3.select("#eda-gender-dropdown").property("value");
    
                
                const bisect = d3.bisector(d => d.timestamp).left;
                const index = bisect(processedData.values, timestamp, 0);
                const closestData = processedData.values[index] || processedData.values[processedData.values.length - 1];
                

                const guideX = edaXScale(closestData.timestamp); 
                let guideLine = edaSvg.selectAll(".eda-guide-line").data([1]);

                
                const pointY = edaYScale(closestData.EDA);

                
                let zoneInfo = "Undefined";
                let zoneColor = "#333"; 
                for (const zone of zones) {
                    const upperBound = zone.y2 === Infinity ? Infinity : Math.min(zone.y2, yMax);
                    if (closestData.EDA >= zone.y1 && closestData.EDA < upperBound) {
                        zoneInfo = zone.label;
                        
                        zoneColor = hexToSolid(zone.color);
                        break;
                    }
                }

                const tooltipContent = `
                <strong>Experiment:</strong> ${currentExpName}<br>
                <strong>Gender:</strong> ${currentGender === 'all' ? 'All' : currentGender}<br>
                <strong>Time:</strong> ${closestData.timestamp}s<br>
                <strong>EDA:</strong> ${closestData.EDA.toFixed(2)}μS<br>
                <strong>Zone:</strong> <span class="zone-label" style="color:${zoneColor}">${zoneInfo}</spa
                `;

                

                
                edaSvg.selectAll(".eda-data-point")
                .data([1])
                .join(
                    enter => enter.append("circle")
                        .attr("class", "eda-data-point"),
                    update => update,
                    exit => exit.remove()
                    )
                .attr("cx", guideX)
                .attr("cy", pointY);

            
                guideLine.enter()
                .append("line")
                .attr("class", "eda-guide-line")
                .merge(guideLine)
                .attr("x1", guideX)  
                .attr("x2", guideX)
                .attr("y1", 0)
                .attr("y2", edaHeight);

                // tooltip
                d3.select("#eda-tooltip")
                .style("opacity", 1)
                .html(tooltipContent)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
             d3.select("#eda-tooltip").style("opacity", 0);
            });

            
            d3.select("#eda-tooltip").style("opacity", 0);

            d3.select("#eda-time-slider")
            .attr("min", 0)
            .attr("max", maxTime)
            .property("value", 0);

            edaSvg.select(".eda-line")
            .style("stroke-dasharray", null);

            

        }

        // Initialize chart
        edaupdateChart();
        initEDAPlayControls();

    }).catch(error => {
        console.error("Error loading data:", error);
        
        
    });
});

