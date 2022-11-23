var spotifyCSV = "../database/spotify.csv"

// Procesamiento de datos
// https://bl.ocks.org/officeofjane/9b9e606e9876e34385cc4aeab188ed73

// Scatter plot DIY
// http://bl.ocks.org/cjhin/b7a5f24a0853524414b06124c559961a

// Generar color contraste
// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color

// http://www.d3noob.org/2014/04/using-html-inputs-with-d3js.html

d3.text(spotifyCSV)
    .then(raw => {
        var dsv = d3.dsvFormat(';')
        var data = dsv.parse(raw)
        createVis(data);
        // createVis2(data);
    })
    .catch(error => {console.log(error)});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createVis(data){
    var margin = { top: 35, right: 0, bottom: 30, left: 70 };
    var width = 960 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

//////////////////////////////////////////////////////
/////////////////// Filter Data  /////////////////////

    parseDate = d3.timeParse("%m/%d/%Y")
    parseYear = d3.timeFormat("%m/%Y");
    weeks = data.map(d=> parseDate(d.week));

    filteredData = data.filter(function(d, index) {
        artists = d.artist_names.split(",")
        if (index==0){
            return true
        }
        else if (parseInt(d.artist_num) == 1){
            return true
        }
        else if (d.artist_name == artists[0]){
            return true
        }
        else return false

    })

    var songIdUnfiltered = filteredData.map(function(d) { return d.track_id} ) 
    var trackId = Array.from(new Set(songIdUnfiltered));
    var colors = {} 
    trackId.map(function(d) {
        randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);})
        colors[d] = randomColor
    })

    console.log(colors)


    year = "2017"
    rankNumber = 10
    d3.select("#nRadius").on("input", function() {
        UpdateRank(+this.value);
      });


    function UpdateRank(nRadius) {
    d3.select("#nRadius-value").text(nRadius);
    d3.select("#nRadius").property("value", nRadius);
    rankNumber = nRadius
    UpdateData(year, rankNumber)  
}

    d3.selectAll("input[name='year']").on('change', function() {
        var year = d3.select('input[name="year"]:checked').property("value");
        UpdateData(year, rankNumber)
    })
    
    var SVG = d3.select("#vis-1")
    .append("svg")
    .attr('width',  960)
    .attr('height',  600)
    .append("g")
    .attr("class", "todo")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    SVG
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

    UpdateRank(10)
    UpdateData(year, rankNumber)        


    function UpdateData(year, rows){
        d3.select(".todo").selectAll("*").remove();
        var yearData = filteredData.filter(row => row.week.includes(year) && parseInt(row.rank)<=rows)
        var weeksUnfiltered = yearData.map(function(d) { return d.week} ) 
        var weeks = Array.from(new Set(weeksUnfiltered));
        // songIdUnfiltered = yearData.map(function(d) { return d.track_id} ) 
        // trackId = Array.from(new Set(songIdUnfiltered));
        // colors = {}
        // trackId.map(function(d) {
        //     randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);})
        //     colors[d] = randomColor
        // })

    
            // Scaless
        var x = d3.scaleBand()
        .domain(weeks.map(function(d) { return d; }))
        .rangeRound([25, width - 15]);
    
    
        var y = d3.scaleLinear()
        .domain([1, rows])
        .range([20, height - 30]);
    
        ///////////////////////
        // Axis
        var xAxis = d3.axisBottom(x);
    
        var yAxis = d3.axisLeft(y);
    
        var contenedorX = SVG.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(-"+ x.bandwidth()/2.0 +"," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start");
    
        SVG.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    
        contenedorVis = SVG.append("g").attr("clip-path", "url(#clip)");
            // Lines
        var songs = d3.map(yearData, function(d) {
            return d.track_name;
        })
        lines = contenedorVis.append("g")
    
        songs.map(function(song) {
            var currData = yearData.filter(function(d) {
                if(d.track_name == song) {
                return d;
                }
            });
        
            var line = d3.line()
                .x(d => x(d.week))
                .y(d => y(parseInt(d.rank)));
        
                lines.append("path")
                .data([currData])
                .attr("fill", "none")
                .attr("stroke", function(d) {
                    return(colors[d[0].track_id])
                 })
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 0.1)
                .attr("d", line);
            });
        
        ///////////////////////
        // Nodes
        var node = contenedorVis.append("g")
            .selectAll("circle")
            .data(yearData)
            .enter().append("circle")
            .attr("class", "point")
            .style("fill", function(d) { return colors[d.track_id]}) 
            .attr("cx", function(d) { return x(d.week); })
            .attr("cy", function(d) { return y(parseInt(d.rank)); })
            .attr('fill', 'blue')
            .attr("class", function(d) { return "a" + d.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,'') })
            .attr("r", 6)
            .attr("stroke-width", 1.5)
            .attr('opacity', '0.6');
    
            
    
    
            ///////////////////////
        // Tooltips
        var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");
    
        contenedorVis.selectAll("circle")
        .on("mouseover", function(d, fila) {
            contenedorVis.selectAll('.a' + fila.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,''))
            .classed('active', true);
                
    
            var tooltip_str = "Song: " + fila.track_name +
                    "<br/>" + "Album: " + fila.album_name +
                    "<br/>" + "Artists: " + fila.artist_names;
    
            tooltip.html(tooltip_str)
                .style("visibility", "visible");
        })
        .on("mousemove", function(d) {
            tooltip.style("top", event.pageY - (tooltip.node().clientHeight + 5) + "px")
                .style("left", event.pageX - (tooltip.node().clientWidth / 2.0) + "px");
        })
        .on("mouseout", function(d, fila) {
            contenedorVis.selectAll('.a' + fila.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,''))
                .classed('active', false);
    
            tooltip.style("visibility", "hidden");
        })
        .on('click', function(d, fila ) {
            contenedorVis.selectAll('.a' + fila.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,''))
                .classed('click-active', function(d) {
                // toggle state
                return !d3.select(this).classed('click-active');
                });
        })
    }





            

}    

//////////////////////////////////////////////////////////////////////////////////

// function  createVis2(data){
//     var margin = { top: 35, right: 0, bottom: 30, left: 70 };
//     var width = 960 - margin.left - margin.right;
//     var height = 400 - margin.top - margin.bottom;

//     filteredData = data.filter(function(d, index) {
//         artists = d.artist_names.split(",")

//         if (d.rank===1){}

//         if (parseInt(d.artist_num) == 1){
//             return true
//         }
//         else if (d.artist_name == artists[0]){
//             return true
//         }
//         else return false)

