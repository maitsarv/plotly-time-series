let plSetupHolder = function () {
    let setupValues = {
        setup_by_cat:{},
        setup_by_code:{},
        cat_by_code:{},
        current_time: new Date(),
        defaultHistogramSetup:{opacity:0.22},
        defaultChartColors:{
            "1f77b4": false,
            "63b800": false,
            "00dcab": false,
            "e15b00": false,
            "000000": false,
            "0054af": false,
            "8e3900": false,
            "00b9e2": false,
            "ff00e5": false,
        }
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
        if(setupValues.setup_by_code[code] !== null){
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
                fixedrange: true
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
                showspikes:false
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

let plotly_handler = function (plotid,setup_instance) {


    let helpers = (function(){
        let actionPromiseQueue = (function(){

            let currentQueue = [];
            let currentRun = false;

            let addToQueue = function (functionName,params) {
                currentQueue.push([functionName,params]);
                if(currentRun === false){
                    checkQueue();
                }
            };

            var checkQueue = function () {
                if(currentQueue.length > 0){
                    currentRun = true;
                    let next = currentQueue.shift();
                    let result = next[0].apply(null, next[1]);
                    var isPromise = result !== undefined && typeof result.then == 'function';
                    if(isPromise){
                        result.then(function () {
                            checkQueue();
                        });
                    } else {
                        checkQueue();
                    }
                } else {
                    currentRun = false;
                }
            };

            return {
                addToQueue:addToQueue
            }
        })();


        let dataFormatters = {
            "JSON_PARSE": function (tagData) {
                tagData.values = JSON.parse(tagData.values)
            },
            "TYPE_CONVERSION": function (tagData) {
                for (let l = 0; l < tagData.values.length; l++) {
                    //TODO: Remove conversion
                    tagData.values[l][0] = (new Date(tagData.values[l][0]).getTime() / 1000);
                    tagData.values[l][1] = parseFloat(tagData.values[l][1]).toFixed(2);
                }
            },
            "CSV_SIMPLE": function (tagData) {
                let curVals = tagData.values;
                curVals = curVals.split("\n");
                if(curVals.length >0){
                    tagData.values = processCSVRows(curVals);
                } else {
                    tagData.values = [];
                }
            },
            "CSV_W_HEADER": function (tagData) {
                let curVals = tagData.values;
                curVals = curVals.split("\n");
                if(curVals.length >1){
                    curVals.shift();
                    tagData.values = processCSVRows(curVals);
                } else {
                    tagData.values = [];
                }
            },
            "REMOVE_REPEATING_ROW":function (tagData) {
                let newData = [];
                let currentValue = null;
                for (let l = 0; l < tagData.values.length; l++) {
                    if(tagData.values[l][1] !== currentValue){
                        newData.push(tagData.values[l]);
                        currentValue = tagData.values[l][1];
                    }
                }
                tagData.values = newData;
            }
        };


        let processCSVRows = function(curVals){
            for (let l = 0; l < curVals.length; l++) {
                curVals[l] = curVals[l].split(",");
                curVals[l] = [(new Date(curVals[l][0]).getTime() / 1000),parseFloat(curVals[l][1]).toFixed(2)];
            }
            return curVals;
        };




        var ajax = {};
        ajax.x = function () {
            if (typeof XMLHttpRequest !== 'undefined') {
                return new XMLHttpRequest();
            }
            var versions = [
                "MSXML2.XmlHttp.6.0",
                "MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];

            var xhr;
            for (var i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                } catch (e) {
                }
            }
            return xhr;
        };

        ajax.send = function (url, method, data, callback,addHeaders) {
            var x = ajax.x();
            var query = [];
            for (var key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            if(method === "GET"){
                url = url + (query.length ? '?' + query.join('&') : '');
                data = "";
            } else if (method === 'POST') {
                data = query.join('&');
            }

            x.open(method, url, true);
            x.onreadystatechange = function () {
                if (x.readyState === 4) {
                    callback(x.responseText)
                }

            };
            if (method === 'POST') {
                x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            for(let h in addHeaders){
                x.setRequestHeader(h, addHeaders[h]);
            }
            x.send(data)
        };

        ajax.get = function (url, data, callback, async) {
            var query = [];
            for (var key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async)
        };

        ajax.post = function (url, data, callback, async) {
            var query = [];
            for (var key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            ajax.send(url, callback, 'POST', query.join('&'), async)
        };



        var findNewButtonColor = function (preferred) {
            let color = null;
            if(preferred !== undefined){
                preferred = preferred.replace("#","");
                if(plot_elements_state.datasetColors[preferred] === false){
                    color = "#" + preferred;
                    plot_elements_state.datasetColors[preferred] = true;
                    return  color;
                }
            }
            for (let col in plot_elements_state.datasetColors) {
                if (plot_elements_state.datasetColors[col] === false) {
                    color = "#" + col;
                    plot_elements_state.datasetColors[col] = true;
                    break;
                }
            }
            return color;
        };
        var releaseButtonColor = function(col){
            col = col.replace("#","");
            plot_elements_state.datasetColors[col] = false;
        };

        return {
            queue:actionPromiseQueue,
            dataFormatters,dataFormatters,
            ajax:ajax,
            findNewButtonColor:findNewButtonColor,
            releaseButtonColor:releaseButtonColor
        }
    })();


    let overWriteFunctions = {
        queryData:null
    };


    let plot_elements_state = {
        'plot':{},
        'elems':{},
        'axes':{
            axisActiveCount:{},
            axisTitles:{},
            axisMap:{}
        },
        shapeGroups:{},
        datasetColors:{},
        pendingSetup: [],
        unit_to_axes:{},
        timeformat: 'unix'
    };

    let createPlot = function(containers){

        let createPlotElems = function(con){
            let plotcont = document.createElement("div");
            plotcont.classList.add("plot-inner");
            let legend = document.createElement("div");
            plotcont.classList.add("plot-legend");
            con.appendChild(plotcont);
            con.appendChild(legend);
            return[plotcont,legend];
        };

        let populateUnitAxesMapping = function (ax_setup) {
            for(let a in ax_setup){
                let unit = ax_setup[a].replace(/[^\x20-\x7E]/g, "");
                if(plot_elements_state.unit_to_axes[unit] === undefined) plot_elements_state.unit_to_axes[unit] = [];
                plot_elements_state.unit_to_axes[unit].push(a);
            }


        };

        let plotCont = document.getElementById(plotid);

        let plotElems = containers;
        if(plotElems === null)plotElems = createPlotElems(plotCont);
        else {
            plotElems[0].classList.add("plot-inner");
            plotElems[1].classList.add("plot-legend");
        }
        let initialLayout = setup_instance.getInitialPlotLayout();
        populateUnitAxesMapping(initialLayout[4]);
        plot_elements_state.axes.axisActiveCount = initialLayout[1];
        plot_elements_state.axes.axisTitles = initialLayout[2];
        plot_elements_state.axes.axisMap = initialLayout[3];
        initialLayout[0].annotations = initialLayout[2];
        initialLayout[0].shapes = [];

        Plotly.newPlot(plotElems[0], [], initialLayout[0]).then(function (p) {
            plot_elements_state.plot = p;
        });

        for(let c in setup_instance.setupValues.defaultChartColors){
            plot_elements_state.datasetColors[c] = setup_instance.setupValues.defaultChartColors[c];
        }
    };


    let plotAnnotations = (function () {
        let defaultAnnotation = function () {
            return {
                id: '',
                type: 'rect',
                xref: 'x',
                yref: 'y',
                x0: 0,
                y0: 0,
                x1: setup_instance.setupValues.current_time,
                y1: 2,
                fillcolor: "#868686",
                opacity: 0.5,
                visible: false,
                labeltext: "",
                line: {
                    width: 0
                }
            };
        };

        var toggleStateAnnotations = function (visible,code,color) {
            if(plot_elements_state.shapeGroups[code] === undefined) return;
            for(let a = 0;a<plot_elements_state.shapeGroups[code].length;a++){
                plot_elements_state.shapeGroups[code][a].visible = visible;
                plot_elements_state.shapeGroups[code][a].fillcolor = color;
            }
        };


        var appendStateDataToPlot = function (k,onoff) {

            let cAnnots = plot_elements_state.shapeGroups[k];
            let annot = null;
            let copyValues = {};
            if(cAnnots.length>0) {
                annot = cAnnots[0];
                copyValues = annot;
            } else {
                copyValues = defaultAnnotation();
            }
            let newAnnots = [];

            let dataState = plot_elements_state.elems[k];

            for(let i=0;i<onoff.length;i++){
                let num = parseInt(onoff[i][1]);
                onoff[i][0] = new Date(onoff[i][0]*1000);
                let opacity = dataState.opacityMap[num];
                if(opacity === undefined) opacity = 0.04 + (num * 0.12);

                let xMin = 0;
                let xMax = null;
                if (onoff[i][0] !== 0) xMin = onoff[i][0];
                if (onoff[i + 1] !== undefined && onoff[i + 1][0] !== 0) xMax = onoff[i + 1][0];
                else xMax = plot_elements_state.plot.layout.xaxis.range[1];

                let addAnnot = true;
                if(onoff[i + 1]===undefined && annot !== null){
                    if(annot.opacity===opacity){
                        addAnnot=false;
                        annot.x0 = xMin;
                    } else {
                        xMax=annot.x0;
                    }
                }
                let newannot = {
                    id: 'state_'+k+"_"+i,
                    type: 'rect',
                    xref: 'x',
                    yref: 'y'+plot_elements_state.axes.axisMap[dataState.yaxis],
                    x0: xMin,
                    y0: copyValues.y0,
                    x1: xMax,
                    y1: copyValues.y1,
                    fillcolor: copyValues.fillcolor,
                    opacity: opacity,
                    visible: dataState.visible,
                    line: {
                        width: 0
                    }
                };
                if(addAnnot)newAnnots.push(newannot);
            }
            for(let n=newAnnots.length-1;n>=0;n--){
                plot_elements_state.plot.shapes.push(newAnnots[n]);
                plot_elements_state.shapeGroups[k].unshift(newAnnots[n]);
            }
        };

        var getStateAnnotations = function (onOffData) {
            var xMin, xMax, annots = [];
            var yV = 0;
            for (let k in onOffData){
                if(onOffData.hasOwnProperty(k)){
                    let onoff = onOffData[k].values;
                    let dataState = plot_elements_state.elems[k];
                    let color = "#868686";
                    if (dataState.visible === true) {
                        if(plot_elements_state.datasetColors["868686"] === undefined || plot_elements_state.datasetColors["868686"] === false){
                            plot_elements_state.datasetColors["868686"] = true;
                            color = "#868686";
                        } else if (onoff.length > 0) {
                            color = helpers.findNewButtonColor();
                        }
                        dataState.color = color;
                        dataState.htmlelement.style.backgroundColor = color;
                    }
                    if(onoff.length>0){
                        onoff[0][0] = new Date(onoff[0][0]*1000);
                    }
                    for (var i = 0; i < onoff.length; i++) {
                        xMin = 0;
                        xMax = null;
                        let num = parseInt(onoff[i][1]);
                        if (onoff[i][0] !== 0) xMin = onoff[i][0];
                        let nextVal = onoff[i + 1];
                        if (nextVal !== undefined) {
                            nextVal[0] = new Date(nextVal[0]*1000);
                            xMax = nextVal[0];
                        }
                        else xMax = plot_elements_state.plot.layout.xaxis.range[1];
                        let opacity = dataState.opacityMap[num];
                        if(opacity === undefined) opacity = 0.04 + (num * 0.12);

                        let annot = {
                            id: 'state_'+k+"_"+i,
                            type: 'rect',
                            xref: 'x',
                            yref: 'y'+plot_elements_state.axes.axisMap[dataState.yaxis],
                            x0: xMin,
                            y0: yV,
                            x1: xMax,
                            y1: yV+2,
                            fillcolor: color,
                            opacity: opacity,
                            visible: dataState.visible,
                            line: {
                                width: 0
                            }
                        };
                        annots.push(annot);

                        if(plot_elements_state.shapeGroups[k]===undefined) plot_elements_state.shapeGroups[k] = [];
                        plot_elements_state.shapeGroups[k].push(annot);
                    }
                    if (dataState.visible === true)  yV += 2;
                }
            }
            return annots;
        };

        return {
            getStateAnnotations:getStateAnnotations,
            appendStateDataToPlot:appendStateDataToPlot,
            toggleStateAnnotations:toggleStateAnnotations
        }
    })();


    let pullPlotData = function(codes){

        return new Promise((resolve, reject) => {
            let composeRequestBody = function (codes) {
                let range = plot_elements_state.plot.layout.xaxis.range;

                let startDateTime = range[0];
                let endDateTime = range[1];

                let startTime = parseInt(startDateTime.getTime() / 1000);
                let endTime = parseInt(endDateTime.getTime() / 1000);

                let rParams = {'codes':{}};

                for (let c in codes) {
                    let cd = codes[c];
                    let state = plot_elements_state.elems[cd];
                    let start = startTime;
                    let end = endTime;
                    if (state.dataset !== undefined && state.dataset !== null && state.dataset.x.length>0) {
                        let first = state.dataset.x[0];
                        first = parseInt(first.getTime() / 1000);
                        end = first;

                    }
                    if(start >= end) continue;
                    if(state.group !== undefined){
                        if(state.query_group !== undefined && state.query_group === true){
                            rParams[state.group] = [start, end];
                        } else {
                            if(rParams[state.group] === undefined) rParams[state.group] = {};
                            rParams[state.group][cd] = [start, end];
                        }
                    } else {
                        rParams['codes'][cd] = [start, end];
                    }

                }
                return rParams;
            };
            let requestPlotData = function(requestData){
                return new Promise((resolve, reject) => {
                    helpers.ajax.send(
                        setup_instance.getQueryUrl(plotid,'time-data'),
                        'POST',
                        requestData,
                        function (responseData) {
                            resolve(responseData);
                        }
                    )
                });
            };

            let cutDataFromEnd = function(data,target){
                let len = data.length;
                let cutPoint = len-1;
                for(;cutPoint>=0;cutPoint-=10){
                    if(data[cutPoint][0]<target) break;
                }
                let limit = 10;
                if(cutPoint<=0){
                    limit = 10 + cutPoint;
                    cutPoint = 0;
                } else if(cutPoint === len-1){
                    return data;
                }
                for (let i=0;i<=limit;i++){
                    if(data[cutPoint][0]>=target) break;
                    cutPoint++;
                }
                data.splice(cutPoint);
            };

            let cutDataFromBeginning = function(data,target){
                var cutPoint = 0;
                for(;cutPoint<data.length;cutPoint+=10){
                    if(data[cutPoint][0]>target) break;
                }
                let limit = 10;
                if(cutPoint>=data.length-1){
                    limit = 10-(cutPoint-data.length);
                    cutPoint = data.length;
                } else if(cutPoint===0){
                    limit = 0;
                    if(data[cutPoint][0]>target) cutPoint = -1;
                }
                for (let i=0;i<limit;i++){
                    cutPoint--;
                    if(data[cutPoint][0]<=target) break;
                }
                data.splice(0,cutPoint+1);
            };

            let formatData = function(responseData){
                let  codesByType = [{},{}];
                for(let cat in responseData){
                    for(let code in responseData[cat]){
                        let values = [];
                        let formatters = [];
                        let state = plot_elements_state.elems[code];
                        let valObj = {
                            mode:'append',
                            structure: (state.datastructure === undefined?'row':state.datastructure),
                            values:[]
                        };

                        if(Array.isArray(responseData[cat][code])){
                            valObj.values = responseData[cat][code];
                        } else {
                            valObj.values = responseData[cat][code].values;
                            if(responseData[cat][code].format !== undefined)formatters = responseData[cat][code].format;
                        }
                        if(state.yaxis === "y_state" || state.isState === true){
                            formatters.unshift("REMOVE_REPEATING_ROW");
                        }
                        for (let f = 0; f<formatters.length;f++){
                            let fstr = formatters[f];
                            if(helpers.dataFormatters[fstr] !== undefined && typeof helpers.dataFormatters[fstr] === "function"){
                                helpers.dataFormatters[fstr](valObj);
                            }
                        }

                        if(valObj.structure === 'row'){
                            if(valObj.values.length > 0){
                                let firstValue = valObj.values[0];
                                let newFrom = firstValue[0];
                                if(newFrom !== parseInt(newFrom)){
                                    console.warn(code+': Time format after data formatters is not correct. Expected unix timestamp format');
                                    continue;
                                }
                                if(state.dataset !== undefined){
                                    let newTo = valObj.values[valObj.values.length-1][0];
                                    let currentData = state.dataset.x;
                                    let len = currentData.length;
                                    if(len > 0){
                                        let existingFrom = currentData[0];
                                        let existingTo   = currentData[len-1];
                                        if(existingFrom>newFrom){
                                            valObj.mode = "prepend";
                                            if(newTo > existingFrom){
                                                cutDataFromEnd(valObj.values,existingFrom)
                                            }
                                        } else {
                                            if(newFrom < existingTo){
                                                cutDataFromBeginning(valObj.values,existingTo)
                                            }
                                        }
                                    }

                                }
                            }
                        }

                        if(state.yaxis === "y_state" || state.isState === true){
                            codesByType[1][code] = valObj;
                        } else {
                            codesByType[0][code] = valObj;
                        }
                    }
                }

                return codesByType;
            };


            let requestBody = composeRequestBody(codes);

            let data = {};
            if(overWriteFunctions.queryData !== null){
                data = Promise.resolve(overWriteFunctions.queryData(requestBody));
            } else {
                data = requestPlotData();
            }
            data.then(function (values) {
                let formatted = formatData(values);
                resolve(formatted);

            });
        });

    };


    var processChartDataTrace = function (responseData,plotState,mode) {
        let edata = [[],[]];
        let vals = responseData.values;
        let firstValue = [0,0];
        if(plotState.normalize !== undefined && plotState.normalize !== false){

        } else {
            for (let r=0;r<vals[0].length;r++){
                edata[0].push(new Date(parseInt(vals[0][r])*1000));
            }
            edata[1] = vals[1];
        }
        return [edata[0],edata[1]];
    };

    var processChartDataRow = function (responseData,plotState,mode) {
        let edata = [[],[]];
        let vals = responseData.values;
        let missingValueAnnotation= [];
        if(plotState.normalize !== undefined && plotState.normalize !== false){
            let normTreshold = 600;
            let normTresholdMax = normTreshold*2;
            if(plotState.normalize !== true) normTreshold = plotState.normalize;
            let dt = 0;
            let prev = 0;
            let firstValue = null;
            let d=1;
            if(vals.length>0){
                dt = firstValue[0];
                prev = firstValue[1];
                if(mode === "prepend"){
                    firstValue = vals[0];
                }
            }
            if(mode === "append"){
                if(plotState.dataset!==undefined && plotState.dataset.x.length>0){
                    dt =  plotState.dataset.x[ plotState.dataset.x.length-1];
                    prev = plotState.dataset.y[ plotState.dataset.y.length-1];
                }
                d=0;
            }
            for (;d<vals.length;d++){
                let curdt = parseInt(vals[d][0]);
                let timediff = curdt-dt;
                if(timediff<normTreshold){
                    continue;
                }
                if(timediff <= normTresholdMax){
                    edata[0].push(new Date(curdt*1000));
                    let diff = vals[d][1]-prev;
                    edata[1].push(diff);
                } else {
                    missingValueAnnotation.push([dt,curdt]);
                }
                prev = vals[d][1];
                dt = curdt;
            }
            if(mode === "prepend") {
                if (plotState.dataset !== undefined && plotState.firstvalue !== undefined) {
                    let fv = plotState.firstvalue;
                    let timediff = fv[0] - dt;
                    if (timediff <= normTresholdMax && timediff >= normTreshold) {
                        edata[0].push(new Date(fv[0] * 1000));
                        edata[1].push(fv[1] - prev);
                    }
                }
                if (firstValue !== null) plotState.firstvalue = firstValue;
            }
        } else {
            if(plotState.groupnorm !== null){
                if(vals.length>0){
                    let valLen = vals.length;
                    let len = plotState.legend.length;
                    edata[1] = new Array(len);
                    for(let i=0;i<len;i++){
                        edata[1][i] = new Array(valLen);
                    }
                    for (let r=0;r<valLen;r++){
                        edata[0].push(new Date(parseInt(vals[r][0])*1000));
                        for(let i=0;i<len;i++){
                            edata[1][i][r] = vals[r][i+1];
                            edata[1][i][r] = parseFloat(edata[1][i][r]);
                        }
                    }
                }
            } else {
                for (let d = 0; d < vals.length; d++) {
                    edata[0].push(new Date(parseInt(vals[d][0]) * 1000));
                    edata[1].push(vals[d][1]);
                    vals[d][1] = parseFloat(vals[d][1]);
                }
            }

        }
        return [edata[0],edata[1]];
    };


    var processChartData = function (responseData,plotState,mode) {
        if(responseData.structure !== undefined && responseData.structure === "trace"){
            return processChartDataTrace(responseData,plotState,mode);
        } else {
            return processChartDataRow(responseData,plotState,mode);
        }
    };

    var toggleDatasetVisibility = function(visible,code,color){
        let dataState = plot_elements_state.elems[code];
        if(color !== undefined){
            dataState.dataset.line.color = color;
            dataState.dataset.marker.color = color;
        }
        Plotly.restyle(plot_elements_state.plot,'visible',visible,dataState.index);
    };


    var setActiveAxes = function () {
        let layout = plot_elements_state.plot.layout;
        // annotations from axisTitles;
        let annots = layout.annotations;
        let annotsByid = {};
        for(let i in annots){
            annotsByid[annots[i].axis] = annots[i];
        }
        var showLogic = [];
        for (let i in plot_elements_state.axes.axisActiveCount) {
            if (plot_elements_state.axes.axisActiveCount[i] > 0) {
                showLogic.push(i);
            }
            else {
                let ax = "yaxis"+plot_elements_state.axes.axisMap[i];
                layout[ax].showline = false;
                layout[ax].showgrid = false;
                layout[ax].showticklabels = false;
                layout[ax].side = "right";
                layout[ax].anchor = "x";
                layout[ax].position = 0;
                layout[ax].title.font.color = "rgba(0,0,0,0)";
                annotsByid[ax].font.color = "rgba(0,0,0,0)";
            }
        }
        for (let i = 0; i < showLogic.length; i++) {
            var key = showLogic[i];
            let ax = "yaxis"+plot_elements_state.axes.axisMap[key];
            layout[ax].title.font.color = "#868686";

            annotsByid[ax].font.color = "#868686";
            if (i === 0) {
                layout[ax].side = "left";
                layout[ax].showline = true;
                layout[ax].showgrid = true;
                layout[ax].showticklabels = true;
                annotsByid[ax].x=0;
                annotsByid[ax].xref="paper";
                annotsByid[ax].xanchor="right";
            }
            else {
                layout[ax].showline = true;
                layout[ax].showgrid = true;
                layout[ax].showticklabels = true;
                layout[ax].side = "right";
                if(layout.xaxis.range!==undefined)annotsByid[ax].x=layout.xaxis.range[1];
                else annotsByid[ax].x = (new Date()).getTime();
                annotsByid[ax].xanchor="left";
                let xpos = 0.87 + (i*0.03);
                if(i>1){

                    layout[ax].anchor = "free";
                    layout[ax].position = xpos;
                }
                else layout[ax].anchor = "x";
                annotsByid[ax].xref="paper";
                annotsByid[ax].x=xpos;
            }
        }
    };


    var addNewDatasets = function (codes) {
        return new Promise((resolve, reject) => {
            if(codes.length === 0) resolve();
            pullPlotData(codes).then(function (pres) {
                let layout = plot_elements_state.plot.layout;
                let storeData = pres[0];
                let states     = pres[1];
                var datasets = [];

                for(let key in storeData){
                    if(plot_elements_state.elems[key] !== undefined && plot_elements_state.elems[key].dataset !== undefined) continue;
                    let plotState = plot_elements_state.elems[key];
                    var color = plotState.fixedcolor;
                    var yA = plotState.yaxis;
                    let plottype = plotState.plot_type;
                    let edata = processChartData(storeData[key],plotState,storeData[key].mode);
                    if (yA === undefined || yA === null) yA = "y_temp";
                    let desc = plotState.desc;

                    if (plotState.visible === true) {
                        if (color === null || color === "" || color === undefined) {
                            color = helpers.findNewButtonColor();
                        }
                        plot_elements_state.axes.axisActiveCount[yA]++;
                        plotState.color = color;
                    }
                    let btn = plotState.htmlelement;

                    if(plotState.groupnorm !== null){
                        let legend = plotState.legend;
                        let colors = [];
                        if(legend !== undefined){
                            for(let d=0;d<legend.length;d++){
                                colors.push(legend[d][2]);
                            }
                        }
                        if(colors.length>0){
                            let cols = colors.join(",");
                            colors = "linear-gradient(-45deg, "+cols+")";
                        } else {
                            colors = "#868686";
                        }
                        btn.setAttribute("bck-col",colors);

                        plotState.dataset = new Array(legend.length);
                        for (let i=0;i<legend.length;i++){
                            var dataset = {
                                id: key+"_"+i,
                                visible: plotState.visible,
                                name: legend[i][0],
                                x: edata[0],
                                y: edata[1][i],
                                yaxis: "y"+plot_elements_state.axes.axisMap[yA],
                                marker: {
                                    color: legend[i][1],
                                    size: 2
                                },
                                line: {
                                    color: legend[i][1],
                                    width: 1
                                },
                                fillcolor: legend[i][1],
                                mode: 'lines',
                                type: plottype,
                                stackgroup: key,
                                xcalendar: "gregorian",
                                ycalendar: "gregorian",
                                plfirstvalue: edata[2],
                            };
                            dataset.groupnorm = plotState.groupnorm;
                            datasets.push(dataset);
                            plotState.dataset[i] = dataset;
                        }
                    } else {
                        btn.style.backgroundColor = color;
                        var dataset = {
                            id: key,
                            visible: plotState.visible,
                            name: desc,
                            x: edata[0],
                            y: edata[1],
                            yaxis: "y"+plot_elements_state.axes.axisMap[yA],
                            marker: {
                                color: color,
                                size: 2
                            },
                            line: {
                                color: color,
                                width: 1
                            },
                            mode: 'lines',
                            type: plottype,
                            xcalendar: "gregorian",
                            ycalendar: "gregorian",
                            plfirstvalue: edata[2]
                        };
                        let binSize = 3600000;
                        if(plottype==="histogram"){
                            dataset.autobiny = true;
                            dataset.histfunc = "sum";
                            dataset.marker.line = {
                                color:dataset.marker.color,
                                width:1
                            };
                            dataset.marker.opacity = setup_instance.setupValues.defaultHistogramSetup.opacity;
                            dataset.xbins = {size:binSize};
                            sharedBinningDataset[key] = dataset;
                            if(layout.updatemenus === undefined) layout.updatemenus = updateMenus;
                        }
                        datasets.push(dataset);
                        plotState.dataset = dataset;
                    }

                }

                let shapes = plotAnnotations.getStateAnnotations(states);
                plot_elements_state.plot.layout.shapes = plot_elements_state.plot.layout.shapes.concat(shapes);
                setActiveAxes();
                let index = plot_elements_state.plot.data.length;
                Plotly.addTraces(plot_elements_state.plot,datasets);
                for(;index<plot_elements_state.plot.data.length;index++){
                    let id = plot_elements_state.plot.data[index].id;
                    if(plot_elements_state.plot.data[index].stackgroup !== undefined) id = plot_elements_state.plot.data[index].stackgroup;
                    if(plot_elements_state.elems[id].index === undefined) plot_elements_state.elems[id].index = [];
                    plot_elements_state.elems[id].index.push(index);
                }

                resolve();
            });
        });
    };

    var appendDataToPlot = function(codes){
        return new Promise((resolve, reject) => {
            if(codes.length === 0) resolve();
            pullPlotData(codes).then(function (pres) {
                let storeData = pres[0];
                let states     = pres[1];
                let joinTraces = {
                    append:[[],[],[]],
                    prepend:[[],[],[]],
                };
                for(let key in storeData){
                    let plotState = plot_elements_state.elems[key];
                    let edata = processChartData(storeData[key],plotState,storeData[key].mode);
                    if(plotState.groupnorm === null) {
                        if (storeData[key].mode === "append") {
                            joinTraces.append[0].push(edata[0]);
                            joinTraces.append[1].push(edata[1]);
                            joinTraces.append[2].push(plotState.index[0]);
                        } else {
                            joinTraces.prepend[0].push(edata[0]);
                            joinTraces.prepend[1].push(edata[1]);
                            joinTraces.prepend[2].push(plotState.index[0]);
                        }
                    }
                }
                if(joinTraces.append[0].length>0){
                    Plotly.extendTraces(plot_elements_state.plot,{y: joinTraces.append[1],x:joinTraces.append[0]},joinTraces.append[2])
                }
                if(joinTraces.prepend[0].length>0){
                    Plotly.prependTraces(plot_elements_state.plot,{y: joinTraces.prepend[1],x:joinTraces.prepend[0]},joinTraces.prepend[2])
                }
            });
        });
    };


    async function registerButton(elements){
        let activeButtons = [];
        let axes = {};
        let missingButtons = {};
        for(let e = 0;e<elements.length;e++){
            let code = elements[e].getAttribute("pl-code");
            let active = elements[e].classList.contains("active");
            if(plot_elements_state.elems[code] === undefined){
                plot_elements_state.pendingSetup.push(code);
                missingButtons[code] = elements[e];
            } else {
                plot_elements_state.elems[code].htmlelement = elements[e];
            }
            if(active){
                activeButtons.push(code);
            }
            let axis = elements[e].getAttribute("y-axis");
            if(axis !== null){
                axes[code] = axis;
            }
            interactions.registerButtonClick(elements[e]);
        }
        if(plot_elements_state.pendingSetup.length>0){
            await setup_instance.fetchSetupByCode(plot_elements_state.pendingSetup,plotid);
            for(let p=0;p<plot_elements_state.pendingSetup.length;p++){
                let code = plot_elements_state.pendingSetup[p];
                plot_elements_state.elems[code] = await setup_instance.getCodeSetup(code,plotid);
                plot_elements_state.elems[code].htmlelement = missingButtons[code];
            }
        }
        activeButtons.forEach( code => plot_elements_state.elems[code].visible = true);
        for(let code in axes){
            plot_elements_state.elems[code].yaxis = axes[code];
        }
        plot_elements_state.pendingSetup = [];
        return addNewDatasets(activeButtons);
    }

    var interactions = (function () {
        let doPlotButtonClick = function () {
            let code = this.getAttribute("pl-code");
            let plotState = plot_elements_state.elems[code];
            if(plotState.visible){
                if(plotState.yaxis === "y_state" || plotState.isState === true){
                    plotAnnotations.toggleStateAnnotations(false,code);
                }  else {
                    toggleDatasetVisibility(false,code);

                }
                helpers.releaseButtonColor(plotState.color);
                plotState.htmlelement.style.backgroundColor = "transparent";
                plotState.htmlelement.classList.remove("active");
                plotState.visible = false;
            } else {
                plotState.htmlelement.classList.add("active");
                plotState.visible = true;
                let color = plotState.fixedColor;
                if(color === undefined || color === null){
                    color = helpers.findNewButtonColor(plotState.color);
                }
                plotState.htmlelement.style.backgroundColor = color;
                plotState.color = color;
                if(plotState.yaxis === "y_state" || plotState.isState === true){

                    plotAnnotations.toggleStateAnnotations(true,code,color);
                } else {
                    toggleDatasetVisibility(true,code,color);
                }
                helpers.queue.addToQueue(appendDataToPlot,[[code]]);
            }
            Plotly.redraw(plot_elements_state.plot);
        };

        let registerButtonClick = function (elem) {
            elem.addEventListener("click",function () {
                doPlotButtonClick.call(this);
            });
        };

        return {
            registerButtonClick:registerButtonClick
        }
    })();

    let registerButtons = function(elements){
        helpers.queue.addToQueue(registerButton,[elements]);
    };

    let runFunctions = {
        createPlot: createPlot,
        registerButton: registerButton,
        fetchGlobalSetup:setup_instance.fetchGlobalSetup,
    };
    return {
        overWriteFunctions:overWriteFunctions,
        registerButtons:registerButtons,
        ajax:helpers.ajax,
        executeFunc: function (fname,params) {
            if(runFunctions[fname] !== undefined){
                helpers.queue.addToQueue(runFunctions[fname],params);
            }
        }
    };

};


var plotlyBuilder = (function () {
    var plotinstance = {};
    var setup;

    function createInstance(setup,plotid,elems) {
        let object = plotly_handler(setup,plotid);
        object.executeFunc("fetchGlobalSetup",[]);
        object.executeFunc("createPlot",[elems]);
        return object;
    }

    let parseplot = function (plot) {
        let ptype = typeof plot;
        let plotid = "plot";
        let elems = null;
        if(ptype === "string"){
            plotid = plot;
        } else if(Array.isArray(plot)){
            let id = plot[0].id;
            if(id !== null) plotid = id;
            else {
                plotid = plot[0].parentElement.id;
            }
            elems = plot;
        }
        return [plotid,elems];
    };

    return {
        getInstance: function (plot,action,params) {
            let [plotid,elems] = parseplot(plot);
            if (!setup) {
                setup = plSetupHolder();
                setup.setRequestURL(null,action,params);
            }
            if(plotinstance[plotid] === undefined)plotinstance[plotid] = createInstance(plotid,setup,elems);
            return plotinstance[plotid];
        },
        getSetup: function (action,params) {
            if (!setup) {
                setup = plSetupHolder();
                setup.setRequestURL(null,action,params);
            }
            return setup;
        },
    };
})();