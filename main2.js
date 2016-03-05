$(document).ready(function(){
    init()
})

const AEROBRAKE_DV = 0
const AEROBRAKE = false
const DV_MATCH = null

var AERO_MODES = ['best', 'no_braking', 'entry_only']
var AERO_MODE = AERO_MODES[0]
var node_pair = []

// planet colours
const DEFAULT_COLOUR = '#333'
const PLANET_COLOUR = {
    kerbin: '#0AF',
    mun: '#666',
}

// ksp dv map, directions are relative to kerbin
const NODE_SOURCE = [
    {source:'kerbin_surface', target:'kerbin_orbit', out: 3400, back: AEROBRAKE},
    {source:'kerbin_orbit', target:'kerbin_geostationary', out: 1115, back: AEROBRAKE},
    {source:'kerbin_orbit', target:'kerbin_intercept', out: 950, back: AEROBRAKE},
    
    {source:'kerbin_orbit', target:'mun_intercept', out: 860, back: AEROBRAKE},
    {source:'mun_intercept', target:'mun_orbit', out: 310, back: DV_MATCH},
    {source:'mun_orbit', target:'mun_surface', out: 580, back: DV_MATCH},
    
    {source:'kerbin_orbit', target:'minmus_intercept', out: 930, back: AEROBRAKE, plane_change: 340},
    {source:'minmus_intercept', target:'minmus_orbit', out: 160, back: DV_MATCH},
    {source:'minmus_orbit', target:'minmus_surface', out: 180, back: DV_MATCH},
]

function node_data(node_id){
    var ns = node_id.split('_')
    return {
        id: node_id,
        system: ns[0],
        state: ns[1]
    }
}

function get_data(){
    var nodes = {}
    var edges = []
    
    _.each(NODE_SOURCE, function(item){
        // resolve DV match
        if (item.out==DV_MATCH){ item.out = item.back }
        if (item.back==DV_MATCH){ item.back = item.out }
    
        nodes[item.source] = {data:node_data(item.source)}
        nodes[item.target] = {data:node_data(item.target)}    
        
        var no_braking = item.out||item.back||0

        // out
        edges.push({
            data: {
                source: item.source,
                target: item.target,
                is_outbound: true,
                best: item.out, no_braking: no_braking, entry_only: nodes[item.target].data.state=='surface' ? item.out : no_braking}
        })
        // back
        edges.push({
            data: {
                source: item.target,
                target: item.source,
                is_outbound: false,
                best: item.back, no_braking: no_braking, entry_only: nodes[item.source].data.state=='surface' ? item.back : no_braking}
        })
    })
    
    return {nodes: _.values(nodes), edges: edges}
}

function search_graph(cy, source, target){
    var dij = cy.elements().dijkstra(source, function(edge){return edge.data(AERO_MODE)}, true)
    return {
        weight: dij.distanceTo(target),
        path: dij.pathTo(target),
    }
}

function render_results(container, start, end, results){
    _.each(results.path, function(pth){
        $('#output_out')
    })
}

function tap_handler(cy, evt){
    cy.nodes().unselect()
    cy.edges().unselect()
    var node = evt.cyTarget
    node_pair.push(node)
    if (node_pair.length < 2){
        return
    }
    var start = node_pair[0]
    var end = node_pair[1]
    var out = search_graph(cy, start, end)
    render_results($('#output_out'), start, end, out)

    var back = search_graph(cy, end, start)
    render_results($('#output_back'), end, start, back)
    
    $('#output_total').empty().append('total dv: ' + (out.weight + back.weight))
    
    back.path.select()
    out.path.select()
}

function init(){
    console.log(get_data())
    var style = cytoscape.stylesheet()
        .selector('node')
            .style({
                'background-color': '#ddd',
            })
        .selector('node:selected')
            .style({
                'border-color': '#000',
                'border-width': '2px',
            })
        .selector('edge')
            .style({
                'width': '12px',
                'display': function(ele){ return ele.data('is_outbound') ? 'element' : 'none' },
                'line-color': function(ele){ return PLANET_COLOUR[ele.target().data('system')] || DEFAULT_COLOUR},
            })
        .selector('edge:selected')
            .style({
                'line-style': 'dashed',
            })
    
    var layout = {
        name: 'cose',
        gravity: 0,
        edgeElasticity: function( edge ){ return edge.data('no_braking') },
    }
    
    CY = cytoscape({
        container: $('#graph'),
        elements: get_data(),
        style: style,
        layout: layout,
        autoungrabify: true,
        wheelSensitivity: 0.15,
    })
    
    CY.on('tap', 'node', function(e) {tap_handler(CY,e)})
}

