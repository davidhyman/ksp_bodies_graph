BODIES.ksp_default = [
    {
        name: 'kerbol',
        colour: '#ff0',
        mass: 1.7565670e28,
        sma: null,
        radius: 261600000,
        soi: null,
        parent: null,
    },
    {
        name: 'kerbin',
        colour: '#0af',
        mass: 5.2915793e22,
        sma: 13599840256,
        radius: 670000,
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
        radius: 370000,
        soi: 47921949,
        parent: 'kerbol',
    },
]


BODIES.ksp_extra = [
    ...BODIES.ksp_default, // everything in ksp_default, plus these:
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