$(window).load(function(){
    init()
    test()
})

const G = 6.674e-11
const SUICIDE_BURN_MARGIN = 1.03 // a fudge factor for no-atmo landings
const AEROBRAKE = false // the value of 'dv' to signal aerobraking
const DV_MATCH = null // the value of 'dv' to signal matching the opposing direction
const DEFAULT_NODE_SELECTOR = '#kerbin_surface'
const ROOT_NODE = '#kerbin_geostationary'
const DEFAULT_COLOUR = '#aaa'

var CY = null
var LAYOUT_SETTINGS = null

// number of metres used for low orbit buffer (= radius + atmosphere + low_orbit_buffer)
const LOW_ORBIT_BUFFER = 10000

// our start and end points
var node_path = []
var pinned = null

function system_name_to_node(planet_name){
    // ensure planets have their default state
    // kerbin -> 'kerbin_orbit'
    if (planet_name.split('_').length == 1){
        planet_name += '_surface'
    }
    return planet_name
}

function node_data(node, all_nodes){
    // defines the additional (e.g. rendering) data for any given node
    var ns = node.id.split('_')
    var system_node = all_nodes[system_name_to_node(ns[0])]
    var colour = node.colour || (system_node ? system_node.data.colour : DEFAULT_COLOUR)
    var output = _.extend(node, {
        system: ns[0],
        state: ns[1],
        label: ns[0] + '\n' + ns[1],
        label_colour: $('<span>').append(
            $('<span>', {text: ns[0], style:'color:'+colour+';'}),
            $('<span>', {text: ' '+ns[1]})
        ),
        shape: ns[1] == 'surface' ? 'ellipse' : 'roundrectangle',
        width: ns[1] == 'surface' ? '40' : '20',
        height: ns[1] == 'surface' ? '40' : '20',
        orbit: node.radius + (node.atmosphere || 0) + LOW_ORBIT_BUFFER,
    })
    return output
}

function get_data(){
    var nodes = {}
    var edges = []
    
    // we want to add the n^2 sibling-sibling crosslinks for every possible transfer between orbits at the same level
    // we can calculate the cost now, and search on it very rapidly later
    var children = {}
    var universe = UI.options.universe.current_obj
    var bodies = universe.bodies
    var edge_generators = []
    
    // add hierarchical SOI structure for nodes
    _.each(bodies, function(item){
        item.id = system_name_to_node(item.name)
        var this_data = node_data(item, nodes)
        nodes[item.id] = {data: this_data}
        
        // for everything apart from Kerbol ...
        if (!item.parent){ return }
        item.parent_id = system_name_to_node(item.parent)
        
        // create orbit: every body has one, though expecting overrides for atmo values
        edge_generators.push({
            source: item.name + '_surface',
            target: item.name + '_orbit',
            out: M.orbit_to_surface(this_data),
            back: DV_MATCH
        })
        
        // create SOI: we can calculate dv from orbit to the SOI
        edge_generators.push({
            source: item.name + '_orbit',
            target: item.name + '_soi',
            out: M.hohmann(
                this_data.mass,
                this_data.orbit,
                this_data.soi
            ).enter,
            back: DV_MATCH
        })
            
        // create our own temporary graph using this structure { k : [children] }
        if (!_.has(children, item.parent_id)){
            children[item.parent_id] = []
        }
        children[item.parent_id].push(item.name)
    })
    
    // add those interplanetary crosslinks
    _.each(children, function(siblings, parent_id){
        _.each(siblings, function(child){
            var child_node = nodes[system_name_to_node(child)]
            // every child from SOI to the parent orbit
            edge_generators.push({
                source: child + '_soi',
                target: nodes[parent_id].data.name + '_orbit',
                out: M.hohmann_enter(
                    nodes[parent_id].data.mass,
                    child_node.data.sma - child_node.data.soi,
                    nodes[parent_id].data.orbit                 
                ),
                back: DV_MATCH
            })
            
            // but every child can also get to the parent's SOI more cheaply
            edge_generators.push({
                source: child + '_soi',
                target: nodes[parent_id].data.name + '_soi',
                out: M.hohmann_enter(
                    nodes[parent_id].data.mass,
                    child_node.data.sma + child_node.data.soi,
                    nodes[parent_id].data.soi                
                ),
                back: DV_MATCH,
                no_render: true
            })
            
            if (siblings.length==1){ return } // early out
            
            _.each(siblings, function(other_child){
                if (other_child == child){ return }
                // we can go to any child on the same level
                // this is soi -> soi, but it takes less dv to go orbit -> soi
                var other_child_node = nodes[system_name_to_node(other_child)]
                var start = Math.min(
                    child_node.data.sma + child_node.data.soi,
                    other_child_node.data.sma + other_child_node.data.soi
                )
                var end = Math.max(
                    child_node.data.sma - child_node.data.soi,
                    other_child_node.data.sma - other_child_node.data.soi
                )
                edge_generators.push({
                    source: child+'_soi',
                    target: other_child+'_soi',
                    out: M.hohmann(
                        nodes[parent_id].data.mass,
                        start,
                        end
                    ).total,
                    back: DV_MATCH,
                    no_render: true,
                    gravity_assist: true
                })
                
                // fine, lets do orbit to soi
                edge_generators.push({
                    source: child+'_orbit',
                    target: other_child+'_soi',
                    out: M.hohmann(
                        nodes[parent_id].data.mass,
                        child_node.data.sma,
                        other_child_node.data.sma
                    ).total,
                    back: DV_MATCH,
                    no_render: true,
                    gravity_assist: true
                })
            })
        })
    })
    
    // uniqueify our edges and apply overrides
    var unique_edges = {}
    _.each(edge_generators.concat(universe.edge_overrides), function(item){
        unique_edges[[item.source, item.target].sort()] = item
    })   
    
    console.log('edges to make:', edge_generators)
    
    // turn our edge shorthand into cytoscape graph edges
    _.each(unique_edges, function(item, key){
        // resolve DV match, this is intended to stop duplication of dv inputs
        if (item.out==DV_MATCH){ item.out = item.back }
        if (item.back==DV_MATCH){ item.back = item.out }
    
        // auto-create new stub nodes
        _.each([item.source, item.target], function(stub){
            if (!_.has(nodes, stub)){
                var stub_data = node_data({id: stub}, nodes)
                // try to update the colour by referencing our existing nodes
                stub_data.colour = nodes[system_name_to_node(stub_data.system)].data.colour
                nodes[stub] = {data:stub_data}
            }  
        })
        
        var any_aerobrake = (item.out == AEROBRAKE || item.back == AEROBRAKE)
        var no_braking = item.out||item.back
        var out = item.out == AEROBRAKE ? AEROBRAKE_DV : item.out
        var back = item.back == AEROBRAKE ? AEROBRAKE_DV : item.back
        
        // out
        edges.push({
            data: {
                outbound: true,
                source: item.source,
                target: item.target,
                gravity_assist: item.gravity_assist,
                is_aerobrake: item.out == AEROBRAKE,
                any_aerobrake: any_aerobrake,
                dv: item.out,
                plane_change: item.plane_change || 0,
                no_braking: no_braking,
            }
        })
        // back
        edges.push({
            data: {
                outbound: false,
                source: item.target,
                target: item.source,
                no_render: item.no_render,
                gravity_assist: item.gravity_assist,
                is_aerobrake: item.back == AEROBRAKE,
                any_aerobrake: any_aerobrake,
                dv: item.back,
                plane_change: item.plane_change || 0,
                no_braking: no_braking,
            }
        })
    })

    var output = {nodes: _.values(nodes), edges: edges}
    console.log('nodes and edges', output)
    return output
}



function search_graph(cy, source, target){
    var dij = cy.elements().dijkstra(source, M.calc_dv, true)
    var path = dij.pathTo(target)
    return {
        weight: dij.distanceTo(target),
        path: path,
        total: _.reduce(path, function(memo, item){ return item.isNode() ? memo : memo + M.calc_dv(item, true); }, 0),
    }
}

function render_results(container, start, end, results){
    container.empty()
    container.append($('<div>', {html: 
        start.data('label_colour')[0].outerHTML + ' to ' + end.data('label_colour')[0].outerHTML
    }))
    container.append($('<div>', {text: 
        'total dv: ' + Math.round(results.total)
    }))
    var tab = $('<table>')
    _.each(results.path, function(pth){
        if (pth.isNode()){return}
        var row = $('<tr>')
        row.append(
            $('<td>', {html: pth.target().data('label_colour')[0].outerHTML}),
            $('<td>', {text: pth.data('is_aerobrake') ? pth.data('no_braking') + ' A' : '', title: 'dv without aerobraking'}),
            $('<td>', {text: PLANE_CHANGE && pth.data('plane_change') ? pth.data('plane_change') + ' P' : '', title: 'extra dv for plane change'}),
            $('<td>', {text: Math.round(pth.data(AERO_MODES[AERO_MODE].key)), class:'dv_cells'})
        )
        tab.append(row)
    })
    container.append(tab)
}

function search_and_render(cy){
    if (node_path.length !=2){return}
    
    cy.edges().unselect()
    
    var start = node_path[0]
    var end = node_path[1]
    var out = search_graph(cy, start, end)
    render_results($('#output_out'), start, end, out)

    var back = search_graph(cy, end, start)
    render_results($('#output_back'), end, start, back)
    
    $('#output_total').empty().append('round trip dv: ' + Math.round(out.total + back.total))
    
    back.path.select()
    out.path.select()
    
    // I don't like this but it's needed. Something weird with selections and the event ordering.
    _.delay(function(){end.select()}, 0)
}

function on_tap_handler(cy, evt){
    var node = evt.cyTarget
    if (!node) {return}
    cy.nodes().unselect()
    cy.edges().unselect()
    if (pinned){
        node_path = []
        node_path.push(pinned)
    }
    node_path.push(node)
    if (node_path.length < 2){
        return
    }
    if (node_path.length > 2){
        // only keep the most recent point
        node_path = node_path.slice(-1)
    }
    search_and_render(cy)
}

function init(){
    CY = cytoscape({
        container: $('#graph'),
        selectionType: 'additive',
        autoungrabify: true,
        wheelSensitivity: 0.15,
    })
        
    LAYOUT_SETTINGS = [
        {
            key: 'spring',
            data: {
                name: 'cose',
                gravity: 0,
                numIter: 12000,
                minTemp: 0.1,
                coolingFactor: 0.98,
                nodeRepulsion: function( node ){ return 100000; },
                idealEdgeLength: function( edge ){ return 3},
                edgeElasticity: function( edge ){ return 200*(edge.target().degree() + edge.source().degree()) },
            },
        },
        {
            key: 'round',
            data: {
                name: 'concentric',
                startAngle: Math.PI * 9/8,
                sweep: Math.PI * 6/8,
                minNodeSpacing: 2,
                equidistant: false,
                concentric: function( node ){
                    var x = search_graph(CY, CY.$(ROOT_NODE), node);
                    return -x.path.length
                },
                levelWidth: function( nodes ){ return 3},
            },
        },
        {
            key: 'tree',
            data: {
                name: 'breadthfirst',
                roots: CY.$(ROOT_NODE),
            }
        }
    ]
    
    CY.on('tap', 'node', function(e) {on_tap_handler(CY,e)})
    CY.style(UI.apply_cy_style(cytoscape.stylesheet()))
    
    var default_node = CY.$(DEFAULT_NODE_SELECTOR)
    default_node.select()
    node_path.push(default_node)
    
    UI.init_buttons(CY)
    
    CY.add(get_data())
}