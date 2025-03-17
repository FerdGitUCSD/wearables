// Chart dimensions
const margin = { top: 30, right: 60, bottom: 80, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Timeline bar height
const timelineHeight = 60;

// Global references
let svgContainers = {}; // Store SVG containers by condition
let allData; // Store all data globally for filtering
let currentCondition = null; // Track current condition for global interactions
let currentProtocol = null; // Track current protocol for global interactions
let selectedSegment = null; // Track selected segment

// Fixed y-axis range (63 to 140 bpm)
const fixedYMin = 63;
const fixedYMax = 140;

// Animation duration in milliseconds
const animationDuration = 375;

// Time offsets for each condition and protocol (in seconds)
const timeOffsets = {
    "STRESS": {
      "old": 0,
      "new": 0
    },
    "AEROBIC": {
      "old": 0,
      "new": 0
    },
    "ANAEROBIC": {
      "old": 0,
      "new": 0
    }
  };


// Timeline offsets for each condition and protocol (in seconds)
const timelineOffsets = {
    "STRESS": {
      "old": 210,
      "new": 600
    },
    "AEROBIC": {
      "old": 0,
      "new": 300
    },
    "ANAEROBIC": {
      "old": 0,
      "new": 700
    }
  };

  // Custom y-axis ranges for each condition
const customYScaleRanges = {
    "STRESS": { min: 55, max: 100 },
    "AEROBIC": { min: 60, max: 140 },
    "ANAEROBIC": { min: 65, max: 130 }
  };

// Protocol definitions
const protocols = {
  "old": "Old Protocol",
  "new": "New Protocol"
};


const manualAnnotations = {
  "STRESS": {
    "old": [
      {
        time: 463, 
        HR: 81.7,
        label: "Stroop Response",
        description: "This increased heart rate corresponds to the Stroop Test.",
        color: "#E55934", // Red-orange
        lineAngle: 255
      },
      {
        time: 721,
        HR: 73.3,
        label: "Recovery",
        description: "Rapid decrease in heart rate during rest phase demonstrates parasympathetic reactivation.",
        color: "#87CEEB", // Sky blue
        lineAngle: 135 
      },
      {
        time: 960, 
        HR: 79.3,
        label: "TMCT Peak",
        description: "This increased heart rate corresponds to the Trier Mental Challenge Test, a robust stressor that activates the sympathetic nervous system.",
        color: "#E55934", // Red-orange
        lineAngle: 265
        
      },
      {
        time: 1141,
        HR: 74.7,
        label: "Recovery",
        description: "Rapid decrease in heart rate during rest phase demonstrates parasympathetic reactivation.",
        color: "#87CEEB", // Sky blue
        lineAngle: 135 
      },
      {
        time: 1438, 
        HR: 79.1,
        label: "Final Tests Peak",
        description: "This increased heart rate corresponds to both opinion tests as well as the subtract test.",
        color: "#E55934", // Red-orange
        lineAngle: 255
      }
    ],
    "new": [
      {
        time: 863,
        HR: 85.5,
        label: "Stress Response",
        description: "Heart rate elevation during the TMCT task demonstrates the body's physiological response to cognitive stress.",
        color: "#FF69B4", // Hot pink
        lineAngle: 255
      },
      {
        time: 1476,
        HR: 79.5,
        label: "Speech Anxiety",
        description: "The real and opposite opinion tasks triggers a mild stress response as participants articulate personal views on controversial topics.",
        color: "#9370DB", // Medium purple
        lineAngle: 285
      },
      {
        time: 2385,
        HR: 79.1,
        label: "Subtract Test",
        description: "The subtract test, which had participants count backwards from 1022 by 13, caused a spike in heart rate.",
        color: "#E55934", // Red-orange
        lineAngle: 270
      },
    ]
  },
  "AEROBIC": {
    "old": [
      {
        time: 810,
        HR: 88.4,
        label: "Steady State",
        description: "This region shows a steady heart rate plateau during moderate intensity exercise, indicating cardiovascular equilibrium.",
        color: "#4682B4", // Steel blue
        lineAngle: 250
      },
      {
        time: 990,
        HR: 94.3,
        label: "Stress Response",
        description: "Heart rate steadily increasing as the body adapts to the increasing aerobic stress of cycling.",
        color: "#E55934", // Red-orange
        lineAngle: 75
      },
      {
        time: 1656,
        HR: 124.5,
        label: "Peak HR",
        description: "Maximum heart rate occurs during the highest intensity portion of the protocol (110 rpm), representing peak cardiovascular demand.",
        color: "#E55934", // Red-orange
        lineAngle: -5
      },
      {
        time: 1820,
        HR: 101.6,
        label: "Recovery",
        description: "Rapid decrease in heart rate during cool down phase demonstrates parasympathetic reactivation.",
        color: "#87CEEB", // Sky blue
        lineAngle: 135 
      }
    ],
    "new": [
      {
        time: 875,
        HR: 87,
        label: "Steady State",
        description: "This region shows a steady heart rate plateau during moderate intensity exercise, indicating cardiovascular equilibrium.",
        color: "#4682B4", // Steel blue
        lineAngle: 250
      },
      {
        time: 1109,
        HR: 99,
        label: "Stress Response",
        description: "Heart rate steadily increasing as the body adapts to the increasing aerobic stress of cycling.",
        color: "#E55934", // Red-orange
        lineAngle: 75
      },
      {
        time: 1871,
        HR: 119.1,
        label: "Peak HR",
        description: "Maximum heart rate occurs during the highest intensity portion of the protocol (110 rpm), representing peak cardiovascular demand.",
        color: "#E55934", // Red-orange
        lineAngle: 175
      },
      {
        time: 2082,
        HR: 101.3,
        label: "Recovery",
        description: "Rapid decrease in heart rate during cool down phase demonstrates parasympathetic reactivation.",
        color: "#87CEEB", // Sky blue
        lineAngle: 135 
      }
    ]
  },
  "ANAEROBIC": {
    "old": [
      {
        time: 210,
        HR: 91.5,
        label: "Sprint 1",
        description: "First anaerobic sprint causes rapid heart rate elevation due to maximum effort and anaerobic energy production.",
        color: "#E55934", // Red-orange
        lineAngle: 215
      },
      {
        time: 870,
        HR: 102.4,
        label: "Recovery",
        description: "Heart rate decreases during the final cool down period as the body begins clearing lactate.",
        color: "#87CEEB", // Sky blue
        lineAngle: -35
      },
      {
        time: 480,
        HR: 97.9,
        label: "Sprint 2",
        description: "Second sprint peak shows slightly higher heart rate as fatigue begins to accumulate.",
        color: "#E55934", // Red-orange
        lineAngle: 200
      },
      {
        time: 704,
        HR: 120.7,
        label: "Peak Intensity",
        description: "Heart rate reaches maximum during the final sprint, approaching the anaerobic threshold.",
        color: "#E55934", // Red-orange
        lineAngle: 160
      }
    ],
    "new": [
      {
        time: 1140,
        HR: 91.7,
        label: "Warm-up",
        description: "Initial heart rate increase as body prepares for exercise, with increased blood flow to working muscles.",
        color: "#F5B850" // Orange
      },
      {
        time: 1243,
        HR: 107.9,
        label: "Sprint 1",
        description: "First anaerobic sprint causes rapid heart rate elevation due to maximum effort and anaerobic energy production.",
        color: "#E55934", // Red-orange
        lineAngle: 225
      },
      {
        time: 1490,
        HR: 104.2,
        label: "Recovery",
        description: "Heart rate decreases during the first cool down period as the body begins clearing lactate.",
        color: "#87CEEB", // Sky blue
        lineAngle: 45
      },
      {
        time: 2091,
        HR: 107.8,
        label: "Sprint 4",
        description: "Fourth sprint peak shows decreased heart rate  peaks fatigue hits its maximum.",
        color: "#E55934", // Red-orange
        lineAngle: 315
      },
      {
        time: 1780,
        HR: 119.1,
        label: "Peak Intensity",
        description: "Heart rate reaches maximum during the third sprint, approaching the anaerobic threshold.",
        color: "#E55934", // Red-orange
        lineAngle: 195
      }
    ]
  }
};

function applyManualAnnotations(condition, protocol, data) {
  // Get annotation config for this condition and protocol
  const annotations = manualAnnotations[condition]?.[protocol] || [];
  
  if (annotations.length === 0) {
    return [];
  }
  
  // Process each annotation
  return annotations.map(annotation => {
    let hr = annotation.HR;
    
    // If HR is null or undefined, try to find the actual HR value at this time
    if (hr === null || hr === undefined) {
      // Find the closest data point to the specified time
      const closestPoint = findClosestDataPoint(data, annotation.time);
      if (closestPoint) {
        hr = closestPoint.HR;
      } else {
        // Default fallback if no data point found
        hr = 100;
      }
    }
    
    // Create a new object with all properties from the original annotation
    return {
      ...annotation, // Copy ALL properties from original annotation
      HR: hr         // Override HR if it was auto-determined
    };
  });
}

// Helper function to find closest data point to a given time
function findClosestDataPoint(data, targetTime) {
  if (!data || data.length === 0) return null;
  
  // Sort by how close the time is to the target
  const sortedByProximity = [...data].sort((a, b) => {
    return Math.abs(a.time - targetTime) - Math.abs(b.time - targetTime);
  });
  
  // Return the closest point
  return sortedByProximity[0];
}


// Information about each segment type
const segmentDescriptions = {
  // Stress protocol segments
  "Baseline": {
    description: "Initial resting measurement with minimal external stimuli to establish baseline heart rate.",
    physiological: "During this phase, heart rate is typically at resting levels (60-100 bpm). The parasympathetic nervous system is dominant, keeping heart rate low."
  },
  "Stroop": {
    description: "The Stroop Test presents color words printed in different colors. Participants must name the color, not read the word.",
    physiological: "This cognitive task activates the prefrontal cortex and induces mild mental stress, typically causing a slight increase in heart rate due to sympathetic nervous system activation."
  },
  "TMCT": {
    description: "Trier Mental Challenge Test: Mathematical tasks with time pressure and annoying sounds to induce stress.",
    physiological: "This mentally demanding task activates the sympathetic nervous system, leading to increased heart rate, blood pressure, and cortisol release - similar to a 'fight or flight' response."
  },
  "First Rest": {
    description: "Recovery period after initial stress task, allowing physiological measures to return toward baseline.",
    physiological: "Heart rate gradually decreases as parasympathetic tone increases. Full recovery may take several minutes depending on stress intensity."
  },
  "Second Rest": {
    description: "Additional recovery period after subsequent stress tasks.",
    physiological: "Similar to First Rest, but recovery rate may differ due to accumulated stress effects or adaptation."
  },
  "Real Opinion": {
    description: "Participants express their genuine opinions about controversial topics.",
    physiological: "Speaking about personal views can trigger mild emotional arousal, particularly with controversial topics, leading to slight increases in heart rate."
  },
  "Opposite Opinion": {
    description: "Participants argue against their true beliefs, creating cognitive dissonance.",
    physiological: "This creates psychological discomfort and mild stress as participants must suppress their actual opinions, often resulting in increased heart rate and skin conductance."
  },
  "Subtract Test": {
    description: "Participants count backward from 1022 in steps of 13, speaking answers aloud.",
    physiological: "This challenging mental arithmetic task increases cognitive load and performance anxiety, activating the sympathetic nervous system."
  },
  
  // Aerobic protocol segments
  "Warm up": {
    description: "Low-intensity cycling to prepare the body for exercise by increasing blood flow to muscles.",
    physiological: "Heart rate gradually increases as blood flow is redirected to muscles. Body temperature rises slightly, and respiratory rate increases."
  },
  "60 rpm": {
    description: "Cycling at 60 revolutions per minute with low-to-medium resistance.",
    physiological: "Aerobic energy system is primary, with heart rate increasing to supply oxygen to working muscles. Steady-state metabolism begins to establish."
  },
  "70 rpm": {
    description: "Cycling at 70 revolutions per minute with gradually increasing resistance.",
    physiological: "Heart rate continues to rise as oxygen demand increases. Still primarily using aerobic metabolism with minimal lactate production."
  },
  "75 rpm": {
    description: "Cycling at 75 revolutions per minute with medium resistance.",
    physiological: "Heart rate approaches 60-70% of maximum. Oxygen consumption increases proportionally with work rate."
  },
  "80 rpm": {
    description: "Cycling at 80 revolutions per minute with medium-high resistance.",
    physiological: "Heart rate typically reaches 70-75% of maximum. Aerobic metabolism remains dominant with increased calorie burn."
  },
  "85 rpm": {
    description: "Cycling at 85 revolutions per minute with medium-high resistance.",
    physiological: "Heart rate approaches 75-80% of maximum. Extended periods at this intensity improve cardiovascular endurance."
  },
  "90 rpm": {
    description: "Cycling at 90 revolutions per minute with high resistance.",
    physiological: "Heart rate typically reaches 80-85% of maximum. Approaching the upper limits of purely aerobic exercise."
  },
  "95 rpm": {
    description: "Cycling at 95 revolutions per minute with high resistance.",
    physiological: "Heart rate may reach 85-90% of maximum. Some anaerobic metabolism begins to supplement aerobic energy production."
  },
  "90/95 rpm": {
    description: "Cycling at 90-95 revolutions per minute with high resistance (adapted protocol).",
    physiological: "Heart rate typically 85-90% of maximum. Near the aerobic-anaerobic threshold where lactate begins to accumulate."
  },
  "100 rpm": {
    description: "Cycling at 100 revolutions per minute with very high resistance.",
    physiological: "Heart rate approaches 90% of maximum. Anaerobic metabolism increasingly contributes to energy production."
  },
  "105 rpm": {
    description: "Cycling at 105 revolutions per minute with very high resistance.",
    physiological: "Heart rate may exceed 90% of maximum. Significant anaerobic contribution with increased lactate production."
  },
  "110 rpm": {
    description: "Cycling at 110 revolutions per minute with maximum tolerable resistance.",
    physiological: "Heart rate approaches maximum (90-95%). Substantial anaerobic metabolism with rapid lactate accumulation."
  },
  "Cool Down": {
    description: "Gradual reduction in exercise intensity to safely return heart rate toward baseline.",
    physiological: "Heart rate slowly decreases as oxygen demand reduces. Blood is redistributed back to core organs from muscles."
  },
  "Rest": {
    description: "Complete cessation of exercise to allow full recovery.",
    physiological: "Heart rate returns to near-baseline levels. Body continues to consume oxygen at elevated rates (EPOC - excess post-exercise oxygen consumption)."
  },
  
  // Anaerobic protocol segments
  "Sprint 1": {
    description: "Initial maximum effort cycling against high resistance for 30-45 seconds.",
    physiological: "Heart rate rapidly increases toward maximum. Primary energy comes from ATP-CP system and anaerobic glycolysis, leading to lactate accumulation."
  },
  "Sprint 2": {
    description: "Second maximum effort cycling against high resistance, following recovery period.",
    physiological: "Heart rate again approaches maximum, but peak may be lower due to fatigue. Continued reliance on anaerobic metabolism with increased lactate."
  },
  "Sprint 3": {
    description: "Third maximum effort cycling against high resistance.",
    physiological: "Heart rate response may be blunted due to accumulated fatigue. ATP-CP stores significantly depleted, increasing reliance on glycolysis."
  },
  "Sprint 4": {
    description: "Final maximum effort cycling against high resistance (in new protocol only).",
    physiological: "Heart rate may be lower despite maximal perceived exertion due to fatigue. Significant lactate accumulation limits performance."
  }
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

// Comparative differences between old and new protocols
const protocolComparisons = {
  "STRESS": [
    { 
      feature: "Duration", 
      old: "19:30 minutes", 
      new: "27:30 minutes",
      explanation: "The new protocol is longer, allowing more recovery time between stressors."
    },
    { 
      feature: "Rest Periods", 
      old: "Two 5-minute rest periods", 
      new: "Two 10-minute rest periods",
      explanation: "Longer rest periods in the new protocol allow for more complete recovery between tasks."
    },
    { 
      feature: "Stressors", 
      old: "Includes Stroop test", 
      new: "Omits Stroop test",
      explanation: "The new protocol omits the Stroop test to focus on other stressors."
    },
    { 
      feature: "Task Order", 
      old: "Opinion tasks before second rest", 
      new: "Opinion tasks after first rest",
      explanation: "The new protocol places opinion tasks earlier, when participant is less fatigued."
    }
  ],
  "AEROBIC": [
    { 
      feature: "Duration", 
      old: "35 minutes", 
      new: "32 minutes",
      explanation: "The new protocol is slightly shorter but with different intensity distribution."
    },
    { 
      feature: "Baseline", 
      old: "None", 
      new: "4:30 minute baseline",
      explanation: "The new protocol adds a baseline period to establish resting heart rate."
    },
    { 
      feature: "Intensity Profile", 
      old: "Gradual increases through many steps", 
      new: "Longer sustained periods at key intensities",
      explanation: "The new protocol emphasizes longer durations at specific intensities (especially 85 rpm)."
    },
    { 
      feature: "Peak Intensity", 
      old: "Reaches 110 rpm", 
      new: "Peaks at 90/95 rpm",
      explanation: "The new protocol has a lower peak intensity but sustains moderate-high intensity longer."
    }
  ],
  "ANAEROBIC": [
    { 
      feature: "Number of Sprints", 
      old: "3 sprints", 
      new: "4 sprints",
      explanation: "The new protocol adds a fourth sprint, further challenging anaerobic capacity."
    },
    { 
      feature: "Sprint Duration", 
      old: "30 seconds each", 
      new: "45 seconds each",
      explanation: "Sprints are 50% longer in the new protocol, increasing anaerobic stress."
    },
    { 
      feature: "Total Duration", 
      old: "18:30 minutes", 
      new: "29:30 minutes",
      explanation: "The new protocol is significantly longer with more anaerobic work."
    },
    { 
      feature: "Baseline", 
      old: "None", 
      new: "4:30 minute baseline",
      explanation: "The new protocol adds a baseline period to establish resting heart rate."
    }
  ]
};

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
    
    // Get the offset for this condition and protocol
    const offset = timelineOffsets[condition][protocol] || 0;
    
    // Calculate segment positions
    let currentPosition = 0;
    const timelineSegments = segments.map(segment => {
      const start = currentPosition + offset;
      currentPosition += segment.duration;
      return {
        ...segment,
        start,
        end: currentPosition + offset,
        originalStart: currentPosition - segment.duration,
        originalEnd: currentPosition
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
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        // Update selected segment and condition
        selectedSegment = d;
        currentCondition = condition;
        currentProtocol = protocol;
        
        // Show segment info
        showSegmentInfo(condition, protocol, d);
        
        // Highlight selected segment
        d3.select(`#chart-${condition}`)
          .selectAll(".segment-rect")
          .style("stroke-width", 1)
          .style("stroke", "#333");
        
        d3.select(this)
          .style("stroke-width", 3)
          .style("stroke", "#000");
      })
      .on("mouseover", function(event, d) {
        // Highlight on hover
        if (d !== selectedSegment) {
          d3.select(this)
            .style("stroke-width", 2)
            .style("stroke", "#555");
        }
        
        // Show tooltip with name and duration
        const minutes = Math.floor(d.duration / 60);
        const seconds = d.duration % 60;
        const durationStr = seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}m`;
        
        d3.select("#tooltip")
          .style("opacity", 1)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px")
          .html(`
            <div class="tooltip-header">${d.name}</div>
            <div>Duration: ${durationStr}</div>
            <div class="tooltip-hint">Click for details</div>
          `);
      })
      .on("mouseout", function(event, d) {
        // Reset styling on mouseout if not selected
        if (d !== selectedSegment) {
          d3.select(this)
            .style("stroke-width", 1)
            .style("stroke", "#333");
        }
        
        // Hide tooltip
        d3.select("#tooltip")
          .style("opacity", 0);
      });
    
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
        let rotation = 0;
        
        // Apply rotation based on specific condition and protocol combinations
        if (condition === "AEROBIC" && protocol === "new" && d.name === "70 rpm") {
          // Always rotate labels for new aerobic protocol
          rotation = -45;
        } else if (condition === "AEROBIC" && protocol === "new" && d.name === "75 rpm") {
            // Rotate all sprint labels in anaerobic condition
            rotation = -45;
        } else if (condition === "AEROBIC" && protocol === "new" && d.name === "80 rpm") {
            // Rotate all sprint labels in anaerobic condition
            rotation = -45;
        } else {
          // For other protocols/conditions, only rotate if segment is narrow
          //rotation = segmentWidth < 60 ? -45 : 0;
        }
        
        const x = xScale(d.start + (d.end - d.start) / 2);
        const y = timelineHeight / 2 + 25;
        return rotation ? `rotate(${rotation},${x},${y})` : null;
      })
      .style("font-size", "11px")
      .style("font-weight", "bold")
      // In drawTimeline, modify the label text function
      .text(d => {
        const segmentWidth = xScale(d.end) - xScale(d.start);
        // Use abbreviations for narrow segments
        if (d.name === "Baseline") return "BL";
        if (d.name === "Cool Down") return "CD";
        if (d.name === "Real Opinion") return "";
        if (d.name === "Opposite Opinion") return "";
        if (d.name === "Subtract Test") return "ST";
        if (d.name === "Sprint 1") return "SP1";
        if (d.name === "Sprint 2") return "SP2";
        if (d.name === "Sprint 3") return "SP3";
        if (d.name === "Sprint 4") return "SP4";
        if (d.name === "Warm up") return "WU";
            
            // Add more abbreviations as needed
        
        return d.name;
    })
    
    // Add time markers
    timelineGroup.selectAll(".time-marker")
        .data(timelineSegments.filter(d => {
            // Only include time markers for segments wider than 30px
            const segmentWidth = xScale(d.end) - xScale(d.start);
            return segmentWidth >= 30;
        }))
        .enter()
        .append("text")
        .attr("class", "time-marker")
        .attr("x", d => xScale(d.start + (d.end - d.start) / 2))
        .attr("y", timelineHeight / 2 + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .text(d => {
            const minutes = Math.floor(d.duration / 60);
            const seconds = d.duration % 60;
            return seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}m`;
    });
}

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

// Function to find a segment containing a specific time point
function findSegmentAtTime(condition, protocol, time) {
  if (!condition || !protocol || !protocolSegments[condition] || !protocolSegments[condition][protocol]) {
    return null;
  }
  
  const offset = timelineOffsets[condition][protocol] || 0;

  const segments = protocolSegments[condition][protocol];
  let currentTime = 0 + offset;
  
  for (const segment of segments) {
    const endTime = currentTime + segment.duration;
    if (time >= currentTime && time < endTime) {
      return {
        ...segment,
        startTime: currentTime,
        endTime: endTime
      };
    }
    currentTime = endTime;
  }
  
  return null;
}

// Function to show segment information
function showSegmentInfo(condition, protocol, segment) {
    const infoPanel = document.getElementById("segment-info-panel");
    const contentDiv = infoPanel.querySelector(".info-content");
    
    // Get detailed description from segmentDescriptions
    const segmentDetail = segmentDescriptions[segment.name];
    
    if (!segmentDetail) {
      contentDiv.innerHTML = `
        <h3>${segment.name}</h3>
        <p>No detailed information available for this segment.</p>
      `;
    } else {
      // Convert duration to minutes and seconds
      const minutes = Math.floor(segment.duration / 60);
      const seconds = segment.duration % 60;
      const durationStr = seconds > 0 ? 
        `${minutes}:${seconds.toString().padStart(2, '0')}` : 
        `${minutes} min`;
      
      contentDiv.innerHTML = `
        <h3>${segment.name}</h3>
        <div class="segment-duration">Duration: ${durationStr}</div>
        <div class="segment-indicator" style="background-color: ${segment.color};"></div>
        <div class="segment-description">
          <h4>Description</h4>
          <p>${segmentDetail.description}</p>
          <h4>Physiological Response</h4>
          <p>${segmentDetail.physiological}</p>
        </div>
      `;
    }
    
    infoPanel.style.display = "block";
  }

// Create info panel for segment details
function createInfoPanel() {
  const infoPanel = document.createElement("div");
  infoPanel.id = "segment-info-panel";
  infoPanel.className = "info-panel";
  infoPanel.style.display = "none";
  
  document.getElementById("hr1").appendChild(infoPanel);
  
  // Add close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = "×";
  closeButton.addEventListener("click", () => {
    infoPanel.style.display = "none";
    // Remove highlight from selected segment if any
    if (selectedSegment && currentCondition) {
      d3.select(`#chart-${currentCondition}`)
        .selectAll(".segment-rect")
        .style("stroke-width", 1);
    }
    selectedSegment = null;
  });
  
  infoPanel.appendChild(closeButton);
  
  // Add content container
  const contentDiv = document.createElement("div");
  contentDiv.className = "info-content";
  infoPanel.appendChild(contentDiv);
  
  return infoPanel;
}

// Create protocol comparison panel
function createComparisonPanel() {
  const comparisonPanel = document.createElement("div");
  comparisonPanel.id = "protocol-comparison-panel";
  comparisonPanel.className = "comparison-panel";
  comparisonPanel.style.display = "none";
  
  document.getElementById("hr1").appendChild(comparisonPanel);
  
  // Add close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = "×";
  closeButton.addEventListener("click", () => {
    comparisonPanel.style.display = "none";
  });
  
  comparisonPanel.appendChild(closeButton);
  
  // Add content container
  const contentDiv = document.createElement("div");
  contentDiv.className = "comparison-content";
  comparisonPanel.appendChild(contentDiv);
  
  return comparisonPanel;
}

// Create legend for physiological zones
function createPhysiologicalLegend() {
  const legendContainer = document.createElement("div");
  legendContainer.id = "physiological-legend";
  legendContainer.className = "physiological-legend";
  
  // Define the zones
  const zones = [
    { name: "Rest Zone", range: "60-80 bpm", color: "#A4D16F", description: "Minimal physiological stress. Parasympathetic system dominant." },
    { name: "Light Activity", range: "81-100 bpm", color: "#F5B850", description: "Slight activation of sympathetic system. Increased cardiac output." },
    { name: "Moderate Activity", range: "101-120 bpm", color: "#F0914F", description: "Significant sympathetic activation. Increased respiration and metabolism." },
    { name: "High Intensity", range: "121-140+ bpm", color: "#E55934", description: "Strong sympathetic dominance. Near anaerobic threshold at upper range." }
  ];
  
  const title = document.createElement("h4");
  title.textContent = "Heart Rate Zones";
  legendContainer.appendChild(title);
  
  zones.forEach(zone => {
    const zoneElement = document.createElement("div");
    zoneElement.className = "legend-item";
    
    const colorSwatch = document.createElement("div");
    colorSwatch.className = "color-swatch";
    colorSwatch.style.backgroundColor = zone.color;
    
    const zoneText = document.createElement("div");
    zoneText.className = "zone-text";
    zoneText.innerHTML = `<strong>${zone.name}</strong>: ${zone.range}`;
    
    zoneElement.appendChild(colorSwatch);
    zoneElement.appendChild(zoneText);
    
    // Make legend items clickable to show descriptions
    zoneElement.addEventListener("click", () => {
      showZoneDescription(zone);
    });
    
    legendContainer.appendChild(zoneElement);
  });
  
  document.getElementById("hr1").appendChild(legendContainer);
  
  return legendContainer;
}

// Function to show zone description
function showZoneDescription(zone) {
  const infoPanel = document.getElementById("segment-info-panel");
  const contentDiv = infoPanel.querySelector(".info-content");
  
  contentDiv.innerHTML = `
    <h3>${zone.name} (${zone.range})</h3>
    <p>${zone.description}</p>
    <div class="zone-indicator" style="background-color: ${zone.color};"></div>
  `;
  
  infoPanel.style.display = "block";
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
    
    // Add "View Differences" button
    const diffButton = document.createElement("button");
    diffButton.className = "view-differences-btn";
    diffButton.textContent = "View Protocol Differences";
    diffButton.addEventListener("click", () => {
      showProtocolComparison(condition);
    });
    controlDiv.appendChild(diffButton);
    
    select.value = "old"; // Default to old protocol
    select.addEventListener("change", function() {
      // Update current protocol tracking
      currentProtocol = this.value;
      currentCondition = condition;
      
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
    .attr("transform", `translate(${margin.left}, ${margin.top + height + 40})`);
  
  // Create group for annotations
  const annotationsGroup = svg.append("g")
    .attr("class", "annotations-group")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const xScale = d3.scaleLinear()
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([
      customYScaleRanges[condition] ? customYScaleRanges[condition].min : fixedYMin,
      customYScaleRanges[condition] ? customYScaleRanges[condition].max : fixedYMax
    ])
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
    .attr("transform", `translate(${width / 2}, ${height + 32})`)
    .style("text-anchor", "middle")
    .text("Time (s)");

    chartGroup.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Average HR (bpm)");

    // Create path for the line
    chartGroup.append("path")
    .attr("class", "red-line")
    .attr("fill", "none")
    .attr("stroke", "#ff6666")
    .attr("stroke-width", 2);

    // Add physiological zone bands
    const minY = customYScaleRanges[condition] ? customYScaleRanges[condition].min : fixedYMin;
    const maxY = customYScaleRanges[condition] ? customYScaleRanges[condition].max : fixedYMax;

    const physiologicalZones = [
      { min: minY, max: Math.min(80, maxY), color: "#A4D16F", opacity: 0.1 },       // Rest zone
      { min: Math.max(80, minY), max: Math.min(100, maxY), color: "#F5B850", opacity: 0.1 },  // Light activity
      { min: Math.max(100, minY), max: Math.min(120, maxY), color: "#F0914F", opacity: 0.1 }, // Moderate activity
      { min: Math.max(120, minY), max: maxY, color: "#E55934", opacity: 0.1 }       // High intensity
    ];

// Only add zones that fall within our y-axis range
  physiologicalZones.forEach(zone => {
    if (zone.max > zone.min) {
      chartGroup.append("rect")
        .attr("class", "physiological-zone")
        .attr("x", 0)
        .attr("y", yScale(zone.max))
        .attr("width", width)
        .attr("height", yScale(zone.min) - yScale(zone.max))
        .attr("fill", zone.color)
        .attr("opacity", zone.opacity);
    }
  });

    // Store references to SVG elements
    svgContainers[condition] = {
    svg,
    chartGroup,
    timelineGroup,
    annotationsGroup,
    xScale,
    yScale,
    xAxisGroup,
    yAxisGroup,
    xGridGroup,
    yGridGroup,
    lineGenerator
    };
}

// Function to add feature annotations - modified to use manual annotations
// Function to add feature annotations - modified to use manual annotations
function addFeatureAnnotations(condition, protocol, avgData) {
  const { annotationsGroup, xScale, yScale } = svgContainers[condition];
  
  // Clear existing annotations
  annotationsGroup.selectAll("*").remove();
  
  // Skip if no data
  if (!avgData || avgData.length === 0) return;
  
  // Get manual annotations for this condition and protocol
  let features = [];
  
  // If manual annotations are defined, use those
  if (manualAnnotations[condition] && manualAnnotations[condition][protocol]) {
    features = applyManualAnnotations(condition, protocol, avgData);
  } else {
    // Fall back to auto-detection if no manual annotations are defined
    features = detectInterestingFeatures(condition, protocol, avgData);
  }
  
  // Add annotations for each feature
  features.forEach((feature, i) => {
    // Create annotation group
    const annotationGroup = annotationsGroup.append("g")
      .attr("class", "annotation")
      .attr("transform", `translate(${xScale(feature.time)}, ${yScale(feature.HR)})`);
    
    // Add circle marker
    annotationGroup.append("circle")
      .attr("r", 5)
      .attr("fill", "white")
      .attr("stroke", feature.color)
      .attr("stroke-width", 2);
    
    // Calculate line angle (in radians) - default alternates left/right
    const defaultLineDirection = i % 2 === 0 ? -1 : 1; // Alternate direction
    // Use lineAngle from feature if provided, otherwise use default direction
    const lineAngle = feature.lineAngle !== undefined 
      ? (feature.lineAngle * Math.PI / 180) // Convert degrees to radians
      : (defaultLineDirection > 0 ? 0 : Math.PI); // 0 radians is right, PI radians is left
    
    // Calculate line end point
    const lineLength = 50;
    const lineEndX = Math.cos(lineAngle) * lineLength;
    const lineEndY = Math.sin(lineAngle) * lineLength;
    
    // Add connecting line with specified angle
    annotationGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", lineEndX)
      .attr("y2", lineEndY)
      .attr("stroke", feature.color)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    
    // Determine text anchor based on line angle
    // If line points right (angle between -90 and 90 degrees), text starts at end
    // If line points left (angle outside that range), text ends at end
    const isPointingRight = Math.cos(lineAngle) >= 0;
    const textAnchor = isPointingRight ? "start" : "end";
    
    // Small offset to prevent text from touching the line
    const textOffsetX = isPointingRight ? 5 : -5;
    
    // Calculate text position
    const textX = lineEndX + textOffsetX;
    const textY = lineEndY;
    
    // Add text label with rotation around its position
    annotationGroup.append("text")
      .attr("x", textX)
      .attr("y", textY)
      .attr("text-anchor", textAnchor)
      .attr("alignment-baseline", "middle")
      .attr("fill", feature.color)
      .attr("transform", function() {
        // Only apply rotation if specified
        const angle = feature.textAngle || 0;
        if (angle === 0) return null;
        // Rotate around the text position
        return `rotate(${angle},${textX},${textY})`;
      })
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(feature.label);
    
    // Make the annotation interactive
    annotationGroup
      .style("cursor", "pointer")
      .on("click", () => showFeatureDescription(feature))
      .on("mouseover", function() {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 7);
      })
      .on("mouseout", function() {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 5);
      });
  });
}

// Function to show feature description - unchanged
function showFeatureDescription(feature) {
  const infoPanel = document.getElementById("segment-info-panel");
  const contentDiv = infoPanel.querySelector(".info-content");
  
  contentDiv.innerHTML = `
    <h3>${feature.label}</h3>
    <div class="feature-hr">Heart Rate: ${feature.HR.toFixed(1)} bpm</div>
    <div class="feature-time">Time: ${Math.floor(feature.time / 60)}:${(feature.time % 60).toString().padStart(2, '0')}</div>
    <div class="feature-indicator" style="background-color: ${feature.color};"></div>
    <div class="feature-description">
      <p>${feature.description}</p>
    </div>
  `;
  
  infoPanel.style.display = "block";
}

// Function to detect interesting features in the data
function detectInterestingFeatures(condition, protocol, data) {
  const features = [];
  
  // Skip if insufficient data
  if (data.length < 10) return features;
  
  // Smooth the data to reduce noise
  const smoothedData = smoothData(data, 5);
  
  // 1. Find the highest heart rate
  const maxHR = d3.max(smoothedData, d => d.HR);
  const maxPoint = smoothedData.find(d => d.HR === maxHR);
  if (maxPoint) {
    features.push({
      time: maxPoint.time,
      HR: maxPoint.HR,
      label: "Peak HR",
      description: "This represents the maximum heart rate recorded during the protocol. Higher heart rates indicate increased cardiovascular demand and sympathetic nervous system activity.",
      color: "#E55934"  // Red-orange
    });
  }
  
  // 2. Find significant rapid increases (more than 15 bpm in 60 seconds)
  for (let i = 60; i < smoothedData.length; i++) {
    const change = smoothedData[i].HR - smoothedData[i-60].HR;
    if (change > 15) {
      // Check if this is a local maximum of increases
      let isLocalMax = true;
      for (let j = Math.max(0, i-30); j < Math.min(smoothedData.length, i+30); j++) {
        if (j !== i && smoothedData[j].HR - smoothedData[Math.max(0, j-60)].HR > change) {
          isLocalMax = false;
          break;
        }
      }
      
      if (isLocalMax) {
        features.push({
          time: smoothedData[i].time,
          HR: smoothedData[i].HR,
          label: "Rapid Increase",
          description: "This point shows a significant increase in heart rate (+15 bpm in 60 seconds), indicating a sympathetic nervous system response to either physical or mental stress.",
          color: "#F0914F"  // Orange
        });
        i += 120; // Skip ahead to avoid detecting multiple points in same increase
      }
    }
  }
  
  // 3. Find steady-state periods (heart rate variation < 5 bpm for 2+ minutes)
  for (let i = 120; i < smoothedData.length - 120; i += 60) {
    const segment = smoothedData.slice(i, i + 120);
    const range = d3.max(segment, d => d.HR) - d3.min(segment, d => d.HR);
    
    if (range < 5 && segment[0].HR > 90) {  // Only interesting if HR is elevated
      features.push({
        time: smoothedData[i + 60].time,  // Middle of the steady period
        HR: smoothedData[i + 60].HR,
        label: "Steady State",
        description: "This region shows a steady heart rate over an extended period, indicating cardiovascular equilibrium where oxygen delivery matches demand. This is characteristic of sustainable aerobic exercise.",
        color: "#4682B4"  // Steel blue
      });
      i += 180; // Skip ahead
    }
  }
  
  // 4. Find rapid recovery periods (decrease of 15+ bpm in 2 minutes)
  for (let i = 120; i < smoothedData.length; i++) {
    const change = smoothedData[i-120].HR - smoothedData[i].HR;
    if (change > 15) {
      // Check if this is a local maximum of decreases
      let isLocalMax = true;
      for (let j = Math.max(120, i-30); j < Math.min(smoothedData.length, i+30); j++) {
        if (j !== i && smoothedData[j-120].HR - smoothedData[j].HR > change) {
          isLocalMax = false;
          break;
        }
      }
      
      if (isLocalMax) {
        features.push({
          time: smoothedData[i].time,
          HR: smoothedData[i].HR,
          label: "Recovery",
          description: "This shows a significant decrease in heart rate during recovery, indicating parasympathetic reactivation. The rate of recovery is an important indicator of cardiovascular fitness.",
          color: "#87CEEB"  // Sky blue
        });
        i += 120; // Skip ahead
      }
    }
  }
  
  // 5. Find condition-specific features
  if (condition === "ANAEROBIC") {
    // Look for repeated sprint patterns (rapid increase followed by recovery)
    let lastPeak = -1;
    for (let i = 1; i < smoothedData.length - 1; i++) {
      // Find local peaks
      if (smoothedData[i].HR > smoothedData[i-1].HR && 
          smoothedData[i].HR > smoothedData[i+1].HR && 
          smoothedData[i].HR > 110) {
        
        // If we've found a previous peak and this one is separated by reasonable time
        if (lastPeak > 0 && smoothedData[i].time - smoothedData[lastPeak].time > 200) {
          features.push({
            time: smoothedData[i].time,
            HR: smoothedData[i].HR,
            label: "Sprint Peak",
            description: "This heart rate peak corresponds to the end of a maximum effort sprint, when anaerobic metabolism has been pushed to its limit. The repeated pattern of peaks and recoveries is characteristic of anaerobic interval training.",
            color: "#9370DB"  // Medium purple
          });
        }
        
        lastPeak = i;
      }
    }
  } else if (condition === "AEROBIC") {
    // Look for aerobic threshold crossing (around 70% of max HR, ~120-130 bpm)
    for (let i = 60; i < smoothedData.length - 60; i++) {
      if (smoothedData[i-60].HR < 120 && smoothedData[i].HR >= 120 && smoothedData[i+60].HR >= 120) {
        features.push({
          time: smoothedData[i].time,
          HR: smoothedData[i].HR,
          label: "Aerobic Threshold",
          description: "This point marks the crossing of the aerobic threshold, when exercise intensity has increased enough that aerobic metabolism becomes the dominant energy source. This is an important training zone for cardiovascular fitness.",
          color: "#20B2AA"  // Light sea green
        });
        break; // Only add one threshold crossing
      }
    }
  } else if (condition === "STRESS") {
    // Look for stress reactions (small but significant increases during mental tasks)
    const segments = protocolSegments[condition][protocol];
    if (segments) {
      let currentTime = 0;
      for (const segment of segments) {
        const startTime = currentTime;
        const endTime = startTime + segment.duration;
        
        // Only check mental stressor segments
        if (["TMCT", "Stroop", "Subtract Test", "Real Opinion", "Opposite Opinion"].includes(segment.name)) {
          // Find data points in this segment
          const segmentData = smoothedData.filter(d => d.time >= startTime && d.time < endTime);
          
          if (segmentData.length > 0) {
            // Get the maximum point in this segment
            const maxSegmentHR = d3.max(segmentData, d => d.HR);
            const maxSegmentPoint = segmentData.find(d => d.HR === maxSegmentHR);
            
            if (maxSegmentPoint && maxSegmentPoint.HR > 80) { // Only if there's a noticeable response
              features.push({
                time: maxSegmentPoint.time,
                HR: maxSegmentPoint.HR,
                label: "Stress Response",
                description: `This peak shows the cardiovascular response to the ${segment.name} mental stressor. Even without physical exertion, psychological stress activates the sympathetic nervous system, increasing heart rate.`,
                color: "#FF69B4"  // Hot pink
              });
            }
          }
        }
        
        currentTime = endTime;
      }
    }
  }
  
  // Limit to maximum 4 features to avoid cluttering
  return features.slice(0, 4);
}

// Function to smooth data using simple moving average
function smoothData(data, windowSize) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - windowSize); j <= Math.min(data.length - 1, i + windowSize); j++) {
      sum += data[j].HR;
      count++;
    }
    
    result.push({
      time: data[i].time,
      HR: sum / count
    });
  }
  return result;
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
  
  // Clear any existing comparison
  const chartGroup = svgContainers[condition].chartGroup;
  chartGroup.select(".blue-line").remove();
  chartGroup.select(".chart-legend").remove();
  
  // Update current tracking variables
  currentCondition = condition;
  currentProtocol = protocol;
  
  // Get references for this condition
  const {
    svg,
    xScale,
    yScale,
    xAxisGroup,
    yAxisGroup,
    xGridGroup,
    yGridGroup,
    lineGenerator,
    annotationsGroup
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
  
  const offset = timeOffsets[condition][protocol] || 0;
  const offsetData = avgData.map(d => ({
    time: d.time - offset,
    HR: d.HR,
    originalTime: d.time // Keep original time for reference
  }));

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
    .datum(offsetData)
    .transition()
    .duration(animationDuration)
    .attr("d", lineGenerator)
    .style("opacity", 1);

  // Add feature annotations with offset data
  addFeatureAnnotations(condition, protocol, offsetData);
  
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
      showTooltip(avgData[0], xVal);
    } else if (idx >= avgData.length) {
      showTooltip(avgData[avgData.length - 1], xVal);
    } else {
      const d0 = avgData[idx - 1];
      const d1 = avgData[idx];
      
      // Find the closest point
      const dClosest = (xVal - d0.time) < (d1.time - xVal) ? d0 : d1;
      showTooltip(dClosest, xVal);
    }
    
    function showTooltip(dataPoint, currentTime) {
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
      let currentSegment = null;
      if (protocol !== "unknown") {
        currentSegment = findSegmentAtTime(condition, protocol, currentTime);
      }
      
      // Get heart rate zone
      const hrZone = getHeartRateZone(dataPoint.HR);
      
      // Build enhanced tooltip content
      let tooltipContent = `
        <div class="tooltip-header">${currentSegment ? currentSegment.name : "Unknown Phase"}</div>
        <div class="tooltip-hr">Heart Rate: <b>${dataPoint.HR.toFixed(1)} bpm</b></div>
        <div class="tooltip-time">Time: ${timeStr}</div>
        <div class="tooltip-zone">Zone: <span style="color:${hrZone.color}">${hrZone.name}</span></div>
      `;
      
      // Update tooltip position to follow mouse
      tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(tooltipContent);
    }
    
    // Get heart rate zone based on heart rate value
    function getHeartRateZone(hr) {
      if (hr < 80) {
        return { name: "Rest Zone", color: "#A4D16F" };
      } else if (hr < 100) {
        return { name: "Light Activity", color: "#F5B850" };
      } else if (hr < 120) {
        return { name: "Moderate Activity", color: "#F0914F" };
      } else {
        return { name: "High Intensity", color: "#E55934" };
      }
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
  if (document.getElementById("controls")) {
    document.getElementById("controls").style.display = "none";
  }
  
  // Create info panel for segment details
  createInfoPanel();
  
  // Create protocol comparison panel
  createComparisonPanel();
  
  // Create physiological legend
  createPhysiologicalLegend();
  
  // Create tooltip div if it doesn't exist
  if (!document.getElementById("tooltip")) {
    const tooltipDiv = document.createElement("div");
    tooltipDiv.id = "tooltip";
    tooltipDiv.className = "tooltip";
    tooltipDiv.style.opacity = 0;
    document.body.appendChild(tooltipDiv);
  }
  
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
      
      // Add a brief introduction section
      addIntroductionSection();
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

// Function to add introduction section
function addIntroductionSection() {
  const introDiv = document.createElement("div");
  introDiv.className = "introduction";
  introDiv.innerHTML = `
    <h2>Heart Rate Responses to Stress and Exercise</h2>
    <p>This interactive visualization shows heart rate responses during structured protocols for stress induction, aerobic exercise, and anaerobic exercise.
    Protocols for each visual is placed approximately where testing began. Because data is averaged for all participants, scales will not line up directly.</p>
    <p class="explore">Explore the visualization by:</p>
    <ul class="explore">
      <li><strong>Hovering</strong> over the chart to see detailed heart rate data and physiological context</li>
      <li><strong>Clicking</strong> on timeline segments to learn more details about each protocol phase</li>
      <li><strong>Clicking</strong> the annotated features that highlight key physiological responses</li>
    </ul>
  `;
  
  // Add before the chart
  const chartElement = document.getElementById("chart");
  if (chartElement && chartElement.parentNode) {
    chartElement.parentNode.insertBefore(introDiv, chartElement);
  } else {
    // Fallback - just append to the container
    const container = document.getElementById("hr1");
    if (container) {
      container.prepend(introDiv);
    }
  }
}

// Function to show protocol comparison
function showProtocolComparison(condition) {
  const comparisonPanel = document.getElementById("protocol-comparison-panel");
  const contentDiv = comparisonPanel.querySelector(".comparison-content");
  
  // Get comparison data for this condition
  const comparisons = protocolComparisons[condition];
  
  if (!comparisons) {
    contentDiv.innerHTML = "<p>No comparison data available for this condition.</p>";
    comparisonPanel.style.display = "block";
    return;
  }
  
  // Create comparison content
  let comparisonHTML = `
    <h3>${condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase()} Protocol Comparison</h3>
    <p>Key differences between the original and new protocols:</p>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Feature</th>
          <th>Old Protocol</th>
          <th>New Protocol</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  comparisons.forEach(item => {
    comparisonHTML += `
      <tr>
        <td>${item.feature}</td>
        <td>${item.old}</td>
        <td>${item.new}</td>
      </tr>
    `;
  });
  
  comparisonHTML += `
      </tbody>
    </table>
    <div class="comparison-explanation">
      <h4>Impact on Physiological Response:</h4>
      <ul>
  `;
  
  comparisons.forEach(item => {
    comparisonHTML += `<li><strong>${item.feature}:</strong> ${item.explanation}</li>`;
  });
  
  comparisonHTML += `
      </ul>
    </div>
  `;
  
  contentDiv.innerHTML = comparisonHTML;
  comparisonPanel.style.display = "block";
}

