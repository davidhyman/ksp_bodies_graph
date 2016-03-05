$(document).ready(function(){
    init()
})

const AEROBRAKE_DV = 50
const AEROBRAKE = false
const DV_MATCH = null

var AERO_MODES = ['best', 'no_braking', 'entry_only']
var AERO_MODE = AERO_MODES[2]
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
        state: ns[1],
        label: ns[0] + '\n' + ns[1]
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
        
        var any_aerobrake = (item.out == AEROBRAKE || item.back == AEROBRAKE)
        var no_braking = item.out||item.back
        var out = item.out == AEROBRAKE ? AEROBRAKE_DV : item.out
        var back = item.back == AEROBRAKE ? AEROBRAKE_DV : item.back
        

        // out
        edges.push({
            data: {
                source: item.source,
                target: item.target,
                is_outbound: true,
                is_aerobrake: item.out == AEROBRAKE,
                any_aerobrake: any_aerobrake,
                best: out, no_braking: no_braking, entry_only: nodes[item.target].data.state=='surface' ? out : no_braking}
        })
        // back
        edges.push({
            data: {
                source: item.target,
                target: item.source,
                is_outbound: false,
                is_aerobrake: item.back == AEROBRAKE,
                any_aerobrake: any_aerobrake,
                best: back, no_braking: no_braking, entry_only: nodes[item.source].data.state=='surface' ? back : no_braking}
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
    container.empty()
    container.append($('<div>', {text: 
        start.data('label') + ' to ' + end.data('label')
    }))
    container.append($('<div>', {text: 
        'total dv: ' + results.weight
    }))
    _.each(results.path, function(pth){
        if (pth.isNode()){return}
        container.append($('<div>', {text: pth.data('best') + ' ('+ pth.data('entry_only') + ') ' + ' ' + pth.target().data('label')}))
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
    node_pair = []
    var out = search_graph(cy, start, end)
    render_results($('#output_out'), start, end, out)

    var back = search_graph(cy, end, start)
    render_results($('#output_back'), end, start, back)
    
    $('#output_total').empty().append('round trip dv: ' + (out.weight + back.weight))
    
    back.path.select()
    out.path.select()
    _.delay(function(){end.select()}, 0)
}

function init(){
    console.log(get_data())
    var style = cytoscape.stylesheet()
        .selector('node')
            .style({
                'background-color': function(ele){ return PLANET_COLOUR[ele.data('system')] || DEFAULT_COLOUR},
                'label': function(ele){ return ele.data('label')},
                'text-wrap': 'wrap',
                'color': '#ddd',
                'border-color': '#000',
                'border-width': '3px',
            })
        .selector('node:selected')
            .style({
                'border-color': '#fff',
                'border-width': '3px',
            })
        .selector('edge')
            .style({
                'width': '12px',
                'display': function(ele){ return ele.data('is_outbound') ? 'element' : 'none' },
                'line-color': function(ele){ return PLANET_COLOUR[ele.target().data('system')] || DEFAULT_COLOUR},
                'label': function(ele){ return ele.data('no_braking') + (ele.data('any_aerobrake') ? ' +B' : '' )},
                'color': '#ddd',
                'line-style': 'solid',
            })
        .selector('edge:selected')
            .style({
                'line-style': 'dashed',
            })
    
    var layout = {
        name: 'cose',
        gravity: 0,
        numIter: 2000,
        coolingFactor: 0.97,
        nodeRepulsion: function( node ){ return 400000; },
        idealEdgeLength: function( edge ){ return 3},
        edgeElasticity: function( edge ){ return edge.data('no_braking') || 1 },
    }
    
    CY = cytoscape({
        container: $('#graph'),
        elements: get_data(),
        selectionType: 'additive',
        style: style,
        layout: layout,
        autoungrabify: true,
        wheelSensitivity: 0.15,
    })
    
    CY.on('tap', 'node', function(e) {tap_handler(CY,e)})
}

