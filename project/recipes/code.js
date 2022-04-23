var svg = d3.select("svg"),
    width =+svg.node().getBoundingClientRect().width,
    height =+svg.node().getBoundingClientRect().height;
 
// svg objects
var links, nodes;
// the data - an object with nodes and links
var graph;
var cb_cuisines=['South America','British Isles','Africa','Thailand','Korea','Indian Subcontinent','Eastern Europe','USA','Scandinavia','Misc.: Belgian',
    'Greece','France','DACH Countries','South East Asia','Middle East','Australia & NZ','China','Italy','Canada','Spain','Misc.: Portugal','Misc.: Central America',
    'Japan','Caribbean','Misc.: Dutch','Mexico']
//var cb_cuisines=['USA']
const slider_node=document.getElementById("nodefilter")
const slider_edge=document.getElementById("edgefilter")
var weight=slider_node.value
var degree=slider_edge.value


// load the data
read()
function read(){
    d3.json("json_data_0.json", function(error, _data) {
    if (error) throw error;
    data=_data
    console.group(data)
    update()
    })
}

d3.select("#nodefilter").on('change',function(){
    weight=slider_node.value
    update()})
d3.select("#edgefilter").on('change',function(){
    degree=slider_edge.value
    update()})
//REMTOE NON CONNECTED
function chkSelectall(){
    d3.selectAll(".myCheckbox")
      .property('checked',true)
}
function chkUnSelectall(){
    d3.selectAll(".myCheckbox")
    .property('checked',false)
}


//Checkbox filter
d3.selectAll(".force").property('checked',true)
d3.selectAll(".force").on("change",update2)

function update_checkbox(){

    
}

//Update of nodes and edges after cuisine filter is aplied
function update(){  
    

    d3.selectAll(".nodes").remove()
    d3.selectAll(".links").remove()
    
    //Update selected cuisines
    var cb_cuisines = [];
    d3.selectAll(".myCheckbox").each(function(d){
      check = d3.select(this);
      if(check.property("checked")){    
        cb_cuisines.push(check.property("value"));   
      }   
    })  

    // update dietary options
    // var cb_cuisines = [];
    // d3.selectAll(".myCheckbox").each(function(d){
    //   check = d3.select(this);
    //   if(check.property("checked")){    
    //     cb_cuisines.push(check.property("value"));   
    //   }   
    // }) 
    // ^^^ does this actually handle it accidentally?

    // debugger;
    nodes_initial=data['nodes']
    edges_initial=data['links']
    
    // example data: {"Vegetarian": false, "Dairy_Free": true, "Nut_Free": true, "Alcohol_Free": false, "id": "10511", "name": "Cajun Shrimp with Tangy Peach Sauce", "cuisine": "USA"}

    //Filtering the nodes based in the cuisine selected
    var filter_cuisine=nodes_initial.filter(function(d){return cb_cuisines.indexOf(d.cuisine)>-1})  
    //Recalculating the weight (number of times the node/ingredient is repeated in the cusisnes)


    // debugger;
    // nodes_filtered=d3.nest()
    //      .key(function(d){
    //          return d.id;})
    //      .rollup(function (d){
    //          return d3.sum(d,function(f){
    //              return f.degree;
    //             });
    //         }).entries(filter_cuisine);
    

    nodes_filtered = filter_cuisine;


    //Filtering the nodes based in the weight filter, and returning just the key that will be pased to the force simulation
    // var nodes_filtered2= nodes_filtered.filter(function(d){return d.value>weight})
    // ^^^ don't do this anymore, since we don't have weights

    nodes_filtered=nodes_filtered.filter(function(d){
        // debugger;
        return !(
            // box checked                        and not condition
            ((cb_cuisines.indexOf("Vegetarian") > -1) && !d.Vegetarian)
            || ((cb_cuisines.indexOf("Dairy_Free") > -1) && !d.Dairy_Free)
            || ((cb_cuisines.indexOf("Nut_Free") > -1) && !d.Nut_Free)
            || ((cb_cuisines.indexOf("Alcohol_Free") > -1) && !d.Alcohol_Free)
        ) 
    })  

    // var nodes_updated=nodes_filtered.map(function (d){return {id:d.key, weight:d.value}})
    // var nodes_list=nodes_filtered.map(function (d){return d.key})

    var nodes_updated=nodes_filtered;
    var nodes_list=nodes_filtered.map(function (d){return d.id})

    
    //Filtering the edges by cusine and by the nodes obtained in the previous step,
    var edges_filtered=edges_initial.filter(function(d){ 
        return nodes_list.indexOf(d.source) >-1 
        && nodes_list.indexOf(d.target) >-1 
    }).map(function(d){return{source:d.source,target:d.target,degree:d.count}})

    
    var edge_id_arr = []
    for (edge of edges_filtered) {
        edge_id_arr.push(edge.source);
        edge_id_arr.push(edge.target);
    }
    var nodes_updated_connected = nodes_updated.filter(function(d){
        return edge_id_arr.indexOf(d.id) > -1
    });
    nodes_updated = nodes_updated_connected;
    
    //var edges_updated= edges_filtered_group.filter(function(d){return d.degree>degree})
    var edges_updated=edges_filtered;
    //^^^ do this instead of computing degree, since it doesn't matter for recipes
    
    var graph=[]
    graph['nodes']=nodes_updated
    graph['links']=edges_updated
    
    if(graph['nodes'].length != 0){
        var selected_node=graph['nodes'][0]['id']
        console.log(selected_node)    
    }

   initializeDisplay(graph);
   initializeSimulation(graph);
 
}
//Similar than update, but called when updating any of the UI force bars
function update2(){  
    
    var cb_cuisines = [];
    d3.selectAll(".myCheckbox").each(function(d){
      check = d3.select(this);
      if(check.property("checked")){    
        cb_cuisines.push(check.property("value"));   
      }   
    })  

    nodes_initial=data['nodes']
    edges_initial=data['links']
    
    //Filtering the nodes based in the cuisine selected
    var filter_cuisine=nodes_initial.filter(function(d){return cb_cuisines.indexOf(d.cuisine)>-1})  
    //Recalculating the weight (number of times the node/ingredient is repeated in the cusisnes)
    nodes_filtered=d3.nest()
         .key(function(d){
             return d.id;})
         .rollup(function (d){
             return d3.sum(d,function(f){
                 return f.degree;
                });
            }).entries(filter_cuisine);
    //Filtering the nodes based in the weight filter, and returning just the key that will be pased to the force simulation
    var nodes_filtered2= nodes_filtered.filter(function(d){return d.value>weight})
    var nodes_updated=nodes_filtered2.map(function (d){return {id:d.key, weight:d.value}})
    var nodes_list=nodes_filtered2.map(function (d){return d.key})
    //Filtering the edges by cusine and by the nodes obtained in the previous step,
    var edges_filtered=edges_initial.filter(function(d){ return cb_cuisines.indexOf(d.cuisine) >-1&& nodes_list.indexOf(d.source) >-1 
        && nodes_list.indexOf(d.target) >-1 })
                    .map(function(d){return{source:d.source,target:d.target,degree:d.count}})

    //Group by and sum degrees of filtered edges (missing python pandas here...)
    var helper={};
    var edges_filtered_group=edges_filtered.reduce(function(r,o){
        var key=o.source+'-'+o.target;
    if(!helper[key]){
        helper[key]=Object.assign({},o);
        r.push(helper[key]);
    } else {
        helper[key].degree+=o.degree;
    }
    return r;
    } ,[]);
    var edges_updated= edges_filtered_group.filter(function(d){return d.degree>degree})
    
    var graph=[]
    graph['nodes']=nodes_updated
    graph['links']=edges_updated
    var selected_node=graph['nodes'][0]['id']
    

   updateForces(graph);
   updateDisplay(graph);
 
}


//////////// FORCE SIMULATION //////////// 

// force simulator
var simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
function initializeSimulation(graph) {
  simulation.nodes(graph.nodes);
  initializeForces(graph);
  simulation.on("tick", ticked);
}

// values for all forces
forceProperties = {
    center: {
        x: 0.4,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: true,
        strength: .01,
        x: .5
    },
    forceY: {
        enabled: true,
        strength: .01,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}

// add forces to the simulation
function initializeForces(graph) {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter(function (d){return width*forceProperties.center.x}))
        .force("forceX", d3.forceX(function (d){return forceProperties.forceX.strength*forceProperties.forceX.enabled}))
        .force("forceY", d3.forceY(function (d){return forceProperties.forceY.strength*forceProperties.forceY.enabled}));
    
    // apply properties to each of the forces
    updateForces(graph);
}

// apply new force properties
function updateForces(graph) {
    
   
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    forceProperties.forceX.enabled=1
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength( forceProperties.forceX.strength *forceProperties.forceY.enabled )
        .y(height * forceProperties.forceY.y);

    // debugger;
    simulation.force("link")
        .id(function(d) {return d.id;})
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}


   
//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay(graph) {

  var colors = d3.scaleOrdinal()
  .domain(cb_cuisines)
  .range(["#5E4FA2", "#3288BD", "#66C2A5", "#ABDDA4", "#E6F598", 
  "#FFFFBF", "#FEE08B", "#FDAE61", "#F46D43", "#D53E4F", "#9E0142"]);


  //console.log (graph.links)
  // set the data and properties of link lines
  link = svg.append("g")
        .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line");

  // set the data and properties of node circles
  node = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(graph.nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

  // add the node circles
  node.append("circle")
    .attr("r", 5)  
    // .attr("fill", "red")
    .attr("fill", d=>colors(d.cuisine))
  ;

  // add the node text
  node.append("text")
  .attr("transform", "translate(5, -5)")
  .attr("class", "label")
  .text(function(d){
        // return (d.name.replace(/\s+/g,'').toLowerCase());
        return d.name;
    })
  ;



  // node tooltip
  node.append("title")
      .text(function(d) { return d.name + ", " + d.cuisine; });
  //selecting node
  node.on('click',function(d){
    d3.selectAll(".selected_node").remove()
    selected_node=d.id,
    console.log(selected_node)
    // d3.select('body').append("text")
    //     .attr("class", "selected_node")
    //     .text(selected_node);

    }
  )

  // visualize the graph
  updateDisplay();


  
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node
        .attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "green" : "red")
        .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    // node
    //     .attr("cx", function(d) { return d.x; })
    //     .attr("cy", function(d) { return d.y; });
    // d3.select('#alpha_value').style('flex-basis', (simulation.alpha()*100) + '%');

    // node
    // .attr("cx", function(d) { return d.x; })
    // .attr("cy", function(d) { return d.y; });

    node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")"; 
    });
}

//.attr("class", "links")

//////////// UI EVENTS ////////////

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0.0001);
  d.fx = null;
  d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", function(){
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
});

