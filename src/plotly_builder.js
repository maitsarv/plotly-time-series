import plotly_setup from './setup_holder.js';
import plotly_handler from "./main_plot";


console.log(plotly_setup,plotly_handler);

var plotlyBuilder = (function () {
    var plotinstance = {};
    var setup;

    var checkPlotlyInstance = function () {
        if (typeof Plotly === "undefined"){
            console.error("Could not find Plotly.js - download from https://github.com/plotly/plotly.js/");
            return false;
        } else if (Plotly.Plots === undefined || Plotly.Plots.allTypes === undefined) {
            console.error("Invalid Plotly.js instance - Unable to find supported categories from Plotly.Plots.allTypes");
            return false;
        } else {
            let required = {"scatter":false,"histogram":false};
            for (let p=0;p < Plotly.Plots.allTypes.length;p++){
                let cat = Plotly.Plots.allTypes[p];
                if(required[cat] !== undefined) required[cat] = true;
            }
            let missing = [];
            for (let r in required){
                if(required[r] === false){
                    missing.push(r);
                }
            }
            if(missing.length>0){
                console.error("Could not find following required plot type(s): "+missing.join(", "));
                return false;
            }
        }
        return true;
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

    return {
        getInstance: function (plot,action,params) {
            let [plotid,elems] = parseplot(plot);
            if (!setup) {
                setup = plotly_setup();
                setup.setRequestURL(null,action,params);
            }
            if(plotinstance[plotid] === undefined)plotinstance[plotid] = createInstance(plotid,setup,elems);
            return plotinstance[plotid];
        },
        getSetup: function (action,params) {
            if (!setup) {
                setup = plotly_setup();
                setup.setRequestURL(null,action,params);
            }
            return setup;
        },
    };
})();

export default plotlyBuilder;