// Define margins, width, and height for the chart area
const margin = {top: 70, right: 30, bottom: 60, left: 80};
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

//Noza's notes to understand better :) 

// Selecting a container and appending SVG 
const svg = d3.select("#chart-container") //selevting specific container with id "chart-container"
  .append("svg") //SVG (Scalable Vector Graphics) is used to draw shapes, paths, and other graphics
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g") //Appending g element to the SVG. Which means combining several SVG shapes into a group that can be treated as a single object
    .attr("transform", `translate(${margin.left},${margin.top})`); //moving the group (with all contents) according to margin.left and margin.top

// Creating a tooltip
const tooltip = d3.select("body") //selecting the body element of the HTML to append dynamic elements like tooltip 
  .append("div") //a new div element is appended to the body, this div will be used to show the tooltip
  .attr("class", "tooltip") //assigning class name "tooltip" to the div, useful for styling or selecting tooltip in the css and js
  //just adding bunch of styling into the tooltip element 
  .style("position", "absolute")
  .style("padding", "10px")
  .style("background-color", "steelblue")
  .style("color", "white")
  .style("border", "1px solid white")
  .style("border-radius", "10px")
  .style("display", "none")
  .style("opacity", 0.75);

// Load data from CSV file
d3.csv("airlines.csv").then(function(data) { //loading csv file then data parameter contains parsed csv file where each row converted into a js object
  const parseDate = d3.timeParse("%m/%d/%y"); //parsing strings into "Date" object based on specific format
  data.forEach(d => { //looping through each element d in the data array where d represents a row from csv file
    d.date = parseDate(d.date); //for each row the date which is originally string is converted into Date object using parseDate function created earlier 
    d.price = +d.price; //+ is used to convert the "price" string from the csv into a number 
  });

  // Define color for each airline
  const color = { "AAL": "gray", "UAL": "steelblue", "DAL": "firebrick" };

  // Setup scales
  const xScale = d3.scaleTime() //function creates a time scale for dealing with time or date values. Used for plotting data that involves dates and times
    .domain(d3.extent(data, d => d.date)) //domain defines max and min values that the scale will handle where d3.extent function that returns max and min values in an array. This tells the scale to cover the range from the earliest to the latest
    .range([0, width]); //spatial mapping allows the dates to be plotted horizontally
  const yScale = d3.scaleLinear() //creates a linear scale which is used for quantitative data
    .domain([0, d3.max(data, d => d.price)]) //domain is set from 0 to the max price found in the array
    .range([height, 0]); //y scale is inverted by setting from height(usually the bottom of the SVG canvas) to 0(the top of the SVG canvas). 

  // Draw axes
  svg.append("g") //appending a new group to svg
    .attr("transform", `translate(0,${height})`) //setting a transformation on the group. The group is moved 0 pixels to the right(along the x axis) and height pixels down(along the y axis)
    .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b %Y"))); //call() function used to invoke other functions on selected element. Here applying d3.axisBottom to create horizontal axis
    //xScale is a function to map data values to the position on the screen
    //.ticks(d3.timeMonth.every(1)) specifies the intervals of the ticks along the x axis 
    //.tickFormat(d3.timeFormat("%b %Y")) formats the tick labels to display the date in abbreviated form
  svg.append("g") //appending another group element to svg for the y-axis
    .call(d3.axisLeft(yScale)); //creating a vertical axis using d3.axisLeft function
    //yScale maps out data values to screen positions 

  // Draw lines for each airline
  const line = d3.line() //d3.line() creates a line generator 
    .x(d => xScale(d.date)) //this function takes an object d and returns the x-coordinate by applying xScale to d.date
    .y(d => yScale(d.price)); //similarly converting d.price using the yScale
  const airlines = d3.groups(data, d => d.airline); //d3.groups is a function that groups data into array of arrays
  //each sub-array contains: airline name and data points associated with that airline
  airlines.forEach(([airline, data]) => { //iterating over airlines array. Each element in the array where the first element is the name of the airline and the second array is data points of that airline
    svg.append("path")
      .datum(data) //.datum(data): Binds the specific airline's data to the path element
      .attr("fill", "none")
      .attr("stroke", color[airline])
      .attr("stroke-width", 1.5)
      .attr("d", line);
  });

  //appending x axis text
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + 50) 
    .text("Date (Month/Day/Year)");

//appending y axis text 
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 30)
    .attr("x", -margin.top - height/2 + 90)
    .text("Price ($)");

  // Define random points and current index for navigation
  const points = Array.from({length: 10}, () => ({
    x: Math.random() * width,
    y: Math.random() * height
  }));
  let currentIndex = 0;

  // Draw random points on the graph
  svg.selectAll(".randomPoint")
    .data(points)
    .enter().append("circle")
    .attr("class", "randomPoint")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 5)
    .style("fill", "red");

  // Function to update tooltip for random points
  function updateTooltip() {
    svg.selectAll(".randomPoint")
        .style("fill", (d, i) => i === currentIndex ? "orange" : "red");  // Update fill based on currentIndex

    const point = points[currentIndex];
    const result = calculateDistanceToLines(point);
    const xOffset = 20; // Horizontal offset from the point
    const yOffset = -10;
    tooltip.style("display", "block")
    .style("left", `${point.x + margin.left + xOffset}px`)
    .style("top", `${point.y + margin.top + yOffset}px`)
        .html(`Point Index: ${currentIndex + 1}<br>Nearest Airline: ${result.airline}<br>
               Closest Date: ${result.closestPoint.date.toDateString()}<br>
               Closest Price: $${result.closestPoint.price.toFixed(2)}<br>
               Distance: ${result.distance.toFixed(2)} pixels`);
}

  // Event handlers for navigating random points
  d3.select("#next").on("click", function() {
    currentIndex = (currentIndex + 1) % points.length;  // Increment index, wrap around using modulo
    updateTooltip();
});

d3.select("#back").on("click", function() {
    currentIndex = (currentIndex - 1 + points.length) % points.length;  // Decrement index, wrap around using modulo
    updateTooltip();
});


  // Function to calculate the nearest distance and point on the line
  function calculateDistanceToLines(point) { //point which is an input parameter of the function represent a point on the svg canvas where the user has clicked (contains both x and y properties)
    let minDistance = Infinity;
    let closestAirline = null;
    let closestPoint = null;

    airlines.forEach(([airline, data]) => { //iterates over each airline where there is a name of the airline and data points representing that airline over time 
      for (let i = 1; i < data.length; i++) {
        const start = data[i - 1]; //lines define start and end points of a segment of the line graph
        const end = data[i];
        const distance = Math.sqrt(Math.pow(xScale(end.date) - point.x, 2) + Math.pow(yScale(end.price) - point.y, 2)); //calculates euclidean distance between the end point of the current segment and and given point point.x point.y
        if (distance < minDistance) { //conditional statement checking if the calculated distance is the smallest found so far. If it is, it updates minDistance as well as closestAirline and closestPoint
          minDistance = distance;
          closestAirline = airline;
          closestPoint = end;
        }
      }
    });

    return {airline: closestAirline, distance: minDistance, closestPoint: closestPoint};
  }

  // Initialize tooltip for the first random point
  updateTooltip();

  const exactClickCircle = svg.append("circle") //adding a circle element to an existing svg canvas
  .attr("r", 0)
  .attr("fill", "black")
  .attr("stroke", "white")
  .attr("opacity", 0.5)
  .style("pointer-events", "none");

const dataPointCircle = svg.append("circle") //same same 
  .attr("r", 0)
  .attr("fill", "red")
  .attr("stroke", "white")
  .attr("opacity", 1)
  .style("pointer-events", "none");

  // Set up an interaction layer for clicking anywhere on the graph
  const listeningRect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("click", function (event) {
      const [xCoord, yCoord] = d3.pointer(event, this);
      const x0 = xScale.invert(xCoord);
      let closestData = null;
      let closestDistance = Infinity;

      // Calculate the nearest data point to the click
      airlines.forEach(([airline, data]) => {
        const bisectDate = d3.bisector(d => d.date).left;
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        const dx = xCoord - xScale(d.date); // difference in x
        const dy = yCoord - yScale(d.price); // difference in y
        const distance = Math.sqrt(dx * dx + dy * dy); // Euclidean distance
        if (distance < closestDistance) {
          closestDistance = distance;
          closestData = { data: d, airline: airline };
        }
      });
      exactClickCircle.attr("cx", xCoord)
        .attr("cy", yCoord)
        .attr("r", 5);

      // Update the tooltip based on the clicked position
      if (closestData) {
        const xPos = xScale(closestData.data.date);
        const yPos = yScale(closestData.data.price);
        dataPointCircle.attr("cx", xPos)
                   .attr("cy", yPos)
                   .attr("r", 5);
        tooltip.style("display", "block")
          .style("left", `${event.pageX + 20}px`) // Adjust for cursor position
          .style("top", `${event.pageY - 40}px`)  // Adjust for cursor position
          .html(`<strong>Date:</strong> ${closestData.data.date.toLocaleDateString()}<br><strong>Price:</strong> ${closestData.data.price.toFixed(2)}<br><strong>Airline:</strong> ${closestData.airline}`);
      }
    });
});
