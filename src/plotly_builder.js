import plotly_setup from './setup_holder.js';
import plotly_handler from "./main_plot";

var plotlyBuilder = (function () {
    var plotinstance = {};
    var setup;

    var checkPlotlyInstance = function () {
        let ret = {plotly:false};
        if (typeof Plotly === "undefined"){
            console.error("Could not find Plotly.js - download from https://github.com/plotly/plotly.js/");
        } else if (Plotly.Plots === undefined || Plotly.Plots.allTypes === undefined) {
            console.error("Invalid Plotly.js instance - Unable to find supported categories from Plotly.Plots.allTypes");
        } else {
            let types = {"scatter":false,"histogram":false};
            let required = {"scatter":false};
            for (let p=0;p < Plotly.Plots.allTypes.length;p++){
                let cat = Plotly.Plots.allTypes[p];
                if(types[cat] !== undefined){
                    types[cat] = true;
                    if(required[cat] !== undefined) required[cat] = true;
                }
            }
            let missing = [];
            for (let r in required){
                if(required[r] === false){
                    missing.push(r);
                }
            }
            if(missing.length>0){
                console.error("Could not find following required plot type(s): "+missing.join(", "));
            } else {
                ret.plotly = true;
            }
            ret.plotTypes = types;
        }
        return ret;
    };
    checkPlotlyInstance();

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

    let initSetup = function (plotid,action,params) {
        setup = plotly_setup();
        setup.values.supportedPlotTypes = (checkPlotlyInstance()).plotTypes;
        setup.setRequestURL(plotid,action,params);
    };

    return {
        getInstance: function (plot,action,params) {
            let [plotid,elems] = parseplot(plot);
            if (!setup) {
                initSetup(null,action,params)
            }
            if(plotinstance[plotid] === undefined)plotinstance[plotid] = createInstance(plotid,setup,elems);
            return plotinstance[plotid];
        },
        getSetup: function (action,params) {
            if (!setup) {
                initSetup(null,action,params)
            }
            return setup;
        },
    };
})();

export default plotlyBuilder;