UI = {}

UI.options = null

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

UI.get_button_text = function(item){
    // make text for the button
    if (!item.options.length){
        return item.name
    }
    var value = item.options[item.index]
    return item.name + ': ' + (value.friendly || value.key)
}

UI.update_button_key = function(item){
    // current key is more useful than the index
    if (!item.options.length){
        item.current_key = ''
        item.current_obj = {}
        return
    }
    item.current_key = item.options[item.index].key
    item.current_obj = item.options[item.index]
}

UI.init_button = function(container, item){
    UI.update_button_key(item)
    container.append($('<div>', {
        text: UI.get_button_text(item),
        title: item.help,
        class: 'button noselect',
    }).on(
        'click', function(){
            item.button = $(this)
            item.index = (item.index + 1) % item.options.length
            UI.update_button_key(item)
            item.button.text(UI.get_button_text(item))
            item.button.attr('title', item.help + '\n' + item.current_obj.title || '')
            UI.save_to_store()
            item.onclick(item)
        }
    ))
}

UI.init_buttons = function(CY){
    UI.options = {
        universe: {
            index: 0,
            name: 'Universe',
            options: _.map(UNIVERSE, function(v, k){ 
                return {
                    friendly: v.friendly,
                    key: k,
                    data: v,
                }
            }),
            help: 'Your current universe',
            onclick: function(item){
                window.location.reload()
            },
        },
        layout: {
            index: 0,
            name: 'Layout',
            options: LAYOUT_SETTINGS,
            help: 'Graph layout methods',
            onclick: function(item){
                CY.layout(item.current_obj.data())
                CY.edges().style({opacity:item.current_key == 'round' ? 0.2 : 1})
            },
        },
        aerobrake: {
            index: 0,
            name: 'Aero',
            options: [
                {key: 'best', friendly: 'perfect', title: 'Optimal aero braking used on every manouvre'}, 
                {key: 'entry_only', friendly: 'on entry', title: 'Only aero brake from orbit to surface'},
                {key: 'no_braking', friendly: 'never', title: 'Never aero brake'},
            ],
            help: 'Delta-V aerobraking assumptions',
            onclick: function(){
                search_and_render(CY)
            },
        },
        aerobrake_dv_min: {
            index: 0,
            name: 'Min. braking dv',
            options: [
                {key: 0},
                {key: 50},
                {key: 100},
                {key: 200},
                {key: 400},
            ],
            help: 'Assumed minimum delta v needed for any aerobraking manouvre',
            onclick: function(item){
                search_and_render(CY)
            },
        },
//        plane: {
//            index: 0,
//            name: 'Plane',
//            help: 'Plane changes align your vessel with the planet rotation, but is often expensive',
//            onclick: function(){
//                search_and_render(CY)
//            },
//        },
        pin: {
            index: 0,
            name: 'Pin',
            options: [{key: true, friendly: 'pinned'}, {key: false, friendly: 'none'}],
            help: 'Pins your current source node',
            onclick: function(item){
                if (pinned){
                    pinned = null
                } else {
                    pinned = node_path[0]
                }
            },
        },
        help: {
            index: 0,
            name: 'Help',
            help: 'What is this all about?',
            onclick: function(){
                $('#wat,#outputs').toggle()
            },
        },
    }
    
    UI.load_from_store()
    
    var controls = $('#controls')
    _.each(UI.options, function(item){
        item.options = item.options || []
        UI.init_button(controls, item)
    })
    
    $('#close_help').click(function(){
        $('#wat,#outputs').toggle()
    })
}

UI.save_to_store = function(){
    var persist = {}
    _.each(UI.options, function(v, k){
        persist[k] = v.index
    })
    console.log(persist)
    window.localStorage.setItem('bodies_config', JSON.stringify(persist))    
}

UI.load_from_store = function(){
    var loaded = JSON.parse(window.localStorage.getItem('bodies_config') || '{}')
    _.each(loaded, function(v, k){
        (UI.options[k] || {})['index'] = v
    })
}