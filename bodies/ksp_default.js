/*
AEROBRAKE: this direction can be aerobraked
DV_MATCH: this direction is the same as the other one (exists to reduce data discrepancies)
*/

UNIVERSE.ksp_local = {
    // a nice name
    friendly: 'Local',
    // a bit more info for the user. who made it? is there a forum link?
    description: 'The local system',
    // create or override nodes by describing their bidirectional edges
    edge_overrides: [
        {source:'kerbin_orbit', target:'kerbin_geostationary', out: 1115, back: AEROBRAKE},
        {source:'kerbin_surface', target:'kerbin_orbit', out: 3400, back: AEROBRAKE},
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
            rotational_period: 138984,
            radius: 200000,
            soi: 2429559.1,
            parent: 'kerbin',
        },
        {
            name: 'minmus',
            colour: '#0fa',
            mass: 2.6457897e19,
            sma: 47000000,
            rotational_period: 40400,
            radius: 60000,
            soi: 2247428.4,
            parent: 'kerbin',
        },
    ]
}

UNIVERSE.ksp_full =  {
    friendly: 'Stock',
    description: 'The full default KSP system',
    edge_overrides: [
        ...UNIVERSE.ksp_local.edge_overrides,
        {source:'ike_orbit', target:'ike_surface', out: 390, back: DV_MATCH},
        {source:'kerbol_orbit', target:'kerbol_surface', out: 67000, back: DV_MATCH},
        {source:'duna_orbit', target:'duna_surface', out: AEROBRAKE, back: 1450},
    ],
    bodies: [
        ...UNIVERSE.ksp_local.bodies, // everything in ksp_default, plus these:
        {
            name: 'ike',
            colour: '#faa',
            mass: 2.7821949e20,
            sma: 3200000,
            radius: 130000,
            soi: 1049598.9,
            parent: 'duna',
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
        {
            name: 'moho',
            colour: '#fa0',
            mass: 2.5263617e21,
            sma: 5263138304,
            rotational_period: 1210000,
            radius: 250000,
            soi: 9646663,
            parent: 'kerbol',
        },
        {
            name: 'dres',
            colour: '#aaa',
            mass: 3.2191322e20,
            sma: 40839348203,
            rotational_period: 34800,
            radius: 138000,
            soi: 32832840,
            parent: 'kerbol',
        },
        {
            name: 'eeloo',
            colour: '#eee',
            mass: 1.1149358e21,
            sma: 90118820000,
            rotational_period: 19460,
            radius: 210000,
            soi: 1.1908294e8,
            parent: 'kerbol',
        },
    ]
}

UNIVERSE.kowgan_swash = {
    friendly: 'Swashlebucky',
    description: 'The famous DV map; Kowgan, Swashlebucky, CuriousMetaphor',
    edge_overrides: [
        {source:'kerbin_orbit', target:'kerbin_geostationary', out: 1115, back: AEROBRAKE},
        {source:'kerbin_orbit', target:'kerbin_capture', out: 950, back: AEROBRAKE},

        {source:'kerbin_orbit', target:'mun_soi', out: 860, back: AEROBRAKE},
        {source:'mun_soi', target:'mun_orbit', out: 310, back: DV_MATCH},
        {source:'mun_orbit', target:'mun_surface', out: 580, back: DV_MATCH},

        {source:'kerbin_orbit', target:'minmus_soi', out: 930, back: AEROBRAKE, plane_change: 340},
        {source:'minmus_soi', target:'minmus_orbit', out: 160, back: DV_MATCH},
        {source:'minmus_orbit', target:'minmus_surface', out: 180, back: DV_MATCH},

        {source:'kerbin_capture', target:'dres_soi', out: 610, back: AEROBRAKE, plane_change: 1010},
        {source:'dres_soi', target:'dres_orbit', out: 1290, back: DV_MATCH},
        {source:'dres_orbit', target:'dres_surface', out: 430, back: DV_MATCH},

        {source:'kerbin_capture', target:'moho_soi', out: 760, back: AEROBRAKE, plane_change: 2520},
        {source:'moho_soi', target:'moho_orbit', out: 2410, back: DV_MATCH},
        {source:'moho_orbit', target:'moho_surface', out: 870, back: DV_MATCH},

        {source:'kerbin_capture', target:'kerbol_capture', out: 6000, back: AEROBRAKE},
        {source:'kerbol_capture', target:'kerbol_orbit', out: 137000, back: DV_MATCH},
        {source:'kerbol_orbit', target:'kerbol_surface', out: 67000, back: DV_MATCH},

        {source:'kerbin_capture', target:'eeloo_soi', out: 1140, back: AEROBRAKE, plane_change: 1330},
        {source:'eeloo_soi', target:'eeloo_orbit', out: 1370, back: DV_MATCH},
        {source:'eeloo_orbit', target:'eeloo_surface', out: 620, back: DV_MATCH},

        {source:'kerbin_capture', target:'eve_soi', out: 90, back: AEROBRAKE, plane_change: 430},
        {source:'eve_soi', target:'eve_capture', out: AEROBRAKE, back: 80},
        {source:'eve_capture', target:'eve_orbit', out: AEROBRAKE, back: 1330},
        {source:'eve_orbit', target:'eve_surface', out: AEROBRAKE, back: 8000},
        {source:'eve_capture', target:'gilly_soi', out: 60, back: DV_MATCH},
        {source:'gilly_soi', target:'gilly_orbit', out: 410, back: DV_MATCH},
        {source:'gilly_orbit', target:'gilly_surface', out: 30, back: DV_MATCH},

        {source:'kerbin_capture', target:'duna_soi', out: 130, back: AEROBRAKE, plane_change: 10},
        {source:'duna_soi', target:'duna_capture', out: AEROBRAKE, back: 250},
        {source:'duna_capture', target:'duna_orbit', out: AEROBRAKE, back: 360},
        {source:'duna_orbit', target:'duna_surface', out: AEROBRAKE, back: 1450},
        {source:'duna_capture', target:'ike_soi', out: 30, back: DV_MATCH},
        {source:'ike_soi', target:'ike_orbit', out: 180, back: DV_MATCH},
        {source:'ike_orbit', target:'ike_surface', out: 390, back: DV_MATCH},

        {source:'kerbin_capture', target:'jool_soi', out: 980, back: AEROBRAKE, plane_change: 270},
        {source:'jool_soi', target:'jool_capture', out: AEROBRAKE, back: 160},
        {source:'jool_capture', target:'jool_orbit', out: AEROBRAKE, back: 2810},
        {source:'jool_orbit', target:'jool_surface', out: AEROBRAKE, back: 14000},

        {source:'jool_capture', target:'pol_soi', out: 160, back: DV_MATCH, plane_change: 700},
        {source:'pol_soi', target:'pol_orbit', out: 820, back: DV_MATCH},
        {source:'pol_orbit', target:'pol_surface', out: 130, back: DV_MATCH},

        {source:'jool_capture', target:'bop_soi', out: 220, back: DV_MATCH, plane_change: 2440},
        {source:'bop_soi', target:'bop_orbit', out: 900, back: DV_MATCH},
        {source:'bop_orbit', target:'bop_surface', out: 220, back: DV_MATCH},

        {source:'jool_capture', target:'tylo_soi', out: 400, back: DV_MATCH},
        {source:'tylo_soi', target:'tylo_orbit', out: 1100, back: DV_MATCH},
        {source:'tylo_orbit', target:'tylo_surface', out: 2270, back: DV_MATCH},

        {source:'jool_capture', target:'vall_soi', out: 620, back: DV_MATCH},
        {source:'vall_soi', target:'vall_orbit', out: 910, back: DV_MATCH},
        {source:'vall_orbit', target:'vall_surface', out: 860, back: DV_MATCH},

        {source:'jool_capture', target:'laythe_soi', out: 930, back: DV_MATCH},
        {source:'laythe_soi', target:'laythe_orbit', out: 1070, back: DV_MATCH},
        {source:'laythe_orbit', target:'laythe_surface', out: AEROBRAKE, back: 2900},
    ],
    bodies: UNIVERSE.ksp_full.bodies,
}