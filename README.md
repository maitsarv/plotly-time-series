# plotly-time-series
Wrapper for Plotly.js to visualize different type of time series datasets on one chart instance

## Fuctionalities
* Time series data visualization
* Multiple data sets on one Plotly instance
* Front end library, possibility to set URIs for back end data fetching.
* Shared x-axis, multiple y-axes based on units
* Data sets can be toggled on and off.
* Load data on demand based on date range filters.

## How to install
* Get plotly_time_series.js from dist folder
* Get a ploty.js distribution that has scatter plots included (basic build includes it). More plot type support coming later.
* Dependent on your project include the ploty.js build and plotly_time_series.js to your project. plotly_time_series.js requires plotly.js to me loaded before initialization.
    * When using plain html then load with &lt;script&gt; tags.
    * Right now there are not other distributions, when module is required, then the whole project should be re-built with updated output.libraryTarget option in webpack.config.js
    
## Process flow
The Plotly Time Series library needs some setup before it could be used, it needs source of data and setup for the dataset types.
Default use case would be to have one y-axis for a measurement unit, but this all can be changed.
Here is the basic flow of the library to make the setup requirements understandable:
* The main setup object is initialized
* Plot is initialized
* Setup object calls function for getting initial setup for data sets. What units are used, plot type etc.
* Register datasets by code
    * If there is no setup for the code, then it tries to fetch it.
    * If there is category defined for the code, then it uses the category setup.
    * If no setup is found, then default is used.
    * Determine the y-axis to use based on setup.
    * Call function to fetch data in default time frame
    * Call front end functions for data formatting (defined in setup)
    * Initialize visible the y-axis ticks and sync grid lines. 
    * Create new Plotly dataset 
* After user interacts with the plot
    * Check if new data needs to be pulled (for example when user zooms out).
    * Call a function to fetch new data
    * Call front end functions for data formatting (defined in setup)
    * Append or prepend new data to existing dataset.
* After calling toggle dataset function
    * When dataset is activated, then check if it allowed by defined limit.
    * Check if new data needs to be pulled if dataset is activated.
        * Call a function to fetch new data
        * Call front end functions for data formatting (defined in setup)
    * Callback that notifies if dataset is active and what is the dataset color
    
## Set up
The main setup should be changed before the plot is initialized. 
For most uses cases only setup and data fetching functions should be overwritten:
```
    let plotSetup = plotlyTimeSeries.getSetup("plot/info",null);
    plotSetup.overWriteFunctions.fetchGlobalSetup = function (setupValues) {
     //return the values or a promise that resolves the setup values 
     return new Promise((resolve, reject) => {
        //The return object format should be following:
        resolve({
            //setup for category
            catsetup:{
                cat_temp:{
                    'unit': 'C',
                    'unithtml':'°C',
                    'plot_type': 'scatter', // scatter or state
                    'normalize':false,  // plot difference of values
                    'groupnorm':null,  //for stacked plots
                    'yaxis': 'y_temp', //determines the used axis
                    'opacityMap':{}    //for state plots: maps state value to opacity
                }
            },
            //setup for code, only parameters that need to be overwritten
            codesetup:{
                code1:{
                    'desc':'Temp under the Sun'
                }
            },
            //maps code the category
            codecat:{
                'code1':'cat_temp'
            }
        });
     });
    };
    //Used to pull setup on demand
    //If all the setup is provided in fetchGlobalSetup, then can be empty.
    plotSetup.overWriteFunctions.setupByCode = function(codes,values){};
    plotSetup.overWriteFunctions.setupByCat = function(codes,values){};
    
    //Additionally setup values, that could be changed, in this object.
    let setupValues = plotSetup.setup


    this.plotelem = plotlyTimeSeries.getInstance([plotCont,null]);
    this.plotelem.domUpdaters.buttonStateUpdateCallback = function(code,active,color){
        currentinstance.buttonColor(currentinstance.buttonGroups[code],code,color,active);
    };
    this.plotelem.overWriteFunctions.queryData = function(data){
        return new Promise((resolve, reject) => {
             resolve({
                'cat_temp': {
                    code1: [['2020-01-01 00:00:00', '23.4']],
                    code2: {values: [['21.1','2020-01-01 00:00:00']], formatters: "my_format_function"}
                }
             });
        });
    };

  
```