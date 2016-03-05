$(document).ready(function(){
    init()
})

const AEROBRAKE = false
const DV_MATCH = null

// some modes for aero calculations
var AERO_MODES = [
    {key: 'entry_only', friendly: 'on entry', title: 'Only aero brake from orbit to surface'},
    {key: 'best', friendly: 'perfect', title: 'Optimal aero braking used on every manouvre'}, 
    {key: 'no_braking', friendly: 'never', title: 'Never aero brake'},
]
var AERO_MODE = -1

// some modes for assuming a mimimum dv on aerobraking
var AEROBRAKE_DV = 0
var AEROBRAKE_DVS = [0, 50, 100, 200, 400]

var PLANE_CHANGE = true

// our start and end points
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
        label: ns[0] + '\n' + ns[1],
        shape: ns[1] == 'surface' ? 'ellipse' : 'roundrectangle',
        width: ns[1] == 'surface' ? '40' : '20',
        height: ns[1] == 'surface' ? '40' : '20',
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
                dv: item.out,
                plane_change: item.plane_change || 0,
                no_braking: no_braking,
            }
        })
        // back
        edges.push({
            data: {
                source: item.target,
                target: item.source,
                is_outbound: false,
                is_aerobrake: item.back == AEROBRAKE,
                any_aerobrake: any_aerobrake,
                dv: item.back,
                plane_change: item.plane_change || 0,
                no_braking: no_braking,
            }
        })
    })
    
    return {nodes: _.values(nodes), edges: edges}
}

function calc_dv(edge){
    // substitute our assumed minimum dv value for aerobraking manouvres
    var aero_best = edge.data('is_aerobrake') ? AEROBRAKE_DVS[AEROBRAKE_DV] : edge.data('dv')
    
    // save our calculations on the edges so we can refer to them later
    edge.data()['best'] = aero_best
    edge.data()['entry_only'] = edge.target().data('state')=='surface' ? aero_best : edge.data('no_braking')
    var dv = edge.data(AERO_MODES[AERO_MODE].key)
    if (PLANE_CHANGE){
        dv += edge.data('plane_change')
    }
    return dv
}

function search_graph(cy, source, target){
    var dij = cy.elements().dijkstra(source, calc_dv, true)
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
        container.append($('<div>', {text: 
            pth.data('best') + ' ('+ pth.data('entry_only') + ') ' 
            + ' ' + pth.target().data('label')
            + (PLANE_CHANGE && pth.data('plane_change') ? ' +P ' + pth.data('plane_change') : '')}))
    })
}

function search_and_render(cy){
    if (node_pair.length !=2){return}
    var start = node_pair[0]
    var end = node_pair[1]
    var out = search_graph(cy, start, end)
    render_results($('#output_out'), start, end, out)

    var back = search_graph(cy, end, start)
    render_results($('#output_back'), end, start, back)
    
    $('#output_total').empty().append('round trip dv: ' + (out.weight + back.weight))
    
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
    node_pair.push(node)
    if (node_pair.length < 2){
        return
    }
    if (node_pair.length > 2){
        // only keep the most recent point
        node_pair = node_pair.slice(-1)
    }
    search_and_render(cy)
}

function init(){
    var style = cytoscape.stylesheet()
        .selector('node')
            .style({
                'background-color': function(ele){ return PLANET_COLOUR[ele.data('system')] || DEFAULT_COLOUR},
                'label': function(ele){ return ele.data('label')},
                'shape': function(ele){ return ele.data('shape')},
                'width': function(ele){ return ele.data('width')},
                'height': function(ele){ return ele.data('height')},
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
                'label': function(ele){ return ele.data('no_braking') + (ele.data('any_aerobrake') ? ' +A' : '' )},
                'color': '#ddd',
                'line-style': 'solid',
                'text-background-color': '#000',
                'text-background-opacity': 0.7,
                'text-background-shape': 'roundrectangle',
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
    
    CY.on('tap', 'node', function(e) {on_tap_handler(CY,e)})
      
    $('#dv_mode').click(function(){
        // iterates the aero mode
        AERO_MODE = (AERO_MODE + 1) % AERO_MODES.length
        $('#dv_mode').text('Aero braking: ' + AERO_MODES[AERO_MODE].friendly).prop('title',  AERO_MODES[AERO_MODE].title)
        search_and_render(CY)
    })
    
    $('#aero_dv').click(function(){
        // iterates the aero dv assumption
        AEROBRAKE_DV = (AEROBRAKE_DV + 1) % AEROBRAKE_DVS.length
        $('#aero_dv').text('Min AB DV: ' + AEROBRAKE_DVS[AEROBRAKE_DV]).prop('title', 'Assumed minimum delta v needed for any aerobraking manouvre')
        search_and_render(CY)
    })
    
    $('#plane_change').click(function(){
        // iterates the plane change dv inclusion
        PLANE_CHANGE = !PLANE_CHANGE
        $('#plane_change').text('Plane changes: ' + (PLANE_CHANGE ? 'always' : 'never'))
        search_and_render(CY)
    })
    
    $('#aero_dv').click()
    $('#dv_mode').click()
    $('#plane_change').click()
    
    var default_node = CY.$('#kerbin_surface')
    default_node.select()
    node_pair.push(default_node)
}

