// Import lit-html
import {html, css, LitElement} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';
import { plotStyleElement } from './style-element.js';
import { test_setup } from './test-data';

export class PlotlyTsLitelement extends LitElement {

    groupTemplate(group){
        return html`
        <div id="${group.id}" class="plot-btn-group">
            <div class="plot-btn-group-header">${group.title}</div>
            <ul class="plot-btn-group-list">
                ${repeat(group.buttons, (btn) => btn[1].code, (btn, index) => html`
                ${this.groupButtonTemplate(btn[1])}
                `)}
            </ul>
        </div>
        `
    }
    groupButtonTemplate(btn){
        return html`
        <li class="ts-row" code="${btn.code}">
            <div class="btn-col"><div class="plot-button ${btn.active}" pl-code="${btn.code}" @click="${this.plotButtonClick}" style="background-color: ${btn.color};"></div></div>
            <div class="plot-label">${btn.desc}</div>
            <div class="plot-unit">${btn.unithtml}</div>
        </li>
        `
    }

    render() {
        return html`
      <style include="style-element">
      </style>
    <h2>Plotly time series lit-element demo</h2>
    <slot></slot>
    <div class="plot-container-out" id="${this.plotId}">
        <div class="plot-legend">
            <div class="legend-title"></div>
            <div class="legend-items">
                ${repeat(this.groups, (grp) => grp[1].id, (grp, index) => html`
                ${this.groupTemplate(grp[1])}
                `)}
            </div>
        </div>
     </div>`;
    }


    static get styles() {
        return [plotStyleElement];
    }

    static get properties() {
        return { plotId: {type: String},
                 groups: {type: Map}
        };
    }

    constructor() {
        super();
        let plotid = this.getAttribute("plot");
        this.plotId = "plotly-ts-lit";
        if(plotid!==null) this.plotId = plotid+"-ts-lit";
        this.groups = new Map([]);
        this.buttonGroups = {};
        this.plotElement();
        this.ix = 0;
    }

    async createButton(code,group,active,buttons){
        this.ix++;
        let ix = this.ix;
        const setup = await this.plotSetup.getCodeSetup(code,this.plotId,ix);
        buttons.push(this.addButton(code,group,setup.desc,setup.unithtml,active,false));
    }


    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
    }

    addGroup(id,title){
        this.groups.set(id,{id:id,title:title,buttons: new Map()});
    };

    addButton(code,group,desc,unit,active,requestUpdate){
        if(requestUpdate === undefined) requestUpdate = true;
        let grp = this.groups.get(group);
        if(grp === undefined || !grp){
            this.addGroup(group,group);
            grp = this.groups.get(group);
        }

        let btnObject = {
            code: code,
            active: (active === true),
            color: 'transparent',
            desc: desc,
            unithtml: unit
        };
        grp.buttons.set(code,btnObject);
        this.buttonGroups[code] = group;
        if(requestUpdate) this.requestUpdate('groups');
        return btnObject;
    }

    plotButtonClick(e){
        this.plotelem.toggleDataSetState.call(e.target);
    }

    buttonColor(group,button,color,active){
        let grp = this.groups.get(group);
        let btn = null;
        if(grp === undefined || !grp){
            for(let g in group){
                let b = group[g].buttons.get(button);
                if(b !== undefined){
                    btn = b;
                    break;
                }
            }
        } else {
            btn = grp.buttons.get(button);
        }
        if(btn !== undefined && btn !== null){
            btn.color = color;
            btn.active = (active===true?"active":"")
        }
        this.requestUpdate('groups');
    }

    plotElement(){
        this.plotSetup = plotlyTimeSeries.getSetup("plot/info",null);
        this.plotSetup.overWriteFunctions.globalSetup = function (setupValues) {
            return new Promise((resolve, reject) => {
                let data = test_setup;
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
                let sum = 0;
                setTimeout(function () {
                    resolve();
                },10);
            });

        };
        this.plotSetup.overWriteFunctions.setupByCode = function(codes,values){
        };
        let currentinstance = this;
        let plotCont = this.querySelector(".plot-container");
        this.plotelem = plotlyTimeSeries.getInstance([plotCont,null]);
        this.plotelem.domUpdaters.buttonStateUpdateCallback = function(code,active,color){
            currentinstance.buttonColor(currentinstance.buttonGroups[code],code,color,active);
        };
        var plotSetup = this.plotSetup;
        this.plotelem.overWriteFunctions.queryData = function(data){
            let generateDataInTimeFrame=function(value,start,end){
                if(value === null) value = 0;
                let values = [];
                for(let c=start;c<end;c+=600){
                    let trend = (Math.random()*6)-3;
                    if(value < -17 && trend < 0){
                        trend = 2*trend/(-15-value)
                    }
                    if(value > 24 && trend > 0){
                        trend = 2*trend/(value-22)
                    }
                    value += trend;
                    values.push([c,value]);
                }
                return values;
            };
            let generateStateDataInTimeFrame=function(value,start,end){
                if(value === null) value = parseInt(Math.random()*4);
                let valueLen = parseInt(Math.random()*24+2);
                let values = [];
                for(let c=start;c<end;c+=600){
                    valueLen--;
                    values.push([c,value]);
                    if(valueLen<=0){
                        value = parseInt(Math.random()*4);
                        valueLen = parseInt(Math.random()*8+2);
                    }
                }
                return values;
            };
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    let vals = {};
                    for (let cat in data){
                        if(Array.isArray(data[cat])){
                            vals[cat] = {
                                values:generateDataInTimeFrame(null,data[cat][0],data[cat][1])
                            };
                        } else {
                            vals[cat] = {};
                            for(let code in data[cat]){
                                let codesetup = test_setup.codecat[code];
                                if(codesetup === "SW"){
                                    vals[cat][code] = {
                                        values: generateStateDataInTimeFrame(null, data[cat][code] [0], data[cat][code] [1])
                                    };
                                } else {
                                    vals[cat][code] = {
                                        values: generateDataInTimeFrame(null, data[cat][code] [0], data[cat][code] [1])
                                    };
                                }
                            }
                        }
                    }
                    resolve(vals);
                },10);
            });
        };
    }
}

window.customElements.define('plotly-ts-litelement', PlotlyTsLitelement);

