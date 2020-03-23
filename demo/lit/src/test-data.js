export let test_setup = {
    catsetup:{
        C:{
            'unit': 'C',
            'unithtml':'°C',
            'plot_type': 'scatter',
            'normalize':false,
            'groupnorm':null,
            'yaxis': 'y_temp',
            'opacityMap':{}
        },
        SW:{
            'unit': 'SW',
            'unithtml':'',
            'plot_type': 'SW',
            'normalize':false,
            'groupnorm':null,
            'yaxis': 'y_state',
            'opacityMap':{}
        },
        dC:{
            'unit': 'C',
            'unithtml':'Δ°C',
            'plot_type': 'scatter',
            'normalize':false,
            'groupnorm':null,
            'yaxis': 'y_tempdelta',
            'opacityMap':{}
        },
        mps:{
            'unit': 'm/s',
            'unithtml':'m/s',
            'plot_type': 'scatter',
            'normalize':false,
            'groupnorm':null,
            'yaxis': 'y_speed',
            'opacityMap':{}
        },
    },
    codesetup:{
        t1:{
            'desc':'Temp under sun'
        },
        t2:{
            'desc':'Switch state'
        },
        t3:{
            'desc':'Temp difference'
        },
        t4:{
            'desc':'Some speed'
        },
    },
    codecat:{
        't1':'C',
        't2':'SW',
        't3':'dC',
        't4':'mps',
    }
};