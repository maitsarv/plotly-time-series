var plotly_time_series_setup = function () {

    let setupValues = {
        setup_by_cat:{},
        setup_by_code:{},
        cat_by_code:{},
        current_time: new Date(),
        defaultHistogramSetup:{opacity:0.22},
        defaultChartColors:{
            "1f77b4": false,
            "63b800": false,
            "e15b00": false,
            "000000": false,
            "0054af": false,
            "8e3900": false,
            "00b9e2": false,
            "ff00e5": false,
            "dcc539": false,
        },
        supportedPlotTypes: {scatter:false,histogram:false},
    };

    let overWriteFunctions = {
        globalSetup: null,
        setupByCode:null,
        setupByCat:null
    };

    let setupTemaple = function(){
        return {
            'unit': '',
            'unithtml':'',
            'plot_type': 'scatter',
            'normalize':false,
            'groupnorm':null,
            'yaxis': null,
            'opacityMap':{},
            'desc':''
        }
    };

    let requestURLs = {
        'default':[],
        'plot':{}
    };

    let createUrl = function(plotid,code){
        let url = requestURLs['default'];
        if(plotid !== null && requestURLs['plot'][plotid] !== undefined){
            url = requestURLs['plot'][plotid];
        }
        let params = url[1];
        if(params === null)params=[];
        params.push("req="+code);
        params = params.join("&");
        url = url[0]+"?"+params;
        return url;
    };

    let fetchGlobalSetup = function (plotid) {
        if(overWriteFunctions.globalSetup !== null) {
            return new Promise((resolve, reject) => {
                let ow = Promise.resolve(overWriteFunctions.globalSetup(setupValues));
                ow.then(function () {
                    resolve();
                });
            });
        }
        let url = createUrl(plotid,'global-setup');

        $.ajax({
            url: url,
            method: "GET",
            success: function (data) {
                if(data.success){
                    if(data.codesetup !== undefined){
                        for (let d in data.codesetup){
                            setupValues.setup_by_code[d] = data.codesetup[d];
                        }
                    }
                    if(data.catsetup !== undefined){
                        for (let d in data.catsetup){
                            setupValues.setup_by_cat[d] = data.catsetup[d];
                        }
                    }
                    if(data.codecat !== undefined){
                        for (let d in data.codecat){
                            setupValues.cat_by_code[d] = data.codecat[d];
                        }
                    }
                } else {
                    alert("Could not load setup");
                }
            }
        });
    };

    let fetchSetupByCode = function (codes, plotid) {
        if(!Array.isArray(codes)) codes = [codes];
        if(overWriteFunctions.setupByCode !== null) {
            return new Promise((resolve, reject) => {
                let ow = Promise.resolve(overWriteFunctions.setupByCode(codes, plotid, setupValues));
                ow.then(function () {
                    for(let c=0;c<codes.length;c++){
                        if(setupValues.setup_by_code[codes[c]] === undefined) setupValues.setup_by_code[codes[c]] = null;
                    }
                    resolve();
                });
            });
        }
        return new Promise((resolve, reject) => {
            let url = createUrl(plotid);
            $.ajax({
                url: url,
                method: "GET",
                data:{
                    codes:codes
                },
                success: function (data) {
                    if(data.success){
                        if(data.codesetup !== undefined){
                            for (let d in data.codesetup){
                                setupValues.setup_by_code[d] = data.codesetup[d];
                            }
                        }
                    }
                    if(data.codecat !== undefined){
                        for (let d in data.codecat){
                            setupValues.cat_by_code[d] = data.codecat[d];
                        }
                    }
                    resolve();
                },
                error: function () {
                    resolve();
                }
            });
        });

    };
    let fetch_setup_by_cat = function () {

    };

    let findSetupForCode = function(code){
        let setup = setupTemaple();
        if(setupValues.cat_by_code[code] !== undefined){
            let cat = setupValues.cat_by_code[code];
            if(setupValues.setup_by_cat[cat] !== undefined){
                setup = setupValues.setup_by_cat[cat];
            }
        }
        if(setupValues.setup_by_code[code] !== undefined && setupValues.setup_by_code[code] !== null){
            for(let s in setupValues.setup_by_code[code]){
                setup[s] = setupValues.setup_by_code[code][s];
            }
        }
        return setup;
    };

    async function getCodeSetup(code, plotid) {
        if(setupValues.setup_by_code[code] !== undefined){
            return findSetupForCode(code);
        } else {
            await fetchSetupByCode(code,plotid);
            return findSetupForCode(code);
        }
    };

    let setRequestUrl = function (plotId,action,params) {
        if(plotId === null){
            requestURLs['default'] = [action,params];
        } else {
            requestURLs['plot'][plotId] = [action,params];
        }
    };


    let getInitialPlotLayout = function () {

        var defGlobalPlotyAxisTypeUnits = {
            "y_temp": "°C",
            "y_percent": "SW",
            "y_pres": "bar",
            "y_presk": "kPa",
            "y_tempdelta": "Δ°C",
            "y_hour": "h",
            "y_freq": "Hz",
            "y_volume_ms": "m³/s",
            "y_speed": "m/s",
            "y_volume_ls": "L/s",
            "y_volume_lh": "l/h",
            "y_volume_mh": "m³/h",
            "y_volume": "m³",
            "y_power_k": "kW",
            "y_power": "W",
            "y_ppm": "ppm",
            "y_ppb": "ppb",
            "y_energy": "kWh",
            "y_energy_wh": "Wh",
            "y_eur": "EUR",
            "y_rpm": "rpm",
            "y_state": "St"
        };

        var specailAxisPref = {
            "y_percent_stacked":{
                range: [0, 100],
                fixedrange: true
            },
            "y_percent":{
                range: [0, 101],
                fixedrange: true
            },
            "y_temp":{
                rangemode: "normal"
            },
            "y_state":{
                range: [0, 100],
                fixedrange: true,
                autorange: false,
            }
        };

        var initialLayout = {
            showlegend: false,
            autosize: true,
            responsive:true,
            margin: {
                b:8,
                t:20,
                l:40,
                r:40,
                pad:2
            },
            plot_bgcolor: "rgba(255,255,255,0)",
            bargap: .05,
            xaxis: {
                domain: [0,0.9],
                hoverformat: '%Y-%m-%d %H:%M',
                tickformat: '%m-%d %H:%M',
                tickformatstops: [
                    {
                        dtickrange: [86400000, 604800000],
                        "value": "%m-%d"
                    }, {
                        dtickrange: [604800000, "M1"],
                        "value": "%m-%d"
                    },{
                        dtickrange: ["M1", "M12"],
                        value: "%Y-%m"
                    },{
                        dtickrange: ["M12", null],
                        value: "%Y"
                    }
                ],
                rangeslider: {},
                type: "date",
                calendar: "gregorian",
                spikethickness:1,
                showspikes:false,
                range:[new Date(new Date().setDate(setupValues.current_time.getDate()-7)),setupValues.current_time]
            },
        };

        let axesCount = 1;
        let usedAxes = {};
        var activeAxesCount = {};
        var axisTitles = [];
        for(let a in defGlobalPlotyAxisTypeUnits){
            if(usedAxes[a] !== undefined) continue;
            let axis = {
                titlefont: {color: '#686868'},
                tickfont: {color: '#668866'},
                side: 'left',
                showline: false,
                showgrid: false,
                zeroline: false,
                showticklabels: false,
                xaxis: 'x1',
                rangemode: "tozero",
                fixedrange: false,
                hoverformat: '.2f',
                hoverinfo: 'y+name',
                spikethickness:1,
                showspikes:false,
                autorange: true,
            };
            let title = {
                xref: 'paper',
                yref: 'paper',
                x: 0,
                xanchor: 'right',
                y: 1,
                yanchor: 'bottom',
                text: defGlobalPlotyAxisTypeUnits[a],
                font:{
                    size: 12,
                    color: "rgba(0,0,0,0)"
                },
                showarrow: false
            };
            if(axesCount>1) axis['overlaying'] = 'y';
            if(specailAxisPref[a] !== undefined){
                for(let s in specailAxisPref[a]){
                    axis[s] = specailAxisPref[a][s];
                }
            }
            if(axesCount>1) {
                title.axis = 'yaxis'+axesCount;
                initialLayout['yaxis'+axesCount] = axis;
                usedAxes[a] = axesCount;
            }
            else {
                title.axis = 'yaxis';
                initialLayout['yaxis'] = axis;
                usedAxes[a] = "";
            }
            axisTitles.push(title);
            activeAxesCount[a] = 0;
            axesCount++;
        }

        return [initialLayout,activeAxesCount,axisTitles,usedAxes,defGlobalPlotyAxisTypeUnits];
    };

    return {
        setupValues: setupValues,
        requestURLs: requestURLs,
        overWriteFunctions:overWriteFunctions,
        setRequestURL: setRequestUrl,
        getCodeSetup: getCodeSetup,
        getInitialPlotLayout:getInitialPlotLayout,
        fetchSetupByCode:fetchSetupByCode,
        fetchGlobalSetup:fetchGlobalSetup,
        getQueryUrl:createUrl
    }
};

export default plotly_time_series_setup;