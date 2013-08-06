spoontwisted/plot
========

THIS IS NOT READY FOR PRODUCTION USE

Implementation and configuration options may change with each release. Please do not use this in production.

##How to use

`$("#container").plot(data, config, callback);`

###data

An array of points to plot on the chart

    [  
        [0, 3],  
        [1, 1],  
        [2, 0],  
        [3, 6],  
        [4, 5],  
        [5, 3]  
    ]

Currently the chart iterates through each data point and ignores the first item in each array, so a 0 data point would need to be passed for zero.  

ex: `[2, 0]` is the third data point, where 2 is ignored and 0 is how many things.

This will be updated in the future to build the chart based on the first item in each data point, and passing zeros will be optional.

###config
A JSON object with the following parameters

    {
        "width": 540, // width of canvas
        "height": 300, // height of canvas
        "type": "bar", // "bar" or "line"
        "range": {
            "show": true, // show range selection
        },
        "grid": {
            "show": true, // show grid
            "interval": 10 // how many points between grid lines
        },
        "labels": {
            "show": true, // show labels
            "xaxis": "time", // x-axis label
            "yaxis": "count" // y-axis label
        },
        "info": {
            "show": true, // show info overlay
            "x": "Time", // x-axis info description
            "y": "TPM" // y-axis into description
        },
        "classes": {
            "graph": "graph", // class for graph canvas
            "range": "range", // class for range canvas
            "label": "label", // class for label divs
            "info": "info" // class for info div
        },
        "style": {
            "border": "#CCCCCC", // border around canvas
            "barColor": "#FF9900", // color of bars in bar graph
            "barPadding": 2, // padding between bars in bar graph
            "lineColor": "#FF9900", // color of line in line graph
            "rangeColor": "#E5E5E5", // color of range selection
            "rangeOpacity": 0.5, // opacity of range in range selection
            "handleColor": "#868695", // color of range handles
            "handleImage": null, // image to display for range handles (URI)
            "handleWidth": 10, // width of range handles if no image set
            "handleHeight": 40, // height of range handles if no image set
            "gridColor": "#F0F0F0", // color or grid lines
            "labelTextSize": 14, // size of label text
            "labelLeftWidth": 30, // width of vertical label div
            "labelBottomHeight": 30, // height of horizontal label div
            "infoColor": "#EFEFEF", // background color of info box
            "infoBorder": "#CCCCCC", // border color of info box
            "infoTextSize": 10 // text size for info box
        }
    }

###callback
A function with one parameter (data) to call when a range has been selected on the chart

    function(data){
        console.log(data);
        console.log("from: " + data.from[0] + ", to: " + data.to[0]);
    }
