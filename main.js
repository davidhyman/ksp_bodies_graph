$(document).ready(function(){
    init()
})

const AEROBRAKE = false
const DV_MATCH = null
const DEFAULT_NODE_SELECTOR = '#kerbin_surface'

// some modes for aero calculations
var AERO_MODES = [
    {key: 'best', friendly: 'perfect', title: 'Optimal aero braking used on every manouvre'}, 
    {key: 'entry_only', friendly: 'on entry', title: 'Only aero brake from orbit to surface'},
    {key: 'no_braking', friendly: 'never', title: 'Never aero brake'},
]
var AERO_MODE = 0

// some modes for assuming a mimimum dv on aerobraking
var AEROBRAKE_DV = 0
var AEROBRAKE_DVS = [0, 50, 100, 200, 400]

var PLANE_CHANGE = true

// our start and end points
var node_pair = []
var pinned = null

// planet colours
const DEFAULT_COLOUR = '#333'
const PLANET_COLOUR = {
    kerbol: '#ff0',
    kerbin: '#0AF',
    mun: '#666',
    minmus: '#0fa',
    eeloo: '#eee',
    dres: '#aaa',
    duna: '#a00',
    ike: '#faa',
    eve: '#a0a',
    gilly: '#faf',
    moho: '#fa0',
    jool: '#060',
    pol: '#080',
    bop: '#0a0',
    tylo: '#0c0',
    vall: '#0a6',
    laythe: '#0aa',
}

// ksp dv map, directions are relative to kerbin
const NODE_SOURCE = [
    {source:'kerbin_surface', target:'kerbin_orbit', out: 3400, back: AEROBRAKE},
    {source:'kerbin_orbit', target:'kerbin_geostationary', out: 1115, back: AEROBRAKE},
    {source:'kerbin_orbit', target:'kerbin_capture', out: 950, back: AEROBRAKE},
    
    {source:'kerbin_orbit', target:'mun_intercept', out: 860, back: AEROBRAKE},
    {source:'mun_intercept', target:'mun_orbit', out: 310, back: DV_MATCH},
    {source:'mun_orbit', target:'mun_surface', out: 580, back: DV_MATCH},
    
    {source:'kerbin_orbit', target:'minmus_intercept', out: 930, back: AEROBRAKE, plane_change: 340},
    {source:'minmus_intercept', target:'minmus_orbit', out: 160, back: DV_MATCH},
    {source:'minmus_orbit', target:'minmus_surface', out: 180, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'dres_intercept', out: 610, back: AEROBRAKE, plane_change: 1010},
    {source:'dres_intercept', target:'dres_orbit', out: 1290, back: DV_MATCH},
    {source:'dres_orbit', target:'dres_surface', out: 430, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'moho_intercept', out: 760, back: AEROBRAKE, plane_change: 2520},
    {source:'moho_intercept', target:'moho_orbit', out: 2410, back: DV_MATCH},
    {source:'moho_orbit', target:'moho_surface', out: 870, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'kerbol_capture', out: 6000, back: AEROBRAKE},
    {source:'kerbol_capture', target:'kerbol_orbit', out: 137000, back: DV_MATCH},
    {source:'kerbol_orbit', target:'kerbol_surface', out: 67000, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'eeloo_intercept', out: 1140, back: AEROBRAKE, plane_change: 1330},
    {source:'eeloo_intercept', target:'eeloo_orbit', out: 1370, back: DV_MATCH},
    {source:'eeloo_orbit', target:'eeloo_surface', out: 620, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'eve_intercept', out: 90, back: AEROBRAKE, plane_change: 430},
    {source:'eve_intercept', target:'eve_capture', out: AEROBRAKE, back: 80},
    {source:'eve_capture', target:'eve_orbit', out: AEROBRAKE, back: 1330},
    {source:'eve_orbit', target:'eve_surface', out: AEROBRAKE, back: 8000},
    {source:'eve_capture', target:'gilly_intercept', out: 60, back: DV_MATCH},
    {source:'gilly_intercept', target:'gilly_orbit', out: 410, back: DV_MATCH},
    {source:'gilly_orbit', target:'gilly_surface', out: 30, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'duna_intercept', out: 130, back: AEROBRAKE, plane_change: 10},
    {source:'duna_intercept', target:'duna_capture', out: AEROBRAKE, back: 250},
    {source:'duna_capture', target:'duna_orbit', out: AEROBRAKE, back: 360},
    {source:'duna_orbit', target:'duna_surface', out: AEROBRAKE, back: 1450},
    {source:'duna_capture', target:'ike_intercept', out: 30, back: DV_MATCH},
    {source:'ike_intercept', target:'ike_orbit', out: 180, back: DV_MATCH},
    {source:'ike_orbit', target:'ike_surface', out: 390, back: DV_MATCH},
    
    {source:'kerbin_capture', target:'jool_intercept', out: 980, back: AEROBRAKE, plane_change: 270},
    {source:'jool_intercept', target:'jool_capture', out: AEROBRAKE, back: 160},
    {source:'jool_capture', target:'jool_orbit', out: AEROBRAKE, back: 2810},
    {source:'jool_orbit', target:'jool_surface', out: AEROBRAKE, back: 14000},
    
    {source:'jool_capture', target:'pol_intercept', out: 160, back: DV_MATCH, plane_change: 700},
    {source:'pol_intercept', target:'pol_orbit', out: 820, back: DV_MATCH},
    {source:'pol_orbit', target:'pol_surface', out: 130, back: DV_MATCH},
    
    {source:'jool_capture', target:'bop_intercept', out: 220, back: DV_MATCH, plane_change: 2440},
    {source:'bop_intercept', target:'bop_orbit', out: 900, back: DV_MATCH},
    {source:'bop_orbit', target:'bop_surface', out: 220, back: DV_MATCH},
    
    {source:'jool_capture', target:'tylo_intercept', out: 400, back: DV_MATCH},
    {source:'tylo_intercept', target:'tylo_orbit', out: 1100, back: DV_MATCH},
    {source:'tylo_orbit', target:'tylo_surface', out: 2270, back: DV_MATCH},
    
    {source:'jool_capture', target:'vall_intercept', out: 620, back: DV_MATCH},
    {source:'vall_intercept', target:'vall_orbit', out: 910, back: DV_MATCH},
    {source:'vall_orbit', target:'vall_surface', out: 860, back: DV_MATCH},
    
    {source:'jool_capture', target:'laythe_intercept', out: 930, back: DV_MATCH},
    {source:'laythe_intercept', target:'laythe_orbit', out: 1070, back: DV_MATCH},
    {source:'laythe_orbit', target:'laythe_surface', out: AEROBRAKE, back: 2900},
]

function node_data(node_id){
    var ns = node_id.split('_')
    return {
        id: node_id,
        system: ns[0],
        state: ns[1],
        label: ns[0] + '\n' + ns[1],
        label_colour: $('<span>').append($('<span>', {text: ns[0], style:'color:'+PLANET_COLOUR[ns[0]]+';'}), $('<span>', {text: ' '+ns[1]})),
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
    container.append($('<div>', {html: 
        start.data('label_colour')[0].outerHTML + ' to ' + end.data('label_colour')[0].outerHTML
    }))
    container.append($('<div>', {text: 
        'total dv: ' + results.weight
    }))
    var tab = $('<table>')
    _.each(results.path, function(pth){
        if (pth.isNode()){return}
        var row = $('<tr>')
        row.append(
            $('<td>', {html: pth.target().data('label_colour')[0].outerHTML}),
            $('<td>', {text: pth.data('is_aerobrake') ? pth.data('no_braking') + ' A' : '', title: 'dv without aerobraking'}),
            $('<td>', {text: PLANE_CHANGE && pth.data('plane_change') ? pth.data('plane_change') + ' P' : '', title: 'extra dv for plane change'}),
            $('<td>', {text: pth.data(AERO_MODES[AERO_MODE].key), class:'dv_cells'})
        )
        tab.append(row)
    })
    container.append(tab)
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
    if (pinned){
        node_pair = []
        node_pair.push(pinned)
    }
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

function init_buttons(CY){
    $('#layout').click(function(){
        // iterates the layouts
        LAYOUT = (LAYOUT + 1) % LAYOUTS.length
        $('#layout').text('Layout: ' + LAYOUTS[LAYOUT])
        CY.layout(LAYOUT_SETTINGS[LAYOUTS[LAYOUT]])
        // too cluttered with edges
        CY.edges().style({opacity:LAYOUTS[LAYOUT] == 'round' ? 0.2 : 1})
    })
      
    $('#dv_mode').click(function(){
        // iterates the aero mode
        AERO_MODE = (AERO_MODE + 1) % AERO_MODES.length
        $('#dv_mode').text('Aero braking: ' + AERO_MODES[AERO_MODE].friendly).prop('title',  AERO_MODES[AERO_MODE].title)
        search_and_render(CY)
    })
    
    $('#aero_dv').click(function(){
        // iterates the aero dv assumption
        AEROBRAKE_DV = (AEROBRAKE_DV + 1) % AEROBRAKE_DVS.length
        $('#aero_dv').text('Min. braking dv: ' + AEROBRAKE_DVS[AEROBRAKE_DV])
        search_and_render(CY)
    })
    
    $('#plane_change').click(function(){
        // iterates the plane change dv inclusion
        PLANE_CHANGE = !PLANE_CHANGE
        $('#plane_change').text('Plane changes: ' + (PLANE_CHANGE ? 'all' : 'none'))
        search_and_render(CY)
    })
    
    $('#pin').click(function(){
        // pins a node
        if (pinned){
            pinned = null
        } else {
            pinned = node_pair[0]
        }
        $('#pin').text('Pinned: ' + (pinned ? pinned.data('label') : 'none'))
    })
    
    $('#pin').click()
    $('#aero_dv').click()
    $('#dv_mode').click()
    $('#plane_change').click()
    $('#layout').click()
}

function init(){
    CY = cytoscape({
        container: $('#graph'),
        elements: get_data(),
        selectionType: 'additive',
        autoungrabify: true,
        wheelSensitivity: 0.15,
    })
    CY.on('tap', 'node', function(e) {on_tap_handler(CY,e)})

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
    CY.style(style)
    
    LAYOUT_SETTINGS = {
        'spring': {
            name: 'cose',
            gravity: 0,
            numIter: 12000,
            minTemp: 0.1,
            coolingFactor: 0.98,
            nodeRepulsion: function( node ){ return 100000; },
            idealEdgeLength: function( edge ){ return 3},
            edgeElasticity: function( edge ){ return 200*(edge.target().degree() + edge.source().degree()) },
        },
        'round': {
            name: 'concentric',
            startAngle: Math.PI * 9/8,
            sweep: Math.PI * 6/8,
            minNodeSpacing: 2,
            equidistant: false,
            concentric: function( node ){
                var x = search_graph(CY, CY.$(DEFAULT_NODE_SELECTOR), node);
                return -x.path.length
            },
            levelWidth: function( nodes ){ return 3},
        },
        'tree': {
            name: 'breadthfirst',
            roots: CY.$(DEFAULT_NODE_SELECTOR),
        }
    }
    LAYOUT = 1
    LAYOUTS = _.keys(LAYOUT_SETTINGS)
    
    var default_node = CY.$(DEFAULT_NODE_SELECTOR)
    default_node.select()
    node_pair.push(default_node)
    
    init_buttons(CY)
}

