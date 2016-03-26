/*
AEROBRAKE: this direction can be aerobraked
DV_MATCH: this direction is the same as the other one (exists to reduce data discrepancies)
*/

UNIVERSE.ksp_default = {
    // create or override nodes by describing their bidirectional edges
    edge_overrides: [
        {source:'kerbin_orbit', target:'kerbin_geostationary', out: 1115, back: AEROBRAKE},
        {source:'kerbin_surface', target:'kerbin_orbit', out: 3400, back: AEROBRAKE},
        {source:'mun_orbit', target:'mun_surface', out: 580, back: DV_MATCH},
        {source:'minmus_orbit', target:'minmus_surface', out: 180, back: DV_MATCH},
        {source:'kerbol_orbit', target:'kerbol_surface', out: 67000, back: DV_MATCH},
        {source:'duna_orbit', target:'duna_surface', out: AEROBRAKE, back: 1450},
        {source:'ike_orbit', target:'ike_surface', out: 390, back: DV_MATCH},
    ],
    // explicitly provide information for tangible nodes
    bodies: [
        {
            name: 'kerbol',
            colour: '#ff0',
            mass: 1.7565670e28,
            sma: null,
            atmosphere: 600000,
            radius: 261600000,
            soi: null,
            parent: null,
        },
        {
            name: 'kerbin',
            colour: '#0af',
            mass: 5.2915793e22,
            sma: 13599840256,
            atmosphere: 70000,
            radius: 600000,
            soi: 84159286,
            parent: 'kerbol',
        },
        {
            name: 'mun',
            colour: '#666',
            mass: 9.7600236e20,
            sma: 12000000,
            radius: 200000,
            soi: 2429559.1,
            parent: 'kerbin',
        },
        {
            name: 'minmus',
            colour: '#0fa',
            mass: 2.6457897e19,
            sma: 47000000,
            radius: 60000,
            soi: 2247428.4,
            parent: 'kerbin',
        },
        {
            name: 'duna',
            colour: '#a00',
            mass: 4.5154812e21,
            sma: 20726155264,
            atmosphere: 50000,
            radius: 320000,
            soi: 47921949,
            parent: 'kerbol',
        },
    ]
}


UNIVERSE.ksp_extra =  {
    edge_overrides: [
        ...UNIVERSE.ksp_default.edge_overrides,
    ],
    bodies: [
        ...UNIVERSE.ksp_default.bodies, // everything in ksp_default, plus these:
        {
            name: 'ike',
            colour: '#faa',
            mass: 2.7821949e20,
            sma: 3200000,
            radius: 130000,
            soi: 1049598.9,
            parent: 'duna',
        },
    ]
}