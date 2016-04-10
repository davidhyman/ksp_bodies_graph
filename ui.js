UI = {}

UI.apply_cy_style = function(cy_stylesheet){
    return cy_stylesheet
        .selector('node')
            .style({
                'background-color': function(ele){ return ele.data('colour') || DEFAULT_COLOUR},
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
                'display': function(ele){ return (ele.data('no_render') || ele.data('outbound')) ? 'none' : 'element'},
                'line-color': function(ele){ return ele.target().data('colour') || DEFAULT_COLOUR},
                'label': function(ele){ return Math.round(ele.data('no_braking')) + (ele.data('any_aerobrake') ? '\n(aero)' : '' )},
                'color': '#ddd',
                'line-style': 'solid',
                'text-background-color': '#000',
                'text-background-opacity': 0.7,
                'text-background-shape': 'roundrectangle',
            })
        .selector('edge:selected')
            .style({
                'display': function(ele){ return (ele.data('outbound')) ? 'none' : 'element'},
                'line-style': 'dashed',
            })
}

UI.init_buttons = function(CY){
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
        $('#dv_mode').text('Aero: ' + AERO_MODES[AERO_MODE].friendly).prop('title',  AERO_MODES[AERO_MODE].title)
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
        $('#plane_change').text('Plane: ' + (PLANE_CHANGE ? 'all' : 'none'))
        search_and_render(CY)
    })
    
    $('#gravity_assist').click(function(){
        // iterates the plane change dv inclusion
        GRAVITY_ASSIST = !GRAVITY_ASSIST
        $('#gravity_assist').text('Gravity: ' + (GRAVITY_ASSIST ? 'assist' : 'none'))
        search_and_render(CY)
    })
    
    $('#pin').click(function(){
        // pins a node
        if (pinned){
            pinned = null
        } else {
            pinned = node_path[0]
        }
        $('#pin').text('Pin: ' + (pinned ? pinned.data('label') : 'none'))
    })
    
    $('#help, #close_help').click(function(){
        $('#wat,#outputs').toggle()
    })
    
    $('#pin').click()
    $('#aero_dv').click()
    $('#dv_mode').click()
    $('#plane_change').click()
    $('#layout').click()
    $('#gravity_assist').click()
}