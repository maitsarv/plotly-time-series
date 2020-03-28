var plotly_handler = function (plotid,setup_instance) {


    let helpers = (function(){
        let actionPromiseQueue = (function(){

            let currentQueue = [];
            let currentRun = false;

            let addToQueue = function (functionName,params,thenFunc) {
                currentQueue.push([functionName,params,thenFunc]);
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
                            if(next[2] !== undefined && typeof next[2] === "function"){
                                next[2]();
                            }
                            checkQueue();
                        });
                    } else {
                        if(next[2] !== undefined && typeof next[2] === "function"){
                            next[2]();
                        }
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
            if(preferred !== undefined && preferred !== null){
                preferred = preferred.replace("#","");
                if(plot_elements_state.datasetColors[preferred] !== true){
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

        let getRangeAsDate = function (range) {
            let startDateTime = range[0];
            let endDateTime = range[1];
            if(typeof startDateTime === "string"){
                startDateTime = new Date(startDateTime);
            }
            if(typeof endDateTime === "string"){
                endDateTime = new Date(endDateTime);
            }
            return [startDateTime,endDateTime];
        };

        let setButtonStateByColor = function (datasetState,color,code) {
            if(color !== null){
                datasetState.visible = true;
                datasetState.color = color;
                plot_elements_state.activeCodes[code] = true;
                if(datasetState.htmlelement !== undefined){
                    DOMupdates.updateButtonState(datasetState.htmlelement,true,color);
                } else {
                    DOMupdates.buttonStateUpdateCallback(code,true,color);
                }

            } else {
                datasetState.visible = false;
                delete plot_elements_state.activeCodes[code];
                if(datasetState.htmlelement !== undefined){
                    DOMupdates.updateButtonState(datasetState.htmlelement,false,"transparent");
                } else {
                    DOMupdates.buttonStateUpdateCallback(code,false,"transparent");
                }

            }
        };

        let DOMupdates = {
            updateButtonState: function(button,active,color){
                button.style.backgroundColor = color;
                if(active){
                    button.classList.add("active");
                } else {
                    button.classList.remove("active");
                }
            },
            buttonStateUpdateCallback: function (code,active,color) {

            }
        };

        return {
            queue:actionPromiseQueue,
            dataFormatters:dataFormatters,
            ajax:ajax,
            findNewButtonColor:findNewButtonColor,
            releaseButtonColor:releaseButtonColor,
            getRangeAsDate:getRangeAsDate,
            setButtonStateByColor:setButtonStateByColor,
            DOMupdates:DOMupdates
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
        timeformat: 'unix',
        activeCodes: {},
        modebar:{}
    };

    let createPlot = function(containers){

        let createPlotElems = function(con){
            let plotcont = document.createElement("div");
            let legend = document.createElement("div");
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

        return new Promise(resolve => {
            let plotElems = containers;
            if(plotElems === null){
                let plotCont = document.getElementById(plotid);
                plotElems = createPlotElems(plotCont);
            }
            let initialLayout = setup_instance.getInitialPlotLayout();
            populateUnitAxesMapping(initialLayout[4]);
            plot_elements_state.axes.axisActiveCount = initialLayout[1];
            plot_elements_state.axes.axisTitles = initialLayout[2];
            plot_elements_state.axes.axisMap = initialLayout[3];
            initialLayout[0].annotations = initialLayout[2];
            initialLayout[0].shapes = [];

            Plotly.newPlot(plotElems[0], [], initialLayout[0],{doubleClick:'reset'}).then(function (p) {
                plot_elements_state.plot = p;
                interactions.registerPlotRelayoutCallback();
                plot_elements_state.modebar = p.querySelector(".modebar-container");
                resolve();
            });

            for(let c in setup_instance.values.defaultChartColors){
                plot_elements_state.datasetColors[c] = setup_instance.values.defaultChartColors[c];
            }
        });
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
                x1: setup_instance.values.current_time,
                y1: 2,
                fillcolor: "#888888",
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
            if(visible === true){
                let yV = 0;
                let usedYV = {};
                let groups = plot_elements_state.shapeGroups;
                for(let g in groups){
                    if(groups[g].length > 0 && groups[g][0].visible === true){
                        usedYV[groups[g][0].y0] = true;
                    }
                }
                while (usedYV[yV] === true){
                    yV+=2;
                }
                let yV2 = yV+2;
                for(let a = 0;a<plot_elements_state.shapeGroups[code].length;a++){
                    plot_elements_state.shapeGroups[code][a].visible = visible;
                    plot_elements_state.shapeGroups[code][a].fillcolor = color;
                    plot_elements_state.shapeGroups[code][a].y0 = yV;
                    plot_elements_state.shapeGroups[code][a].y1 = yV2;
                }
            } else {
                for(let a = 0;a<plot_elements_state.shapeGroups[code].length;a++){
                    plot_elements_state.shapeGroups[code][a].visible = visible;
                    plot_elements_state.shapeGroups[code][a].fillcolor = color;
                }
            }

        };


        var appendStateDataToPlot = function (k,onoff,mode) {

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

            let datasetState = plot_elements_state.elems[k];
            if(onoff.length>0){
                onoff[0][0] = new Date(onoff[0][0]*1000);
            }
            for(let i=0;i<onoff.length;i++){
                let num = parseInt(onoff[i][1]);
                let opacity = datasetState.opacityMap[num];
                if(opacity === undefined) opacity = 0.04 + (num * 0.12);

                let xMin = 0;
                let xMax = null;
                if (onoff[i][0] !== 0) xMin = onoff[i][0];
                if (onoff[i + 1] !== undefined && onoff[i + 1][0] !== 0) {
                    onoff[i + 1][0] = new Date(onoff[i+1][0]*1000);
                    xMax = onoff[i + 1][0];
                }
                else xMax = plot_elements_state.plot.layout.xaxis.range[1];

                let addAnnot = true;
                if(mode === "prepend" && onoff[i + 1]===undefined && annot !== null){
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
                    yref: 'y'+plot_elements_state.axes.axisMap[datasetState.yaxis],
                    x0: xMin,
                    y0: copyValues.y0,
                    x1: xMax,
                    y1: copyValues.y1,
                    fillcolor: copyValues.fillcolor,
                    opacity: opacity,
                    visible: datasetState.visible,
                    line: {
                        width: 0
                    }
                };
                if(addAnnot)newAnnots.push(newannot);
            }
            if(mode === "prepend"){
                for(let n=newAnnots.length-1;n>=0;n--){
                    plot_elements_state.plot.layout.shapes.push(newAnnots[n]);
                    plot_elements_state.shapeGroups[k].unshift(newAnnots[n]);
                }
            }
            if(mode === "append"){
                for(let n=0;n<newAnnots.length;n++){
                    plot_elements_state.plot.layout.shapes.push(newAnnots[n]);
                    plot_elements_state.shapeGroups[k].unshift(newAnnots[n]);
                }
            }
        };

        var getStateAnnotations = function (onOffData) {
            var xMin, xMax, annots = [];

            let usedYV = {};
            let groups = plot_elements_state.shapeGroups;
            for(let g in groups){
                if(groups[g].length > 0 && groups[g][0].visible === true){
                    usedYV[groups[g][0].y0] = true;
                }
            }

            var yV = 0;
            while (usedYV[yV] === true){
                yV+=2;
            }
            for (let k in onOffData){
                if(onOffData.hasOwnProperty(k)){
                    let onoff = onOffData[k].values;
                    let datasetState = plot_elements_state.elems[k];
                    datasetState.index = null;
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
                        let opacity = datasetState.opacityMap[num];
                        if(opacity === undefined) opacity = 0.04 + (num * 0.12);

                        let annot = {
                            id: 'state_'+k+"_"+i,
                            type: 'rect',
                            xref: 'x',
                            yref: 'y'+plot_elements_state.axes.axisMap[datasetState.yaxis],
                            x0: xMin,
                            y0: yV,
                            x1: xMax,
                            y1: yV+2,
                            fillcolor: datasetState.color,
                            opacity: opacity,
                            visible: datasetState.visible,
                            line: {
                                width: 0
                            }
                        };
                        annots.push(annot);

                        if(plot_elements_state.shapeGroups[k]===undefined) plot_elements_state.shapeGroups[k] = [];
                        plot_elements_state.shapeGroups[k].push(annot);
                    }
                    if (datasetState.visible === true)  {
                        yV += 2;
                        while (usedYV[yV] === true){
                            yV+=2;
                        }
                    }
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

                let [startDateTime,endDateTime] = helpers.getRangeAsDate(plot_elements_state.plot.layout.xaxis.range);
                console.log(startDateTime,endDateTime,setup_instance.values.defaultXRange);
                if(startDateTime > setup_instance.values.defaultXRange[0]) startDateTime = new Date(setup_instance.values.defaultXRange[0].valueOf());
                if(endDateTime < setup_instance.values.defaultXRange[1]) endDateTime =  new Date(setup_instance.values.defaultXRange[1].valueOf());
                let startTime = parseInt(startDateTime.getTime() / 1000);
                let endTime = parseInt(endDateTime.getTime() / 1000);

                let rParams = {'codes':{}};
                for (let c in codes) {
                    let cd = codes[c];
                    let state = plot_elements_state.elems[cd];
                    let start = startTime;
                    let end = endTime;

                    if (state.index !== undefined && state.index !== null && state.index.length>0) {
                        let dataset = plot_elements_state.plot.data[state.index[0]];
                        let first = dataset.x[0];
                        first = parseInt(first.getTime() / 1000);
                        end = first;
                    } else if(plot_elements_state.shapeGroups[cd] !== undefined && plot_elements_state.shapeGroups[cd].length>0){
                        let elem = plot_elements_state.shapeGroups[cd][0];
                        end = parseInt(elem.x0 / 1000);
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
                                let newTo = valObj.values[valObj.values.length-1][0];
                                if(state.index !== undefined && state.index !== null){
                                    let dataset = plot_elements_state.plot.data[state.index[0]];
                                    let currentData = dataset.x;
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
                                } else if(plot_elements_state.shapeGroups[code] !== undefined){
                                    let len = plot_elements_state.shapeGroups[code].length;
                                    if(len > 0){
                                        let existingFrom = plot_elements_state.shapeGroups[code][0].x0;
                                        let existingTo   = plot_elements_state.shapeGroups[code][len-1].x1;
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


    var processChartDataTrace = function (responseData,datasetState,mode) {
        let edata = [[],[]];
        let vals = responseData.values;
        if(vals.length === 0) return edata;
        let len = vals[0].length;
        if(len === 0) return edata;
        if(datasetState.linkedValues.extremes === undefined) {
            datasetState.linkedValues.extremes = {min:[], max:[], absMin: {x:null,y:null}, absMax: {x:null,y:null}};
        }
        if(datasetState.normalize !== undefined && datasetState.normalize !== false){

        } else {
            for (let r=0;r<len;r++){
                edata[0].push(new Date(parseInt(vals[0][r])*1000));
            }
            edata[1] = vals[1];
        }
        return [edata[0],edata[1]];
    };

    var processChartDataRow = function (responseData,datasetState,mode) {
        let edata = [[],[]];
        let vals = responseData.values;
        let missingValueAnnotation= [];
        if(vals.length === 0) return edata;
        if(datasetState.linkedValues.extremes === undefined) {
            datasetState.linkedValues.extremes = {min:[], max:[], absMin: {x:null,y:null}, absMax: {x:null,y:null}};
        }
        let newExtremes = [];
        if(datasetState.normalize !== undefined && datasetState.normalize !== false){
            let extremeVal = [null,null,null];
            let normTreshold = 600;
            let normTresholdMax = normTreshold*2;
            if(datasetState.normalize !== true) normTreshold = datasetState.normalize;
            let dt = 0;
            let prev = 0;
            let firstValue = datasetState.linkedValues.firstValue;
            let d=1;

            if(mode === "prepend"){
                datasetState.linkedValues.firstValue = vals[0];
                if(datasetState.linkedValues.lastValue === undefined) datasetState.linkedValues.lastValue = vals[vals.length-1];
                dt = vals[0];
                prev = vals[1];
            }

            if(mode === "append"){
                let lv = vals[vals.length-1];
                dt =  datasetState.linkedValues.lastValue[0];
                prev = datasetState.linkedValues.lastValue[1];
                datasetState.linkedValues.lastValue = lv;
                if(datasetState.linkedValues.firstValue) datasetState.linkedValues.firstValue = vals[0];
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
                if (datasetState.index !== undefined && firstValue !== undefined) {
                    let timediff = firstValue[0] - dt;
                    if (timediff <= normTresholdMax && timediff >= normTreshold) {
                        edata[0].push(new Date(firstValue[0] * 1000));
                        edata[1].push(firstValue[1] - prev);
                    }
                }
            }
        } else {
            if(datasetState.groupnorm !== null){
                if(vals.length>0){
                    let valLen = vals.length;
                    let len = datasetState.legend.length;
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
                let extremeVal = [{min:vals[0][0],max:vals[0][0]},{min:vals[0][1],max:vals[0][1]},0];
                for (let d = 0; d < vals.length; d++) {
                    vals[d][1] = parseFloat(vals[d][1]);
                    if(extremeVal[2]>=400){
                        newExtremes.push(extremeVal);
                        extremeVal = [{min:vals[d][0],max:vals[d][0]},{min:vals[d][1],max:vals[d][1]},0];
                    }
                    if(vals[d][1] < extremeVal[1].min) {
                        extremeVal[1].min = vals[d][1];
                        extremeVal[0].min = vals[d][0];
                    } else {
                        if(vals[d][1] > extremeVal[1].max) {
                            extremeVal[1].max = vals[d][1];
                            extremeVal[0].max = vals[d][0];
                        }
                    }
                    edata[0].push(new Date(parseInt(vals[d][0]) * 1000));
                    edata[1].push(vals[d][1]);
                    extremeVal[2]++;
                }
                newExtremes.push(extremeVal);
            }
        }
        setExtremes(datasetState,newExtremes,mode);

        return [edata[0],edata[1]];
    };

    var setExtremes = function (datasetState,newExtremes,mode) {
        let formatnewExtremes = function (newExt) {
            let res = {min:Array(newExt.length),max:Array(newExt.length)};
            if(datasetState.linkedValues.extremes.absMin.y===null && newExt.length>0){
                datasetState.linkedValues.extremes.absMin = {x:newExt[0][0].min,y:newExt[0][1].min};
                datasetState.linkedValues.extremes.absMax = {x:newExt[0][0].max,y:newExt[0][1].max}
            }
            for(let e=0;e<newExt.length;e++){
                const ext = newExt[e];
                res.min[e] =  {x:ext[0].min,y:ext[1].min,ct:ext[2]};
                res.max[e] = {x:ext[0].max,y:ext[1].max,ct:ext[2]};
                if(datasetState.linkedValues.extremes.absMin.y > ext[1].min) datasetState.linkedValues.extremes.absMin = {x:ext[0].min,y:ext[1].min};
                if(datasetState.linkedValues.extremes.absMax.y < ext[1].max) datasetState.linkedValues.extremes.absMax = {x:ext[0].max,y:ext[1].max};
            }
            return res;
        };
        newExtremes = formatnewExtremes(newExtremes);
        let elen = datasetState.linkedValues.extremes.min.length;
        if(elen === 0){
            datasetState.linkedValues.extremes.min = newExtremes.min;
            datasetState.linkedValues.extremes.max = newExtremes.max;
        } else {
            if(mode === "prepend"){
                let newMinLast = newExtremes.min[newExtremes.min.length-1];
                let firstMin = datasetState.linkedValues.extremes.min[0];
                let newMaxLast = newExtremes.max[newExtremes.max.length-1];
                let firstMax = datasetState.linkedValues.extremes.max[0];
                let ct = newMinLast.ct+firstMin.ct;
                if(ct<400){
                    let newMin = {};
                    let newMax = {};
                    if(newMinLast.y<firstMin.y) newMin = {x:newMinLast.x,y:newMinLast.y,ct:ct};
                    else newMin = {x:firstMin.x,y:firstMin.y,ct:ct};
                    if(newMaxLast.y>firstMax.y) newMax = {x:newMaxLast.x,y:newMaxLast.y,ct:ct};
                    else newMax = {x:firstMax.x,y:firstMax.y,ct:ct};
                    datasetState.linkedValues.extremes.min.unshift(newMin);
                    datasetState.linkedValues.extremes.max.unshift(newMax);
                    for (let n = newExtremes.min.length-2;n>=0;n--){
                        datasetState.linkedValues.extremes.min.unshift(newExtremes.min[n]);
                        datasetState.linkedValues.extremes.min.unshift(newExtremes.max[n]);
                    }
                } else {
                    datasetState.linkedValues.extremes.min.unshift(...newExtremes.min);
                    datasetState.linkedValues.extremes.max.unshift(...newExtremes.max);
                }
            } else {
                let newMinFirst = newExtremes.min[0];
                let lastMin = datasetState.linkedValues.extremes.min[elen-1];
                let newMaxFirst = newExtremes.max[0];
                let lastMax = datasetState.linkedValues.extremes.max[elen-1];
                let ct = newMinFirst.ct+lastMin.ct;
                if(ct<400){
                    let newMin = {};
                    let newMax = {};
                    if(newMinFirst.y<lastMin.y) newMin = {x:newMinFirst.x,y:newMinFirst.y,ct:ct};
                    else newMin = {x:lastMin.x,y:lastMin.y,ct:ct};
                    if(newMaxFirst.y>lastMax.y) newMax = {x:newMaxFirst.x,y:newMaxFirst.y,ct:ct};
                    else newMax = {x:lastMax.x,y:lastMax.y,ct:ct};
                    datasetState.linkedValues.extremes.min.push(newMin);
                    datasetState.linkedValues.extremes.max.push(newMax);
                    for (let n = 1;n<newExtremes.min.length;n--){
                        datasetState.linkedValues.extremes.min.push(newExtremes.min[n]);
                        datasetState.linkedValues.extremes.min.push(newExtremes[n].max[n]);
                    }
                } else {
                    datasetState.linkedValues.extremes.min.push(...newExtremes.min);
                    datasetState.linkedValues.extremes.max.push(...newExtremes.max);
                }
            }
        }
    };


    var processChartData = function (responseData,datasetState,mode) {
        if(datasetState.linkedValues === undefined) datasetState.linkedValues = {};
        if(responseData.structure !== undefined && responseData.structure === "trace"){
            return processChartDataTrace(responseData,datasetState,mode);
        } else {
            return processChartDataRow(responseData,datasetState,mode);
        }
    };

    var toggleDatasetVisibility = function(visible,code,color){
        let datasetState = plot_elements_state.elems[code];
        let updates = {};
        if(datasetState.index!==undefined){
            if(color !== undefined){
                let dataset = plot_elements_state.plot.data[datasetState.index[0]];
                updates.line = dataset.line;
                updates.line.color = color;
                updates.marker = dataset.marker;
                updates.marker.color = color;
            }
            updates.visible=visible;
        }
        return updates;
    };


    var setActiveAxes = function (directUpdate) {
        let layout = plot_elements_state.plot.layout;
        let layoutUpdate = {};
        if(directUpdate) layoutUpdate = layout;
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
                if(layout[ax].showline !== false){
                    layoutUpdate[ax] = layout[ax];
                    layoutUpdate[ax].showline = false;
                    layoutUpdate[ax].zeroline = false;
                    layoutUpdate[ax].showgrid = false;
                    layoutUpdate[ax].showticklabels = false;
                    layoutUpdate[ax].side = "right";
                    layoutUpdate[ax].anchor = "x";
                    layoutUpdate[ax].position = 0;
                    layoutUpdate[ax].title = {font:{color:"rgba(0,0,0,0)"}}
                }
                annotsByid[ax].font.color = "rgba(0,0,0,0)";
            }
        }
        for (let i = 0; i < showLogic.length; i++) {
            var key = showLogic[i];
            let ax = "yaxis"+plot_elements_state.axes.axisMap[key];
            layoutUpdate[ax] = layout[ax];
            layoutUpdate[ax].title = {font:{color:"#888888"}};

            annotsByid[ax].font.color = "#888888";
            if (i === 0) {
                layoutUpdate[ax].side = "left";
                layoutUpdate[ax].showline = true;
                layoutUpdate[ax].showgrid = true;
                layoutUpdate[ax].showticklabels = true;
                annotsByid[ax].x=0;
                annotsByid[ax].xref="paper";
                annotsByid[ax].xanchor="right";
            }
            else {
                layoutUpdate[ax].showline = true;
                layoutUpdate[ax].showgrid = true;
                layoutUpdate[ax].showticklabels = true;
                layoutUpdate[ax].side = "right";
                if(layout.xaxis.range!==undefined)annotsByid[ax].x=layout.xaxis.range[1];
                else annotsByid[ax].x = (new Date()).getTime();
                annotsByid[ax].xanchor="left";
                let xpos = 0.87 + (i*0.03);
                if(i>1){
                    layoutUpdate[ax].anchor = "free";
                    layoutUpdate[ax].position = xpos;
                }
                else layoutUpdate[ax].anchor = "x";
                annotsByid[ax].xref="paper";
                annotsByid[ax].x=xpos;
            }
        }
        return layoutUpdate;
    };


    var addNewDatasets = function (codes) {

        var registerInitialRanges = function(layout_update){
            for(let axis in layout_update){
                let fullAx = plot_elements_state.plot._fullLayout[axis];
                if(fullAx !== undefined && (fullAx._rangeInitial === undefined || plot_elements_state.plot.layout[axis].firstView === 0)) {
                    plot_elements_state.plot.layout[axis].firstView = 1;
                    let range = layout_update[axis].range;
                    fullAx._rangeInitial = [range[0],range[1]];
                    fullAx.dtick = layout_update[axis].dtick;
                }
            }
        };


        return new Promise((resolve, reject) => {
            if(codes.length === 0) resolve();
            pullPlotData(codes).then(function (pres) {
                let layout = plot_elements_state.plot.layout;
                let storeData = pres[0];
                let states     = pres[1];
                var datasets = [];

                for(let key in storeData){
                    if(plot_elements_state.elems[key] !== undefined && plot_elements_state.elems[key].index !== undefined) continue;
                    let datasetState = plot_elements_state.elems[key];
                    let color = datasetState.color;
                    var yA = datasetState.yaxis;
                    let plottype = datasetState.plot_type;
                    let edata = processChartData(storeData[key],datasetState,storeData[key].mode);
                    if (yA === undefined || yA === null) yA = "y_temp";
                    let desc = datasetState.desc;

                    if(datasetState.groupnorm !== null){
                        let legend = datasetState.legend;
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
                            colors = "#888888";
                        }
                        if(datasetState.htmlelement !== undefined)datasetState.htmlelement.setAttribute("bck-col",colors);

                        for (let i=0;i<legend.length;i++){
                            var dataset = {
                                id: key+"_"+i,
                                visible: datasetState.visible,
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
                            dataset.groupnorm = datasetState.groupnorm;
                            datasets.push(dataset);
                        }
                    } else {
                        var dataset = {
                            id: key,
                            visible: datasetState.visible,
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
                            dataset.marker.opacity = setup_instance.values.defaultHistogramSetup.opacity;
                            dataset.xbins = {size:binSize};
                            sharedBinningDataset[key] = dataset;
                            if(layout.updatemenus === undefined) layout.updatemenus = updateMenus;
                        }
                        datasets.push(dataset);
                    }

                }

                let shapes = plotAnnotations.getStateAnnotations(states);
                plot_elements_state.plot.layout.shapes = plot_elements_state.plot.layout.shapes.concat(shapes);
                setActiveAxes(true);
                let layout_update = {};
                let hasUpdate = interactions.correctVisibleAxes(layout_update);
                if(hasUpdate){
                    Plotly.relayout(plot_elements_state.plot,layout_update).then(function () {
                        registerInitialRanges(layout_update);
                    });
                }
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
                    append:[[],[],[],[]],
                    prepend:[[],[],[],[]],
                };
                for(let key in storeData){
                    let datasetState = plot_elements_state.elems[key];
                    let edata = processChartData(storeData[key],datasetState,storeData[key].mode);
                    if(datasetState.groupnorm === null) {
                        if (storeData[key].mode === "append") {
                            joinTraces.append[0].push(edata[0]);
                            joinTraces.append[1].push(edata[1]);
                            joinTraces.append[2].push(datasetState.index[0]);
                        } else {
                            joinTraces.prepend[0].push(edata[0]);
                            joinTraces.prepend[1].push(edata[1]);
                            joinTraces.prepend[2].push(datasetState.index[0]);
                        }
                    }
                }
                if(joinTraces.append[0].length>0){
                    Plotly.extendTraces(plot_elements_state.plot,{y: joinTraces.append[1],x:joinTraces.append[0]},joinTraces.append[2])
                }
                if(joinTraces.prepend[0].length>0){
                    Plotly.prependTraces(plot_elements_state.plot,{y: joinTraces.prepend[1],x:joinTraces.prepend[0]},joinTraces.prepend[2])
                }
                for(let s in states){
                    plotAnnotations.appendStateDataToPlot(s,states[s].values,states[s].mode)
                }
                resolve();
            });
        });
    };


    async function registerButton(elements){
        let activeButtons = [];
        let axes = {};
        let missingButtons = {};
        if(elements.length === 0) return;
        let priorityParams = {};
        if(elements[0] instanceof HTMLElement) {
            //When DOM nodes
            for (let e = 0; e < elements.length; e++) {
                let code = elements[e].getAttribute("pl-code");
                let active = elements[e].classList.contains("active");
                if (plot_elements_state.elems[code] === undefined) {
                    plot_elements_state.pendingSetup.push(code);
                    missingButtons[code] = elements[e];
                } else {
                    plot_elements_state.elems[code].htmlelement = elements[e];
                }
                if (active) {
                    activeButtons.push(code);
                }
                let axis = elements[e].getAttribute("y-axis");
                if (axis !== null) {
                    axes[code] = axis;
                }
                interactions.registerButtonClick(elements[e]);
            }
        } else {
            //When Object, do not register htmlelement
            const copyParams = ['color','fixedcolor'];
            for (let e = 0; e < elements.length; e++) {
                let code = elements[e].code;
                let active = elements[e].active;
                if (plot_elements_state.elems[code] === undefined) {
                    plot_elements_state.pendingSetup.push(code);
                }
                if (active) {
                    activeButtons.push(code);
                }
                let axis = elements[e].yaxis;
                if (axis !== undefined) {
                    axes[code] = axis;
                }
                priorityParams[code] = {};
                for(let c=0;c<copyParams.length;c++){
                    let cp = copyParams[c];
                    if(elements[e][cp] !== undefined){
                        priorityParams[code][cp] = elements[e][cp];
                    }
                }
            }
        }
        if(plot_elements_state.pendingSetup.length>0){
            await setup_instance.fetchSetupByCode(plot_elements_state.pendingSetup,plotid);
            for(let p=0;p<plot_elements_state.pendingSetup.length;p++){
                let code = plot_elements_state.pendingSetup[p];
                plot_elements_state.elems[code] = await setup_instance.getCodeSetup(code,plotid);
                if(missingButtons[code] !== undefined)plot_elements_state.elems[code].htmlelement = missingButtons[code];
            }
        }

        for (let code in priorityParams){
            let params = priorityParams[code];
            for (let c in params){
                plot_elements_state.elems[code][c] = params[c];
            }
        }
        for(let code in axes){
            plot_elements_state.elems[code].yaxis = axes[code];
        }
        activeButtons.forEach( code => {
            let datasetState = plot_elements_state.elems[code];
            let state = (datasetState.yaxis === "y_state" || datasetState.isState === true);
            let color = datasetState.fixedcolor;
            if (color === null || color === "" || color === undefined) {
                if(datasetState.color === undefined) {
                    if (state) datasetState.color = "#888888";
                }
                color = helpers.findNewButtonColor(datasetState.color);
            }
            helpers.setButtonStateByColor(datasetState,color,code);
            if(datasetState.visible && !state) plot_elements_state.axes.axisActiveCount[datasetState.yaxis]++;
        });
        plot_elements_state.pendingSetup = [];
        addNewDatasets(activeButtons);
        return Promise.resolve();
    }

    var interactions = (function () {

        let toggleDatasetState = function (code) {
            if(code === undefined) code = this.getAttribute("pl-code");
            let datasetState = plot_elements_state.elems[code];
            if(datasetState === undefined) {
                console.warn("Invalid code in toggleDatasetState: "+code);
                return;
            }
            let isState = (datasetState.yaxis === "y_state" || datasetState.isState === true);
            let data_update = {};
            let layout_update = {};
            if(datasetState.visible){
                if(isState){
                    plotAnnotations.toggleStateAnnotations(false,code);
                }  else {
                    data_update = toggleDatasetVisibility(false,code);
                    plot_elements_state.axes.axisActiveCount[datasetState.yaxis]--;
                }
                helpers.releaseButtonColor(datasetState.color);
                delete plot_elements_state.activeCodes[code];
                if(datasetState.htmlelement !== undefined){
                    helpers.DOMupdates.updateButtonState(datasetState.htmlelement,false,"transparent");
                } else {
                    helpers.DOMupdates.buttonStateUpdateCallback(code,false,"transparent");
                }
                datasetState.visible = false;
                layout_update = setActiveAxes(false);
                Plotly.update(plot_elements_state.plot,data_update,layout_update,datasetState.index[0]);
            } else {
                let color = datasetState.fixedcolor;
                if(color === undefined || color === null){
                    if(isState && datasetState.color === undefined) datasetState.color = "#888888";
                    color = helpers.findNewButtonColor(datasetState.color);
                }
                helpers.setButtonStateByColor(datasetState,color,code);
                if (datasetState.visible === false) return;
                if(isState){
                    plotAnnotations.toggleStateAnnotations(true,code,color);
                } else {
                    plot_elements_state.axes.axisActiveCount[datasetState.yaxis]++;
                    data_update = toggleDatasetVisibility(true,code,color);
                    if(datasetState.index !== undefined) {
                        layout_update = setActiveAxes(false);
                        correctVisibleAxes(layout_update);
                    }
                    Plotly.update(plot_elements_state.plot,data_update,layout_update,datasetState.index);
                }

                if(datasetState.index === undefined){
                    helpers.queue.addToQueue(addNewDatasets,[[code]]);
                } else {
                    helpers.queue.addToQueue(appendDataToPlot,[[code]],function () {
                        Plotly.redraw(plot_elements_state.plot);
                    });
                }

            }
        };


        let registerButtonClick = function (elem) {
            elem.addEventListener("click",function () {
                toggleDatasetState.call(this);
            });
        };

        var prevXaxisRange = [null,null];
        let checkDataPullConditions = function (range) {
            if(prevXaxisRange === null){
                prevXaxisRange = range;
                return true;
            }
            let pullData = false;
            if(prevXaxisRange[0] > range[0]) pullData = true;
            if(prevXaxisRange[1] < range[1]) pullData = true;
            prevXaxisRange = range;
            return pullData;
        };


        let setXaxisRange = function (layout_update) {
            let xRange = helpers.getRangeAsDate(plot_elements_state.plot.layout.xaxis.range);
            let dataSets = plot_elements_state.plot.data;
            let allFirst = null;
            let allLast = null;
            for(let d in dataSets){
                let len = dataSets[d].x.length;
                if(len>0){
                    let first = dataSets[d].x[0];
                    let last = dataSets[d].x[len-1];
                    if(allFirst === null || first < allFirst) allFirst = first;
                    if(allLast === null || last > allLast) allLast = last;
                }
            }

            let [startDateTime,endDateTime] = xRange;
            let updateSlider = false;
            if(startDateTime < allFirst){
                plot_elements_state.plot.layout.xaxis.range[0] = allFirst;
                updateSlider = true;
            }
            if(endDateTime > allLast){
                plot_elements_state.plot.layout.xaxis.range[1] = allLast;
                updateSlider = true;
            }
            if(updateSlider){
                layout_update.xaxis = plot_elements_state.plot.layout.xaxis;
                layout_update.xaxis.range = plot_elements_state.plot.layout.xaxis.range;
            }
        };

        let correctVisibleAxes = function (axisUpdates) {
            let elems = plot_elements_state.elems;
            let exByAxis = {};
            let activeAxes = {};

            //Find absolute min an max values
            for(let c in elems){
                if(elems[c].visible !== true) continue;
                let axis = elems[c].yaxis;
                axis = "yaxis"+plot_elements_state.axes.axisMap[axis];
                if(exByAxis[axis] === undefined) exByAxis[axis] = [0,20];
                if(elems[c].linkedValues === undefined) continue;
                let extremes = elems[c].linkedValues.extremes;
                let min = extremes.absMin.y;
                let max = extremes.absMax.y;
                if(min !== undefined){
                    if(exByAxis[axis][0]>min) exByAxis[axis][0] = min;
                    if(exByAxis[axis][1]<max) exByAxis[axis][1] = max;
                }
                if(plot_elements_state.plot.layout[axis].firstView === undefined) {
                    plot_elements_state.plot.layout[axis].firstView = 0;
                }
                activeAxes[axis] = plot_elements_state.plot.layout[axis];
            }
            for (let ax in axisUpdates){
                if(axisUpdates[ax].showline === true) activeAxes[ax] = plot_elements_state.plot.layout[ax];
            }

            //Check if any range is outside of the min/max dataset values
            let panMode = false;
            let pan = plot_elements_state.modebar.querySelector(".modebar-btn[data-val='pan']");
            if(pan !== null){
                panMode = pan.classList.contains("active");
            }
            let rangeLimitCorrections = {};
            for (let ax in exByAxis){
                let yax = plot_elements_state.plot.layout[ax];
                if(yax.range === undefined) continue;
                let limit = [exByAxis[ax][0],exByAxis[ax][1]];
                let buffer = (limit[1]-limit[0])*0.05;
                let add = buffer;
                if(yax.dtick !== undefined) buffer += 2*yax.dtick;
                let valueLimit = [limit[0]-add,limit[1]+add];
                limit[0] = limit[0]-buffer;
                limit[1] = limit[1]+buffer;
                let range = [yax.range[0],yax.range[1]];
                if(panMode){
                    if(range[0] < limit[0]) {
                        let diff = range[1]-range[0];
                        range[0] = valueLimit[0];
                        range[1] = (valueLimit[0]+diff);
                    }else if(range[1] > limit[1]) {
                        let diff = range[1]-range[0];
                        range[1] = valueLimit[1];
                        range[0] = (valueLimit[1]-diff);
                    }
                } else {
                    if(range[0] < limit[0]) range[0] = valueLimit[0];
                    if(range[1] > limit[1]) range[1] = valueLimit[1];
                }
                if(range[0] > range[1]) range[1] = range[0]+add;
                if(range[0] !== yax.range[0] || range[1] !== yax.range[1]){
                    rangeLimitCorrections[ax] = [range[0],range[1]];
                }
            }

            let hasUpdates = matchAxisGridLines(activeAxes,exByAxis,rangeLimitCorrections,axisUpdates);

            return hasUpdates;
        };

        //Try to correct grid lines until it is implemented in Plotly
        let matchAxisGridLines = function(activeAxes,exByAxis,rangeLimitCorrections,axisUpdates){
            let hasUpdates = false;
            let findNewDTick = function (range,ct,strictRound) {
                let rdiff = range[1]-range[0];
                let roughDTick = rdiff/ct;
                if(range[1]>0 && range[0] <0){
                    let ctCheck = Math.ceil(range[1]/roughDTick);
                    ctCheck += Math.ceil((range[0]*-1)/roughDTick);
                    if(ctCheck>ct) roughDTick = rdiff/(ct-1);
                }
                function getBase(v) {
                    return Math.pow(v, Math.floor(Math.log(roughDTick) / Math.LN10));
                }
                let base = getBase(10);
                let newdtick = roughDTick/base;
                if(strictRound){
                    let dnum = Math.ceil(newdtick);
                    let halfDiff = dnum-newdtick;
                    if(halfDiff>=0.5) dnum = dnum-0.5;
                    newdtick = dnum * base;
                    if(newdtick > 5 && newdtick <10) newdtick = 10;
                } else {
                    let dnum = newdtick * 1000;
                    dnum = Math.ceil(dnum);
                    dnum = dnum/1000;
                    newdtick = dnum * base;
                }

                return newdtick;
            };
            let tickcount = 5;


            for(let a in activeAxes){
                let lay_ax = activeAxes[a];
                if(axisUpdates[a] === undefined && exByAxis[a] === undefined) continue;
                let range = [0,20];
                let dTicKRange = null;
                let rangeSource = 0;
                let strictRound = true;
                if(exByAxis[a] !== undefined) {
                    range[0] = exByAxis[a][0];
                    range[1] = exByAxis[a][1];
                    rangeSource = 1;
                }

                if(lay_ax.range !== undefined && lay_ax.firstView !== 0) {
                    if(rangeLimitCorrections[a] !== undefined) {
                        range = [rangeLimitCorrections[a][0],rangeLimitCorrections[a][1]];
                        rangeSource = 2;
                    }
                    else {
                        range = [lay_ax.range[0],lay_ax.range[1]];
                        rangeSource = 3
                    }
                }
                let initRange = [range[0],range[1]];
                dTicKRange = [range[0],range[1]];
                if(dTicKRange[0] > exByAxis[a][0] || dTicKRange[1] < exByAxis[a][1]) strictRound = false;

                let dtick = findNewDTick(dTicKRange,tickcount,strictRound);
                if(range[0] < 0){
                    if(range[1]>0){
                        let minPcs = range[0]/dtick+(dtick*0.01);
                        minPcs = Math.floor(minPcs);
                        range[0] = dtick*minPcs;
                        range[1] = dtick*(tickcount+minPcs);
                    } else {
                        range[0] = range[1]-(dtick*tickcount);
                    }
                } else {
                    range[1] = range[0]+(dtick*tickcount);
                }
                if(range[0] !== initRange[0] || range[1] !== initRange[1]){
                    if(axisUpdates[a] === undefined) axisUpdates[a] = lay_ax;
                    axisUpdates[a].range = [range[0],range[1]];
                    hasUpdates = true;
                }
                if(lay_ax.dtick !== dtick){
                    if(axisUpdates[a] === undefined) axisUpdates[a] = lay_ax;
                    axisUpdates[a].dtick = dtick;
                    hasUpdates = true;
                }
            }
            return hasUpdates;
        };

        var handlePlotlyRelayout = function(){
            let xRange = helpers.getRangeAsDate(plot_elements_state.plot.layout.xaxis.range);
            let shouldPullData = checkDataPullConditions(xRange);
            if(shouldPullData){
                helpers.queue.addToQueue(appendDataToPlot,[(Object.keys(plot_elements_state.activeCodes))],function () {
                    let layout_update = {};
                    setXaxisRange(layout_update);
                    correctVisibleAxes(layout_update);
                    Plotly.relayout(plot_elements_state.plot,layout_update);
                });
                return;
            } else {
                let layout_update = {};
                let hasUpdates = correctVisibleAxes(layout_update);
                if(hasUpdates) Plotly.relayout(plot_elements_state.plot,layout_update);
            }

        };

        var relayoutCount = 0;
        let registerPlotRelayoutCallback = function(){
            plot_elements_state.plot.on('plotly_relayout',
                function(eventdata){
                    relayoutCount++;
                    setTimeout(function () {
                        relayoutCount--;
                        if(relayoutCount<=0)handlePlotlyRelayout();
                    },200)
                    console.log("E",eventdata);
                });

        };


        return {
            registerButtonClick:registerButtonClick,
            registerPlotRelayoutCallback:registerPlotRelayoutCallback,
            toggleDatasetState:toggleDatasetState,
            correctVisibleAxes:correctVisibleAxes
        }
    })();

    let registerButtons = function(elements,whenDone){
        helpers.queue.addToQueue(registerButton,[elements],whenDone);
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
        domUpdaters:helpers.DOMupdates,
        toggleDataSetState: interactions.toggleDatasetState,
        executeFunc: function (fname,params) {
            if(runFunctions[fname] !== undefined){
                helpers.queue.addToQueue(runFunctions[fname],params);
            }
        }
    };

};

export default plotly_handler;