var spotifyCSV = "../database/spotify.csv"

// Procesamiento de datos
// https://bl.ocks.org/officeofjane/9b9e606e9876e34385cc4aeab188ed73

// Scatter plot DIY
// http://bl.ocks.org/cjhin/b7a5f24a0853524414b06124c559961a

// Generar color contraste
// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color

// http://www.d3noob.org/2014/04/using-html-inputs-with-d3js.html

// https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart

d3.text(spotifyCSV)
    .then(raw => {
        var dsv = d3.dsvFormat(';')
        var data = dsv.parse(raw)
        createVis(data);
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

    var rankNumber = 10
    d3.select("#nRadius").on("input", function() {
        UpdateRank(+this.value);
      });


    function UpdateRank(nRadius) {
    d3.select("#nRadius-value").text(nRadius);
    d3.select("#nRadius").property("value", nRadius);
    rankNumber = nRadius
    UpdateData(rankNumber)  
}
    
    
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
    UpdateData(rankNumber)        
    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

    var songsMetrics = []

    function UpdateData(rows){
        var yearData = filteredData.filter(row => row.week.includes("2021") && parseInt(row.rank)<=rows)
        d3.select(".todo").selectAll("*").remove();
        var weeksUnfiltered = yearData.map(function(d) { return d.week} ) 
        var weeks = Array.from(new Set(weeksUnfiltered));

    
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

            contenedorX
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start");
    
        var contenedorY = SVG.append("g")
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
    
        contenedorVis.selectAll("circle")
        .on("mouseover", function(d, fila) {
            contenedorVis.selectAll('.a' + fila.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,''))
            .classed('active', true);
                
    
            var tooltip_str = "Song: " + fila.track_name +
                    "<br/>" + "Album: " + fila.album_name +
                    "<br/>" + "Artists: " + fila.artist_names +
                    "<br/>" +
                    "<image witdh=100 height = 100 src="+ fila.album_img  +" ></image>";
    
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
        .on('click', function(_, fila ) {
            i=true
            let currSong
            contenedorVis.selectAll('.a' + fila.track_id.toLowerCase().replace(/ /g, '-').replace(/\./g,''))
                .classed('click-active', function(d) {

                if (i) {
                    currSong = fila
                    i = false
                }
                return !d3.select(this).classed('click-active');
                });
            DisplayMetrics(currSong)
        })

    }

    // SEGUNDA VISUALIZACION

    var svg2 = d3.select("#vis-2")
    .append("svg")
    .attr('width',  960)
    .attr('height',  600)

   let radialScale = d3.scaleLinear()
    .domain([0,100])
    .range([0,250]);
    let ticks = [20,40,60,80,100];
    ticks.map(t =>
        svg2.append("circle")
        .attr("cx", 300)
        .attr("cy", 300)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("r", radialScale(t))
    );

    function angleToCoordinate(angle, value){
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {"x": 300 + x, "y": 300 - y};
    }

    var metricas = ["Valence", "Liveness", "Acousticness", "Speechiness", "Energy", "Danceability"]
    i=0
    metricas.map(function(d){
        let angle = (Math.PI / 2) + (2 * Math.PI * i / metricas.length);
        let line_coordinate = angleToCoordinate(angle, 100);
        let label_coordinate = angleToCoordinate(angle, 100.5);
        //draw axis line
        svg2.append("line")
            .attr("x1", 300)
            .attr("y1", 300)
            .attr("x2", line_coordinate.x)
            .attr("y2", line_coordinate.y)
            .attr("stroke","red");
        
        //draw axis label
            svg2.append("text")
            .attr("x", label_coordinate.x)
            .attr("y", label_coordinate.y)
            .text(d);
        i++;
    })

    function getPathCoordinates(data_point){
        let coordinates = [];
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 0 / metricas.length),
            data_point.valence* 100
        )))
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 1 / metricas.length),
            data_point.liveness * 100
        )))
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 2 / metricas.length),
            data_point.acousticness* 100
        )))
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 3 / metricas.length),
            data_point.speechiness* 100
        )))
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 4 / metricas.length),
            data_point.energy* 100
        )))
        coordinates.push((angleToCoordinate(
            (Math.PI / 2) + (2 * Math.PI * 5 / metricas.length),
            data_point.danceability* 100
        )))
        return coordinates;
    }

    var yearData = filteredData.filter(row => row.week.includes("2021"))


    let line = d3.line()
    .x(d => d.x)
    .y(d => d.y);

    function DisplayMetrics(song){

        if (songsMetrics.length === 0) {
            songsMetrics.push(song)
        } 

        else{
            thing = songsMetrics.map(function(d){
                if (song.track_id === d.track_id){
                    return d
                }
                else return "nothing"
            })

            if (thing==="nothing"){
                if (songsMetrics.length < 3) {
                    songsMetrics.push(song)
                }
            }
            else{
                indexa = songsMetrics.indexOf(thing)
                songsMetrics.splice(indexa, 1);
            }
        }

        console.log(songsMetrics)

        songsMetrics.map(function(d) {
            let songId = d.track_id
            let img = d.album_img
            let coordinates = getPathCoordinates(d);
            //draw the path element
            svg2.append("path")
            .data([coordinates])
            .join()
            .attr("d",line)
            .attr("stroke-width", 3)
            .attr("stroke", function(d) { return colors[songId]})
            .attr("fill", function(d) { return colors[songId]})
            .attr("stroke-opacity", 1)
            .attr("opacity", 0.5);
            // svg2.append("image").attr("href", img).attr("width", 500).attr("height", 500)
        })
    }


    
    // }













}    

//////////////////////////////////////////////////////////////////////////////////