function test(){
    var tests = [
        { // surface checks
            from: '#kerbin_surface',
            to: '#mun_surface',
            expect: 5150
        },
        {
            from: '#mun_surface',
            to: '#kerbin_surface',
            expect: 1800
        },
        {
            from: '#kerbin_surface',
            to: '#duna_surface',
            expect: 5140
        },
        {
            from: '#kerbin_surface',
            to: '#ike_surface',
            expect: 5330
        },
        {
            from: '#kerbin_surface',
            to: '#minmus_surface',
            expect: 4670
        },
        {
            from: '#kerbin_surface',
            to: '#mun_surface',
            expect: 5150
        },
        { // orbit checks
            from: '#mun_orbit',
            to: '#minmus_orbit',
            expect: 303
        },
        {
            from: '#moho_orbit',
            to: '#dres_orbit',
            expect: 6254
        },
        {
            from: '#duna_orbit',
            to: '#dres_orbit',
            expect: 2339
        },
        { // landing dv
            from: '#moho_orbit',
            to: '#moho_surface',
            expect: 870
        },
    ]
    
    var c = []
    _.each(tests, function(params){
        var t = search_graph(CY, CY.$(params.from), CY.$(params.to))
        var cost = t.total
        var p = Math.round(100 * ((cost - params.expect) / cost))
        c.push(Math.abs(p))
        console.log('test', params, cost,
                    'error: ' + Math.round(cost - params.expect),
                    p + '%'
        )
    })
    console.log(
        'max abs', _.reduce(c, function(memo, num){ return Math.max(memo, num); }, 0),
        'total', _.reduce(c, function(memo, num){ return memo + num; }, 0),
        'sum squares', _.reduce(c, function(memo, num){ return memo + (num * num); }, 0)
    )
}