spoontwisted/plot
========

THIS IS NOT READY FOR PRODUCTION USE

Implementation and configuration options may change with each release. Please do not use this in production.

##How to use

`$("#container").plot(data, config, callback);`

###data

An array of points (arrays) to plot on the chart

    [  
        [0, 3],  
        [1, 1],  
        [{pretty: "two", ugly: 2}, 0],  
        [3, 6],  
        [4, 5, "notation"],  
        [5, 3]  
    ]

Each point should be an array containing 2-3 items, as follows:

#index 0 (required): The label for the point. Either a number/string, or if desired, an object with "pretty" and "ugly" labels. The pretty label will be used for label display and info box text.

#index 1 (required): The data. Must be a number. Note the chart currently doesn't support numbers less than 0.

#index 3 (optional): The notation (line graph only). This will be a string of text that tells the plugin to show a dot on a data point of interest. Upon hovering the dot, the text passed will be displayed in a popin (TODO).

###config
A JSON object with the following parameters

    {
        "width": 540, // width of canvas
        "height": 300, // height of canvas
        "type": "bar", // "bar" or "line"
        "range": {
            "show": true // show range selection
        },
        "grid": {
            "show": true, // show grid
            "interval": 10, // how many data points between vertical grid lines
            "xSize": 1,
            "ySize": 1
        },
        "labels": {
            "show": true, // show labels
            "decimals": 1, // decimal points for left label if over 1000
            "xLabel": false, // x-axis label
            "xCount": 7, // number of labels to display
            "yLabel": false, // y-axis label
            "yCount": 3 // number of labels to display
        },
        "notations": {
            "show": true
        },
        "info": {
            "show": true, // show info overlay
            "xaxis": "Time", // x-axis info description
            "yaxis": "TPM" // y-axis into description
        },
        "classes": {
            "bg": "bg", // class for graph canvas
            "graph": "graph", // class for graph canvas
            "range": "range", // class for range canvas
            "label": "label", // class for label divs
            "info": "info" // class for info div
        },
        "style": {
            "borderColor": "#CCCCCC", // border around canvas
            "fillImage": false, // URL for chart background image
            "barColor": "#FF9900", // color of bars in bar graph
            "barPadding": 2, // padding between bars in bar graph
            "lineColor": "#108DC8", // color of line in line graph
            "lineWidth": 2, // width of line in line graph
            "lineFillColor": "#FFFFFF", // chart fill color
            "lineFillImage": false, // URL for chart fill image, overrides lineFillColor
            "rangeColor": "#E5E5E5", // color of range selection
            "rangeOpacity": 0.5, // opacity of range in range selection
            "handleColor": "#868695", // color of range handles
            "handleImage": null, // image to display for range handles (URI)
            "handleWidth": 10, // width of range handles if no image set
            "handleHeight": 40, // height of range handles if no image set
            "gridColor": "#F0F0F0", // color or grid lines
            "labelLeftTextSize": 12, // size of left label text
            "labelLeftWidth": 20, // width of vertical label div
            "labelBottomTextSize": 12, // size of bottom label text
            "labelBottomHeight": 20, // height of horizontal label div
            "labelPadding": 5, // space between label and graph
            "infoColor": "#EFEFEF", // background color of info box
            "infoBorder": "#CCCCCC", // border color of info box
            "infoTextSize": 10, // text size for info box
            "notationSize": 8, // size of notation dot
            "notationFillColor": "#FFFFFF", // color of notation dot
            "notationBorderColor": "#108DC8", // color of notation border
            "notationBorderWidth": 2, // width of notation border
            "notationPopinBackground": "#FFFFFF", // background color of notation popin
            "notationPopinColor": "#333333" // text color of notation popin
        }
    }

###callback
A function with one parameter (data) to call when a range has been selected on the chart. This will return the data point exactly as it is passed into the plugin.

    function(data){
        console.log(data);
        console.log("from: " + data.from[0] + ", to: " + data.to[0]);
    }
