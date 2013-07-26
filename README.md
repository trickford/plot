spoontwisted/plot
========

THIS IS NOT READY FOR PRODUCTION USE

Implementation and configuration options may change with each release. Please do not use this in production.

##How to use

`$("#container").plot(data,config);`

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
        width: 540, // width of canvas
        height: 300, // height of canvas
        style: "bar", // style of chart ("line" or "bar")
        barStyle: {
            hPadding: 2, // padding around bars
            barColor: "#FF9900" // color of bars
        },
        lineStyle: {
            lineColor: "#FF9900" // color of line
        },  
        rangeStyle {
            color: "#E5E5E5", // color of range box
            opacity: 0.5 // opacity of range box
        }
    }
