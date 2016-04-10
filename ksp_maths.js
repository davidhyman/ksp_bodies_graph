M = {}

M.orbit_to_surface = function(item){
    // speed of the planet surface - we must match this or be destroyed
    var surface_velocity = item.rotational_period ? 2*Math.PI / item.rotational_period : 0
    var orbit_at_surface = Math.sqrt(item.mass * G / item.radius)
    var hm = M.hohmann(item.mass, item.radius, item.orbit).total
    return (hm + orbit_at_surface - surface_velocity) * SUICIDE_BURN_MARGIN
}

M.hohmann = function(mass, start, target){
    // see https://en.wikipedia.org/wiki/Hohmann_transfer_orbit
    var ap_radius = Math.max(start, target)
    var pe_radius = Math.min(start, target)
    var output = {
        enter: M.hohmann_enter(mass, pe_radius, ap_radius),
        exit: M.hohmann_exit(mass, pe_radius, ap_radius)
    }
    output.total = output.enter + output.exit
    //console.log('hohmann for ', mass, start, target, output)
    return output
}

M.hohmann_enter = function(mass, start, target){
    return Math.abs(
        Math.sqrt(mass * G / start) 
        * (
            Math.sqrt(2 * target / (start + target))
            - 1
        )
    )
}

M.hohmann_exit = function(mass, start, target){
    return Math.abs(
        Math.sqrt(mass * G / target) 
        * (
            1
            - Math.sqrt(2 * start / (start + target))
        )
    )
}

M.calc_dv = function(edge, force_raw){
    var edge_data = edge.data()
    // substitute our assumed minimum dv value for aerobraking manouvres
    var aero_best = edge_data['is_aerobrake'] ? UI.options.aerobrake_dv_min.current_obj : edge.data('dv')
    
    // save our calculations on the edges so we can refer to them later
    edge_data['best'] = aero_best
    edge_data['entry_only'] = edge.target().data('state')=='surface' ? aero_best : edge_data['no_braking']
    var dv = edge_data.dv //[UI.options.aerobrake_dv_min.current_obj]
//    if (UI.options.plane_change.current_obj){
//        dv += edge_data['plane_change']
//    }
    if (!force_raw && (edge.target().data('system') != edge.source().data('system'))){
        dv += 2e6 // weight SOI transitions heavily
    }
    return dv
}