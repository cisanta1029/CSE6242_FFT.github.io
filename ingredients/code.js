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
const slider_tfidf=document.getElementById("tfidffilter")

var weight=slider_node.value
var degree=slider_edge.value
var tf_idf=slider_tfidf.value
var hide = "Yes"
var label="No"
var weight_node="No"
// load the data
read()
function read(){
d3.json("ingredients.json", function(error, _data) {
  if (error) throw error;
  data=_data
  update()

 
}),
d3.json("table.json", function(error, _table) {
    if (error) throw error;
    table=_table

})
   
}

d3.select("#nodefilter").on('change',function(){
    weight=slider_node.value
    update()})
d3.select("#edgefilter").on('change',function(){
    degree=slider_edge.value
    update()})
d3.select("#tfidffilter").on('change',function(){
    tf_idf=slider_tfidf.value
    update()})
d3.select(".radiohide").on("change", function(){
    hide = d3.select("input[name='Hidenodes']:checked").node().value
   update()
})
d3.select(".radiolabels").on("change", function(){
    label = d3.select("input[name='Hidelabels']:checked").node().value
   
})
d3.select(".radioweight").on("change", function(){
    weight_node = d3.select("input[name='Showweight']:checked").node().value
    node_weight()
})
       
function node_weight(){
    
    total_weight=simulation.nodes()
    var max_weight=d3.max(total_weight.map(function (d){return d.weight}))
    var min_weight=d3.min(total_weight.map(function (d){return d.weight}))
    var scale=d3.scaleLinear()
        .domain([min_weight,max_weight])
        .range([1,forceProperties.collide.radius+10])
    
    if (weight_node=='Yes'){ 
        d3.selectAll(".circles").attr('r',function(d) {
            return (scale(d.weight))})}
        else if (weight_node=='No'){ 
                d3.selectAll(".circles").attr('r',forceProperties.collide.radius)}

}

function add_labels(){
   
    if (label=='Yes'){ 
    
var texts = svg.selectAll()
    .data(simulation.nodes())
    .enter().append("text")
    .attr("class", "label")
    .attr("fill", "black")
    .text(function(d) {  return d.id;  });

    texts.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";})
    //d3.select('#alpha_value').style('flex-basis', (simulation.alpha()*100) + '%');
}
else if (label=='No'){svg.selectAll(".label").remove()}

}

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

//Generate table
function create_table(data,columns){
    d3.selectAll(".table").remove()
    var table = d3.select('body').append('table').attr("class","table")
    var thead = table.append('thead')
    var tbody = table.append('tbody');
    //var selected_node=d3.selectAll(".selected_node")
    console.log(selected_node)
    var cb_cuisines = [];
    d3.selectAll(".myCheckbox").each(function(d){
      check = d3.select(this);
      if(check.property("checked")){    
        cb_cuisines.push(check.property("value"));   
      }   
    })  
    var data_filter=data.filter(function (d){return d.ingredient==selected_node && cb_cuisines.indexOf(d.Cuisine)>-1})
    
    // append the header row
    thead.append('tr')
           .selectAll('th')
           .data(columns)
           .enter()
           .append('th')
           .text(function (column) {
                return column;
            });
     // create a row for each object in the data
    
     
     var rows = tbody.selectAll('tr')
     .data(data_filter)
     .enter()
     .append('tr')
    
     var cells = rows.selectAll('td')
     .data(function (row) {
         return columns.map(function (column) {
             return {column: column, value: row[column]};
         });
      })
      .enter()
      .append('td')
      .text(function (d) { return d.value; });
          return table;}
  
 function create_table2(){   
     create_table(table,['Cuisine','n_recipes','Ranking'])
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
    var nodes_all=nodes_filtered2.map(function (d){return {id:d.key, weight:d.value}})
    var nodes_list=nodes_filtered2.map(function (d){return d.key})
   
    //Filtering the edges by cusine and by the nodes obtained in the previous step,
    var edges_filtered=edges_initial.filter(function(d){ return cb_cuisines.indexOf(d.cuisine) >-1&& nodes_list.indexOf(d.source) >-1 
        && nodes_list.indexOf(d.target) >-1 })
                            .map(function(d){return{source:d.source,target:d.target,degree:d.count,source_count:d.source_count,target_count:d.target_count,
            n_recipes:d.n_recipes}})

    //Group by and sum degrees of filtered edges (missing python pandas here...)
    var helper={};
    var edges_filtered_group=edges_filtered.reduce(function(r,o){
        var key=o.source+'-'+o.target;
    if(!helper[key]){
        helper[key]=Object.assign({},o);
        r.push(helper[key]);
    } else {
        helper[key].degree+=o.degree
        helper[key].source_count+=o.source_count
        helper[key].target_count+=o.target_count
        helper[key].n_recipes+=o.n_recipes
    }
    return r;
    } ,[]);
  
    var edges_filtered_group_tfidf=edges_filtered_group.map(function(d){
        return{source:d.source,
            target:d.target,
            degree:d.degree,
            tf_idf:(1+Math.log10(1+d.degree)*Math.log10(d.n_recipes/(d.source_count+d.target_count)))
    }
    })
    var edges_updated= edges_filtered_group_tfidf.filter(function(d){return d.degree>degree&& d.tf_idf>tf_idf})
    
    //Variable to filter the nodes that have no edges, which will be filtered uppon button click
    var edge_id_arr = []
    for (edge of edges_updated) {
        edge_id_arr.push(edge.source);
        edge_id_arr.push(edge.target);
    }
    var nodes_hide= nodes_all.filter(function(d){
        return edge_id_arr.indexOf(d.id) >-1
    });
   
    var graph=[]

    if (hide=="No"){graph['nodes']=nodes_all} else if (hide=="Yes") {graph['nodes']=nodes_hide}  
    graph['links']=edges_updated

    //Code to retrieve top edges
    //var topData = edges_updated.sort(function(a, b) {
        //return d3.descending(+a.degree, +b.degree);}).slice(0, 10);//top 10 here
       // console.log(edges_updated)
        //console.log(topData)
  
  initializeDisplay(graph);
  initializeSimulation(graph);
  
//INICIAR CON TABLA
//DISPLAY TEXT?
//NODES BY SIZE
 
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
                    .map(function(d){return{source:d.source,target:d.target,degree:d.count,source_count:d.source_count,target_count:d.target_count,
                    n_recipes:d.n_recipes}})

    //Group by and sum degrees of filtered edges (missing python pandas here...)
    var helper={};
    var edges_filtered_group=edges_filtered.reduce(function(r,o){
        var key=o.source+'-'+o.target;
    if(!helper[key]){
        helper[key]=Object.assign({},o);
        r.push(helper[key]);
    } else {
        helper[key].degree+=o.degree
        helper[key].source_count+=o.source_count
        helper[key].target_count+=o.target_count
        helper[key].n_recipes=o.n_recipes
        ;
    }
    return r;
    
    } ,[]);
    var edges_filtered_group_tfidf=edges_filtered_group.map(function(d){
        return{source:d.source,
            target:d.target,
            degree:d.degree,
            tf_idf:(1+Math.log10(1+d.degree)*Math.log10(d.n_recipes/(d.source_count+d.target_count)))
    }
    })
    
  
    var edges_updated= edges_filtered_group_tfidf.filter(function(d){return d.degree>degree&& d.tf_idf>tf_idf})
    console.log(tf_idf)
    var graph=[]
    graph['nodes']=nodes_updated
    graph['links']=edges_updated
    

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
        strength: -60,
        distanceMin: 1,
        distanceMax: 1000
    },
    collide: {
        enabled: true,
        strength: .3,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: true,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: true,
        strength: .1,
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
    var initial_strenght=0
    if (hide=='Yes'){initial_strenght=-100} else if(hide=='No'){initial_strenght=-20}
    console.log(initial_strenght)
   
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(initial_strenght * forceProperties.charge.enabled)
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
  // set the data and properties of link lines
  link = svg.append("g")
        .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line");

  // set the data and properties of node circles
  node = svg.append("g")
        .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("class", "circles")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
  // node tooltip
  node.append("title")
      .text(function(d) { return d.id; });
  //selecting node
  node.on('click',function(d,i)
  {d3.selectAll(".selected_node").remove()
  d3.selectAll(".circles")
  .style('fill','rgb(192, 2, 2)')
  .attr("stroke", forceProperties.charge.strength > 0 ? "green" : "red")
  .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15)
  //.attr("r", forceProperties.collide.radius);
  node_weight()
    selected_node=d.id,
    d3.select(this)
    .attr('r','12')
    .style('fill','green')
    .attr("stroke", 'green')
     d3.select('body').append("text")
    .attr("class", "selected_node")
    .text(selected_node);create_table(table,['Cuisine','n_recipes','Ranking'])})
    

  // visualize the graph
  updateDisplay();


  
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node
        .attr("stroke", forceProperties.charge.strength > 0 ? "green" : "red")
        .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);
    node_weight()
    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
    d3.selectAll('.label').remove()
    //d3.selectAll(".circles").attr('r',forceProperties.collide.radius)

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        //.attr('r', function(d) { return d.weight/200});
  //

add_labels()
//node_weight()
d3.select('#alpha_value').style('flex-basis', (simulation.alpha()*100) + '%');
};


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

