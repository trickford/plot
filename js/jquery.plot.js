(function($) {

	function Plot(elem, data, config, completeCallback, rangeCallback){

		var self = this,
			defaults = {
				"width": 540, // width of canvas
				"height": 300, // height of canvas
				"type": "bar", // "bar" or "line"
				"range": {
					"show": true, // show range selection
					"initialSelection": null 	// object representing the starting state of the selection range
																	 	// { start: 0, end: 10 }
				},
				"grid": {
					"show": true, // show grid
					"xCount": 3, // set custom amount of horizontal grid lines
					"yCount": 10, // set custom amount of vertical grid lines
					"xInterval": false, // how many data points between horizontal grid lines, overrides xCount
					"yInterval": false, // how many data points between vertical grid lines, overrides yCount
					"xSize": 1, // size of horizontal grid line
					"ySize": 1 // size of vertical grid line
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
					"show": true, // show notations
					"tooltips": {
						"show": true, // draw notation tooltip hotspots
						"dataTag": "title" // custom data tag to use for tooltips
					}
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
					"fillColor": false, // color of chart background
					"barColor": "#FF9900", // color of bars in bar graph
					"barPadding": 2, // padding between bars in bar graph
					"lineColor": "#108DC8", // color of line in line graph
					"lineWidth": 2, // width of line in line graph
					"lineFillColor": "#FFFFFF", // chart fill color
					"lineFillImage": false, // URL for chart fill image, overrides lineFillColor
					"rangeColor": "#E5E5E5", // color of range selection
					"rangeOpacity": 0.5, // opacity of range in range selection
					"handleColor": "#868695", // color of range handles
					"handleImage": null, // image to display for range handles (URI) (used for both handles if present)
															 // accepts a single image url as a string, or { left: <url>, right: <url>} for different images
					"handleWidth": 10, // width of range handles if no image set
					"handleHeight": 40, // height of range handles if no image set
					"gridColor": "#F0F0F0", // color or grid lines
					"gridLineStyleX": "solid", // grid horizontal line style (solid, dotted, dashed)
					"gridLineStyleY": "solid", // grid vertical line style (solid, dotted, dashed)
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
					"notationPopinTextSize": 14, // size of text in notation popin
					"notationPopinPadding": 10, // padding around text in notation popin
					"notationPopinBackground": "#FFFFFF", // background color of notation popin
					"notationPopinBorderColor": "#000000", // border color for notation popin
					"notationPopinColor": "#333333" // text color of notation popin
				}
			};

		// mash config with defaults
		self.config = $.extend(true, {}, defaults, config);

		// begin assigning stuff
		self.data = data;
		self.$el = $(elem);
		self.completeCallback = completeCallback;
		self.rangeCallback = rangeCallback;
		self.grid = {};
		self.notations = [];

		// if range not previously selected, create new range object
		// TODO - maybe just always start with empty range, persisting is a pain in the ass and may not even be useful
		// self.range = self.$el.data("range") || {
		self.range = {
			from: {},
			to: {},
			handles: {
				left: {},
				right: {}
			},
			status: {}
		};

		// set canvas size (used for all canvases and the background div)
		self.canvas = {
			position: "absolute",
			width: (self.config.labels.show) ? self.config.width - self.config.style.labelLeftWidth - (self.config.style.borderColor ? 2 : 0) : self.config.width - (self.config.style.borderColor ? 2 : 0),
			height: (self.config.labels.show) ? self.config.height - self.config.style.labelBottomHeight - (self.config.style.borderColor ? 2 : 0) : self.config.height - (self.config.style.borderColor ? 2 : 0),
			left: (self.config.labels.show) ? self.config.style.labelLeftWidth : 0,
			top: 0,
			border: (self.config.style.borderColor ? "1px solid " + self.config.style.borderColor : "none")
		};

		self.defineElements();

		// if elements exist, clear them, otherwise create them
		if(self.$canvas.length){
			self.clearGraph();
			if(self.config.labels.show){
				self.clearLabels();
			}
		}else{
			self.createElements();
		}

		// load range handle images if that's what you want
		var imagePromise;
		if(self.config.style.handleImage){
			imagePromise = self.loadRangeImage();
		}

		// all that mousemove, mouseover, mouseout shit that makes this plugin better than yours
		self.clearRange();
		self.rangeEvents();

		// set graph background if that's what you want
		if(self.config.style.fillImage || self.config.style.fillColor){
			self.drawBackground();
		}

		// draw that shit
		if(self.config.type === "bar"){
			self.drawBarGraph();
		}else if(self.config.type === "line"){
			self.drawLineGraph();
		}

		// setup labels if that's what you want
		if(self.config.labels.show){
			self.createLabels();
		}


		if(self.config.range.initialSelection) {
			imagePromise.then(function() {
				self.drawRange(self.$rangeCanvas, self.config.range.initialSelection.start, self.config.range.initialSelection.end);
			});
		}

		// return to jQuery chain
		return this;

	}

	Plot.prototype.createElements = function(){
		var self = this;

		// create canvas element and range selector divs
		var bg = $("<div>").addClass(self.config.classes.bg),
			canvas = $("<canvas>").addClass(self.config.classes.graph),
			rangeCanvas = $("<canvas>").addClass(self.config.classes.range),
			labelLeft = $("<div>").addClass(self.config.classes.label + "-left"),
			labelBottom = $("<div>").addClass(self.config.classes.label + "-bottom"),
			info = $("<div>").addClass(self.config.classes.info),
			css = {
				left: {
					position: "absolute",
					top: 0,
					left: 0,
					height: self.config.height - self.config.style.labelBottomHeight,
					width: self.config.style.labelLeftWidth
				},
				bottom: {
					position: "absolute",
					bottom: 0,
					right: 0,
					height: self.config.style.labelBottomHeight,
					width: self.config.width - self.config.style.labelLeftWidth
				},
				info: {
					position: "absolute",
					top: 0,
					right: 0,
					"font-size": self.config.style.infoTextSize,
					background: self.config.style.infoColor,
					border: "1px solid " + self.config.style.infoBorder,
					opacity: 0.7,
					padding: 10,
					display: "none"
				}
			};

		// create canvas and set dimensions
		bg.attr({
			height: self.canvas.height,
			width: self.canvas.width
		}).css(self.canvas).appendTo(self.$el);

		// create canvas and set dimensions
		canvas.attr({
			height: self.canvas.height,
			width: self.canvas.width
		}).css(self.canvas).appendTo(self.$el);

		// create range container and set dimensions and positioning
		rangeCanvas.attr({
			height: self.canvas.height,
			width: self.canvas.width
		}).css(self.canvas).appendTo(self.$el);

		if(self.config.labels.show){
			// create left side label container and set dimensions and positioning
			labelLeft.attr({
				height: css.left.height,
				width: css.left.width
			}).css(css.left).appendTo(self.$el);

			// create bottom side label container and set dimensions and positioning
			labelBottom.attr({
				height: css.bottom.height,
				width: css.bottom.width
			}).css(css.bottom).appendTo(self.$el);
		}

		if(self.config.info.show){
			info.css(css.info).appendTo(self.$el);
		}

		// set dimensions of parent container
		self.$el.css({
			width: self.config.width,
			height: self.config.height,
			position: "relative"
		});

		self.defineElements();

		// if you're all about that excanvas IE8 shit, initialize it
		if(typeof G_vmlCanvasManager !== "undefined"){
			G_vmlCanvasManager.initElement(self.$canvas[0]);
		}
		// get context
		self.graphContext = self.$canvas[0].getContext("2d");

		if(self.config.range.show){
			// if you're all about that excanvas IE8 shit, initialize it
			if(typeof G_vmlCanvasManager !== "undefined"){
				G_vmlCanvasManager.initElement(self.$rangeCanvas[0]);
			}
			// get context
			self.rangeContext = self.$rangeCanvas[0].getContext("2d");
		}
	}

	Plot.prototype.defineElements = function(){
		var self = this;

		// throw existing elements to instance
		self.$bg = self.$el.find("div." + self.config.classes.bg);

		self.$canvas = self.$el.find("canvas." + self.config.classes.graph);
		if(self.config.range.show){
			self.$rangeCanvas = self.$el.find("canvas." + self.config.classes.range);
		}

		if(self.config.labels.show){
			self.$labelLeft = self.$el.find("div." + self.config.classes.label + "-left");
			self.$labelBottom = self.$el.find("div." + self.config.classes.label + "-bottom");
		}

		if(self.config.info.show){
			self.$info = self.$el.find("div." + self.config.classes.info);
		}
	}

	Plot.prototype.createLabels = function(){
		var self = this,
			yLabels = [],
			xLabels = [];

		// setup y labels
		var yUnitSize = self.grid.units / (self.config.labels.yCount - 1);

		for(var l = 0; l < self.config.labels.yCount; l++){
			var label = Math.round(l * yUnitSize);
			yLabels.push(self.processNumber(label));
		}

		yLabels.reverse();

		// setup x labels
		if(self.config.labels.xCount > self.data.length){
			self.config.labels.xCount = self.data.length;
		}
		for(var l = 0; l < self.config.labels.xCount; l++){
			// determine what labels to show
			var section = [
					Math.round(self.data.length / (self.config.labels.xCount / l)),
					Math.round(self.data.length / (self.config.labels.xCount / l)) + Math.floor(self.data.length / self.config.labels.xCount)
				],
				middle = Math.floor((section[1] - section[0]) / 2),
				label = self.data.slice(section[0], section[1])[middle][0];

			// show pretty labels if they exist
			if(typeof label === "object"){
				label = label.pretty;
			}else{
				label = label;
			}

			xLabels.push(label);
		}

		// create y labels
		for(var y = 0; y < yLabels.length; y++){

			var label = yLabels[y],
				containerHeight = self.$labelLeft.height(),
				labelCount = yLabels.length,
				heightInterval = (self.grid.unitHeight * self.grid.units) / (labelCount - 1),
				textHeight = self.config.style.labelLeftTextSize,
				top, css;

			if(y === 0){
				top = 0;
			}else if(y === labelCount - 1){
				top = containerHeight - textHeight;
			}else{
				top = (heightInterval * y) - (textHeight / 2);
			}

			css = {
				position: "absolute",
				top: top + "px",
				right: self.config.style.labelPadding + "px",
				width: self.config.style.labelLeftWidth - self.config.style.labelPadding + "px",
				color: self.config.style.labelTextColor,
				"text-align": "right",
				"font-size": textHeight + "px",
				"line-height": textHeight + "px"
			};

			$("<span>").addClass(self.config.classes.label).css(css).appendTo(self.$labelLeft).html(label);

		}

		// create x labels
		for(var x = 0; x < xLabels.length; x++){

			var label = xLabels[x],
				containerWidth = self.$labelBottom.width(),
				labelCount = xLabels.length,
				textHeight = self.config.style.labelBottomTextSize,
				widthInterval, left, width, align, css;

			// TODO - update label logic 'cause you done fucked it up

			// if(self.config.type === "line"){

			// 	widthInterval = Math.floor(containerWidth / (labelCount - 1));
			// 	if(x === 0){
			// 		left = 0;
			// 		align = "left";
			// 		width = widthInterval / 2;
			// 	}else if(x === labelCount - 1){
			// 		left = (containerWidth - (containerWidth / (labelCount - 1))) + (widthInterval / 2);
			// 		width = widthInterval / 2;
			// 		align = "right";
			// 	}else{
			// 		left = (containerWidth / (labelCount - 1)) * (x - 1) + (widthInterval / 2);
			// 		align = "center";
			// 		width = widthInterval;
			// 	}
				
			// }else{

				widthInterval = Math.floor(containerWidth / labelCount);
				if(x === 0){
					left = 0;
					align = "center";
					width = widthInterval;
				}else if(x === labelCount - 1){
					left = containerWidth - (containerWidth / labelCount);
					align = "center";
					width = widthInterval;
				}else{
					left = (containerWidth / labelCount) * x;
					align = "center";
					width = widthInterval;
				}

			//}

			// set location and styles of lables
			css = {
				position: "absolute",
				left: left + "px",
				top: self.config.style.labelPadding + "px",
				width: width,
				height: self.config.style.labelBottomHeight - self.config.style.labelPadding + "px",
				color: self.config.style.labelTextColor,
				"font-size": textHeight + "px",
				"line-height": textHeight + "px",
				"text-align": align
			};

			$("<span>").addClass(self.config.classes.label).css(css).appendTo(self.$labelBottom).html(label);

		}

	}

	Plot.prototype.clearLabels = function(){
		var self = this;

		self.$labelLeft.html("");
		self.$labelBottom.html("");
	}

	Plot.prototype.processNumber = function(number){
		var self = this;

		// turn large numbers into pretty ones for the y labels
		if(number > 999 && number < 1000000){
			var newNumber = (number / 1000).toFixed(self.config.labels.decimals) + "k";

			return newNumber;
		}else if(number > 999999){
			var newNumber = (number / 1000000).toFixed(self.config.labels.decimals) + "m";

			return newNumber;
		}else{
			return number;
		}

	}

	Plot.prototype.clearGraph = function(){
		var self = this;

		self.graphContext = self.$canvas[0].getContext("2d");
		self.graphContext.clearRect(0,0,self.canvas.width,self.canvas.height);
	}

	Plot.prototype.clearRange = function(){
		var self = this;

		if(typeof self.$rangeCanvas !== "undefined"){
			self.rangeContext = self.$rangeCanvas[0].getContext("2d");
			self.rangeContext.clearRect(0,0,self.canvas.width,self.canvas.height);
		}
	}

	Plot.prototype.clearNotations = function(){
		var self = this;

		self.$el.find(".notation").remove();
	}

	Plot.prototype.drawBackground = function(){
		var self = this
			css = {};

		// set background image or color if that's what you want
		if(self.config.style.fillImage){
			css.background = "url(" + self.config.style.fillImage + ") repeat 0 0";
		}else if(self.config.style.fillColor){
			css.background = self.config.style.fillColor;
		}

		self.$bg.css(css);
	}

	Plot.prototype.completed = function(){
		var self = this;

		// done drawing, throw to callback so you can do stuff to the complete graph
		if(typeof self.completeCallback === "function"){
			self.completeCallback();
		}
	}

	Plot.prototype.drawBarGraph = function(){
		var self = this,
			maxUnits, minUnits, unitWidth, unitHeight, lastBarEndpoint;

		// get data min/max
		for(var i = 0; i < self.data.length; i++){
			if(self.data[i][1] > maxUnits || typeof maxUnits === "undefined"){
				maxUnits = self.data[i][1];
			}
			if(self.data[i][1] < minUnits || typeof minUnits === "undefined"){
				minUnits = self.data[i][1];
			}
		}

		// set chart measurement units
		unitWidth = self.canvas.width / self.data.length;
		unitHeight = self.canvas.height / ((Math.abs(maxUnits) + Math.abs(minUnits) + 1));

		self.grid.unitWidth = unitWidth;
		self.grid.unitHeight = unitHeight;
		self.grid.units = maxUnits + (maxUnits * 0.1);
		
		if(self.config.grid.show){
			self.drawGrid();
		}

		// figure out hard stuff
		for(var i = 0; i < self.data.length; i++){
			var dataPoint = self.data[i][1];

			// set position of bar and round to nearest full pixel to avoid weird canvas half pixel aliasing bullshit
			var position = {
					height: Math.ceil(dataPoint * unitHeight),
					width: Math.round(unitWidth - self.config.style.barPadding),
					left: (i === 0) ? Math.round(unitWidth * i) : Math.round((unitWidth * i) + self.config.style.barPadding)
				}

			// space bars evenly to avoid weird spacing
			if(lastBarEndpoint && position.left > (lastBarEndpoint + self.config.style.barPadding)){
				var delta = position.left - (lastBarEndpoint + self.config.style.barPadding);
				
				if(delta > 0){
					position.left = lastBarEndpoint + self.config.style.barPadding;
					position.width += delta;
				}
			}

			lastBarEndpoint = position.left + position.width;

			// set styles
			self.graphContext.fillStyle = self.config.style.barColor;

			// draw that shit
			if(dataPoint > 0){
				self.graphContext.fillRect(
					position.left,
					self.canvas.height - position.height,
					position.width,
					position.height
				);
			}
		}

		// update range selector
		self.updateRange();

		// throw dataset to DOM for use later
		self.$el.data("data",self.data);

		// we done
		self.completed();
	}

	Plot.prototype.drawLineGraph = function(){
		var self = this,
			notations = [],
			points = [],
			maxUnits, minUnits, unitWidth, unitHeight, image;

		// get data min/max
		for(var i = 0; i < self.data.length; i++){
			if(self.data[i][1] > maxUnits || typeof maxUnits === "undefined"){
				maxUnits = self.data[i][1];
			}
			if(self.data[i][1] < minUnits || typeof minUnits === "undefined"){
				minUnits = self.data[i][1];
			}
		}

		// set chart measurement units
		self.grid.unitWidth = self.canvas.width / (self.data.length - 1);
		self.grid.units = Math.ceil(maxUnits * 1.1);
		self.grid.unitHeight = self.canvas.height / self.grid.units;

		// define points
		for(var d = 0; d < self.data.length; d++){
			var point = {
				data: self.data[d],
				left: d * self.grid.unitWidth,
				top: self.canvas.height - (self.data[d][1] * self.grid.unitHeight)
			}
			points.push(point);

			// grab notations if they exist
			if(self.data[d][2]){
				self.data[d][2] = {
					left: Math.round(point.left),
					top: Math.round(point.top),
					text: self.data[d][2]
				};

				notations.push(self.data[d]);
			}
		}

		// store notations
		if(notations.length){
			self.notations = notations;
		}

		// draw grid
		if(self.config.grid.show){
			self.drawGrid();
		}

		function drawChart(){

			// set graph styles
			self.graphContext.lineWidth = self.config.style.lineWidth;
			self.graphContext.lineJoin = "round";
			self.graphContext.strokeStyle = self.config.style.lineColor;

			// set line fill
			if(self.config.style.lineFillColor){
				self.graphContext.fillStyle = self.config.style.lineFillColor;
			}
			// lineFillImage overrides lineFillColor (i mean why not right?)
			if(self.config.style.lineFillImage){
				self.graphContext.fillStyle = self.graphContext.createPattern(image, "repeat-x");
			}

			// begin drawing line
			self.graphContext.beginPath();

			// draw each point
			for(var p = 0; p < points.length; p++){
				var start, end;

				// for first point (0)
				if(p === 0){
					self.graphContext.moveTo(-1, points[p].top);
				}

				// for points between 0 and n
				if(p > 0 && p < points.length - 1){
					self.graphContext.lineTo(points[p].left, points[p].top);
				}

				// for last point (n)
				if(p === points.length - 1){
					self.graphContext.lineTo(self.canvas.width + 1, points[p].top);

					self.graphContext.lineTo(self.canvas.width + 1, self.canvas.height + 1);
					self.graphContext.lineTo(-1, self.canvas.height + 1);
				}

			}

			// finish drawing line
			self.graphContext.closePath();

			// draw that shit
			self.graphContext.fill();
			self.graphContext.stroke();

			// draw notations
			if(self.config.notations.show && self.notations.length){
				self.clearNotations();

				for(var n = 0; n < self.notations.length; n++){

					// create notation hotspot
					if(self.config.notations.tooltips.show){
						// uses both title attribute and custom data attribute to send title to whatever tooltip plugin
						var dataAttr = {
							"notation-dataset": self.notations[n]
						};

						// add full data point to hotspot for any use case
						dataAttr[self.config.notations.tooltips["dataTag"]] = self.notations[n][2].text;

						// set hotspot style and attributes and throw to DOM
						$("<span>").addClass("notation do-not-alter")
							.css({
								position: "absolute",
								left: (self.config.labels.show) ? Math.round((self.notations[n][2].left - (self.config.style.notationSize / 2) - self.config.style.notationBorderWidth) + self.config.style.labelLeftWidth) : Math.round(self.notations[n][2].left - (self.config.style.notationSize / 2) - self.config.style.notationBorderWidth),
								top: Math.round(self.notations[n][2].top - (self.config.style.notationSize / 2) - self.config.style.notationBorderWidth),
								width: self.config.style.notationSize + (self.config.style.notationBorderWidth * 2),
								height: self.config.style.notationSize + (self.config.style.notationBorderWidth * 2),
								cursor: "pointer",
								"border-radius": "100%"
							})
							.data(dataAttr)
							.attr("title", self.notations[n][2].text)
							.appendTo(self.$el);
					}

					// draw dot!
					self.graphContext.beginPath();

					// set styles for max lolz
					self.graphContext.fillStyle = self.config.style.notationFillColor;
					self.graphContext.strokeStyle = self.config.style.notationBorderColor;

					// lineWidth draws at half the defined size on arcs for some stupid fucking reason, so double it
					// #thanksobama
					self.graphContext.lineWidth = self.config.style.notationBorderWidth * 2;

					// define cirle haha math is hard
					self.graphContext.arc(
						self.notations[n][2].left, // left position
						self.notations[n][2].top, // top position
						self.config.style.notationSize / 2, // radius
						0, // start angle
						2 * Math.PI, // end angle
						false // counter clockwise or something, i don't even know this doesn't make any sense
					);

					// draw that shit
					self.graphContext.fill();
					self.graphContext.stroke();
				}
			}

			// we done
			self.completed();

		};

		// draw chart
		if(self.config.style.lineFillImage){

			// create image element
			image = new Image();

			// set src
			image.src = self.config.style.lineFillImage;

			image.onload = function(){
				drawChart();
			}

		}else{

			drawChart();

		}

		// update range selector
		self.updateRange();

		// throw dataset to DOM for use later
		self.$el.data("data",self.data);

	}

	Plot.prototype.drawGrid = function(){
		var self = this;

		// canvas draws lines in the dumbest fucking way imaginable - between pixels, causing funky alisaing to happen
		// fix by offsetting lines by half a pixel to tell the canvas to draw between pixels which actually makes it draw on a full pixel which makes my brain hurt
		// whiskey.
		var lineOffset = 0.5;

		// I hope you like these snarky comments, because it turns out IE <= 10 doesn't support setLineDash() in canvas!
		// To fix, extend prototype of CanvasRenderingContext2D with a new dashedLine method, then jump off a very tall building.
		// use like this: context.dashedLine(x1, y1, x2, y2, dashLength);
		CanvasRenderingContext2D.prototype.dashedLine = function (x1, y1, x2, y2, dashLength) {
			if(dashLength == undefined){
				dashLength = 2;
			}

			this.moveTo(x1, y1);

			var dX = x2 - x1;
			var dY = y2 - y1;
			var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLength);
			var dashX = dX / dashes;
			var dashY = dY / dashes;

			var q = 0;

			while (q++ < dashes){
				x1 += dashX;
				y1 += dashY;
				this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
			}
			this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
		};

		// start drawing vertical grid lines
		self.graphContext.beginPath();

		// set styles
		self.graphContext.strokeStyle = self.config.style.gridColor;
		self.graphContext.lineWidth = self.config.grid.ySize;

		if(self.config.grid.ySize > 0){
			// do some complicated shit
			if(self.config.grid.yInterval){
				for(var i = 0; i < (self.data.length / self.config.grid.yInterval); i++){

					if(i > 0){
						if(self.config.style.gridLineStyleY === "dotted"){
							self.graphContext.dashedLine(
								Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval) + lineOffset,
								0,
								Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval) + lineOffset,
								self.canvas.height,
								2
							);
						}else{
							self.graphContext.moveTo(Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval) + lineOffset, 0);
							self.graphContext.lineTo(Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval) + lineOffset, self.canvas.height);
						}
					}

				}
			}else{
				var yLineInterval = self.$canvas.width() / (self.config.grid.yCount + 1);

				for(var i = 0; i < self.config.grid.yCount + 1; i++){

					if(i > 0){
						if(self.config.style.gridLineStyleY === "dotted"){
							self.graphContext.dashedLine(
								Math.ceil(i * yLineInterval) + lineOffset,
								0,
								Math.ceil(i * yLineInterval) + lineOffset,
								self.canvas.height,
								2
							);
						}else{
							self.graphContext.moveTo(Math.ceil(i * yLineInterval) + lineOffset, 0);
							self.graphContext.lineTo(Math.ceil(i * yLineInterval) + lineOffset, self.canvas.height);
						}
					}

				}
			}
		}

		// draw that shit
		self.graphContext.stroke();

		// start drawing horizontal grid lines
		self.graphContext.beginPath();

		// set styles
		self.graphContext.strokeStyle = self.config.style.gridColor;
		self.graphContext.lineWidth = self.config.grid.xSize;

		if(self.config.grid.xSize > 0){
			// do some complicated shit
			if(self.config.grid.xInterval){
				for(var i = 0; i < (self.grid.units / self.config.grid.xInterval); i++){

					if(i > 0){
						if(self.config.style.gridLineStyleX === "dotted"){
							self.graphContext.dashedLine(
								0,
								Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval) + lineOffset,
								self.canvas.width,
								Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval) + lineOffset,
								2
							);
						}else{
							self.graphContext.moveTo(0, Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval) + lineOffset);
							self.graphContext.lineTo(self.canvas.width, Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval) + lineOffset);
						}
					}

				}
			}else{
				var xLineInterval = self.$canvas.height() / (self.config.grid.xCount + 1);

				for(var i = 0; i < self.config.grid.xCount + 1; i++){

					if(i > 0){
						if(self.config.style.gridLineStyleX === "dotted"){
							self.graphContext.dashedLine(
								0,
								Math.ceil(i * xLineInterval) + lineOffset,
								self.canvas.width,
								Math.ceil(i * xLineInterval) + lineOffset,
								2
							);
						}else{
							self.graphContext.moveTo(0, Math.ceil(i * xLineInterval) + lineOffset);
							self.graphContext.lineTo(self.canvas.width, Math.ceil(i * xLineInterval) + lineOffset);
						}
					}

				}
			}
		}

		// draw that shit
		self.graphContext.stroke();

	}

	Plot.prototype.drawRange = function(elem, from, to){
		var self = this,
			position = {
				top: 0,
				left: (from < to) ? from : to,
				height: elem.height(),
				width: (from < to) ? Math.abs(to - from) : Math.abs(to - from)
			};

		// clear range canvas
		self.clearRange();

		// draw rectangle
		self.rangeContext.fillStyle = self.config.style.rangeColor;
		self.rangeContext.globalAlpha = self.config.style.rangeOpacity;

		self.rangeContext.fillRect(
			position.left,
			position.top,
			position.width,
			position.height
		);

		// save range
		self.range.from.px = Math.round(position.left);
		self.range.to.px = Math.round(position.width) + self.range.from.px;

		self.range.from.index = self.getIndex(self.range.from.px, self.grid.unitWidth);
		self.range.to.index = self.getIndex(self.range.to.px, self.grid.unitWidth);

		self.range.from.data = self.data[self.range.from.index];
		self.range.to.data = self.data[self.range.to.index];

		// draw handles
		self.rangeContext.globalAlpha = 1;

		if(self.config.style.handleImage){

			var leftImage, rightImage;
			if(self.range.handles.image) {
				leftImage = self.range.handles.image;
				rightImage = self.range.handles.image;
			}
			else if (self.range.handles.leftImage && self.range.handles.rightImage) {
				leftImage = self.range.handles.leftImage;
				rightImage = self.range.handles.rightImage;
			}
			if (leftImage && rightImage) {
				if(position.width > leftImage.width * 2){
					self.range.handles.width = leftImage.width;
					self.range.handles.show = true;

					// place left handle
					self.rangeContext.drawImage(
						leftImage,
						self.range.from.px - Math.round(leftImage.width / 2),
						(position.height / 2) - Math.round(leftImage.height / 2)
					);
					self.range.handles.left = [(self.range.from.px - Math.round(leftImage.width / 2)),(self.range.from.px + Math.round(leftImage.width / 2))];

					// place right handle
					self.rangeContext.drawImage(
						rightImage,
						self.range.to.px - Math.round(rightImage.width / 2),
						(position.height / 2) - Math.round(rightImage.height / 2)
					);
					self.range.handles.right = [(self.range.to.px - Math.round(rightImage.width / 2)),(self.range.to.px + Math.round(rightImage.width / 2))];
				}else{
					self.range.handles.show = true;
				}
			}

		}else{
			if(position.width > self.config.style.handleWidth * 2){
				self.range.handles.width = self.config.style.handleWidth;
				self.range.handles.show = true;

				self.rangeContext.fillStyle = self.config.style.handleColor;

				// place left handle
				self.rangeContext.fillRect(
					self.range.from.px - Math.round(self.config.style.handleWidth / 2),
					(position.height / 2) - Math.round(self.config.style.handleHeight / 2),
					self.config.style.handleWidth,
					self.config.style.handleHeight
				);
				self.range.handles.left = [(self.range.from.px - Math.round(self.config.style.handleWidth / 2)),(self.range.from.px + Math.round(self.config.style.handleWidth / 2))];

				// place right handle
				self.rangeContext.fillRect(
					self.range.to.px - Math.round(self.config.style.handleWidth / 2),
					(position.height / 2) - Math.round(self.config.style.handleHeight / 2),
					self.config.style.handleWidth,
					self.config.style.handleHeight
				);
				self.range.handles.right = [(self.range.to.px - Math.round(self.config.style.handleWidth / 2)),(self.range.to.px + Math.round(self.config.style.handleWidth / 2))];
				
			}else{
				self.range.handles.show = false;
			}
		}
	}

	Plot.prototype.updateInfoBox = function(rect){
		var self = this,
			index = self.getIndex(rect.x, self.grid.unitWidth),
			info, pos;

		point = self.data[index] || self.data[0];

		info = self.config.info.xaxis + ": " + ((typeof point[0] === "object") ? point[0].pretty : point[0]) + ", " + self.config.info.yaxis + ": " + point[1];
		
		self.$info.html(info).show();
	}

	Plot.prototype.hideInfoBox = function(){
		var self = this;

		self.$info.hide();
	}

	Plot.prototype.getIndex = function(pos, unitWidth){
		var self = this,
			index;

		// determine which index is hovered
		if(self.config.type === "bar"){
			index = parseInt(pos / unitWidth);
		}else{
			index = Math.round(pos / unitWidth);
		}

		return index;
	}

	Plot.prototype.updateRange = function(){
		var self = this,
			fromIndex = 0,
			toIndex = 0;

		if(typeof self.range.from.index !== "undefined"){
			for(var i = 0; i < self.data.length; i++){
				if(self.data[i][0] === self.range.from.data[0]){
					fromIndex = i;
				}
				if(self.data[i][0] === self.range.to.data[0]){
					toIndex = i;
				}
			}

			if(toIndex < fromIndex){
				self.clearRange();
				self.$el.removeData("range");
			}

			if(fromIndex !== self.range.from.index || toIndex !== self.range.to.index){

				if(fromIndex < 0){
					fromIndex = 0;
				}
				if(toIndex < 1){
					self.clearRange();
					self.$el.removeData("range");
				}

				self.range.from.px = Math.round(fromIndex * self.grid.unitWidth);
				self.range.to.px = Math.round(toIndex * self.grid.unitWidth);

				self.range.from.index = fromIndex;
				self.range.to.index = toIndex;

				self.range.from.data = self.data[fromIndex];
				self.range.to.data = self.data[toIndex];

				self.drawRange(self.$rangeCanvas, self.range.from.px, self.range.to.px);

				self.returnRange();
				
			}
		}

	}

	Plot.prototype.returnRange = function(){
		var self = this;

		if(typeof self.rangeCallback === "function"){
			self.rangeCallback({from: self.range.from.data, to: self.range.to.data, raw: self.range});
		}
		// self.$el.data("range", self.range);
	}

	Plot.prototype.loadRangeImage = function(){

		var promise = $.Deferred();
		var self = this;
		if (typeof self.config.style.handleImage === 'string') {
			self.range.handles.image = new Image();
			self.range.handles.image.src = self.config.style.handleImage;
			promise.resolve();
		}
		else if (typeof self.config.style.handleImage === 'object') {
			var leftPromise = $.Deferred(),
					rightPromise = $.Deferred();

			self.range.handles.leftImage = new Image();
			self.range.handles.leftImage.onload = function(){
				leftPromise.resolve();
			}
			self.range.handles.leftImage.src = self.config.style.handleImage.left;


			self.range.handles.rightImage = new Image();
			self.range.handles.rightImage.onload = function() {
				rightPromise.resolve();
			}
			self.range.handles.rightImage.src = self.config.style.handleImage.right;

			$.when(leftPromise, rightPromise).then(function() {
				promise.resolve();
			})

		}

		return promise;

	}

	Plot.prototype.rangeEvents = function(){
		var self = this,
			rect = {},
			defineRect = function(){
				// define rect object based on current range
				rect = {
					from: self.range.from.px || null,
					to: self.range.to.px || null,
					width: self.range.to.px - self.range.from.px || null,
					handles: self.range.handles
				}
			};

		defineRect();

		// remove all existing mouse events to prevent duplicate event firing
		self.$el.unbind("mousemove");
		self.$el.unbind("mouseout");
		if(self.rangeContext){
			self.$rangeCanvas.unbind("mousedown");
			self.$rangeCanvas.unbind("mousemove");
			self.$rangeCanvas.unbind("mouseup");
		}

		// get cursor location, determine if a resize or move event is applicable
		self.$el.mousemove(function(e){
			rect.x = e.offsetX;
			rect.y = e.offsetY;

			// so jQuery mousemove returns cursor offsetX and offsetY of child elements, not the element you actually selected...
			// for divs and spans, fix the cursor position calculation
			if($(e.target).is("div, span")){
				var position = $(e.target).position(),
					width = $(e.target).width();

				rect.x = (self.config.style.labelLeftWidth) ? rect.x + position.left - self.config.style.labelLeftWidth : rect.x + position.left;
				rect.y = rect.y + position.top;
			}
			
			// if notation is hovered, set cursor position to the middle of the dot so the info box shows the notation data
			if($(e.target).is(".notation")){
				var position = $(e.target).position(),
					width = $(e.target).width(),
					height = $(e.target).height();

				rect.x = (self.config.style.labelLeftWidth) ? position.left + (width / 2) - self.config.style.labelLeftWidth : position.left + (width / 2);
				rect.y = position.top + (height / 2);
			}

			if(self.config.info.show){
				self.updateInfoBox(rect);
			}

			if(self.rangeContext){
				if(!self.range.status.selecting && !self.range.status.moving && !self.range.status.resizing){
					if(typeof rect.from !== "undefined" && rect.x > rect.handles.left[0] && rect.x < rect.handles.right[1]){
						if(rect.x < rect.handles.left[1]){

							// left range handle is hovered, range is resizable
							self.range.status.resizable = "left";
							self.range.status.movable = false;
							self.$rangeCanvas.css("cursor", "ew-resize");

						}else if(rect.x > rect.handles.right[0]){

							// right range handle is hovered, range is resizable
							self.range.status.resizable = "right";
							self.range.status.movable = false;
							self.$rangeCanvas.css("cursor", "ew-resize");

						}else{

							// range area is hovered, range is movable
							self.range.status.resizable = false;
							self.range.status.movable = true;
							self.$rangeCanvas.css("cursor", "all-scroll");

						}
					}else{

						// range is not resizable or movable
						self.range.status.resizable = false;
						self.range.status.movable = false;
						self.$rangeCanvas.css({cursor: "default"});

					}
				}
			}
		}).mouseout(function(){
			if(self.config.info.show){
				self.hideInfoBox();
			}
		})

		// when selecting the range container, draw a box and send the range to the callback
		if(self.rangeContext){
			self.$rangeCanvas.mousedown(function(e){

				// prevent default action for click, including display of text selection mouse cursor
				e.originalEvent.preventDefault();

				// reset rect object based on current range
				defineRect();

				// add click location to rect object for move actions
				rect.click = {
					pos: e.offsetX,
					from: rect.from,
					to: rect.to
				}

				if(self.range.status.resizable){

					// resize range
					self.$rangeCanvas.mousemove(function(e){
						self.range.status.resizing = true;

						if(self.range.status.resizable === "left"){
							rect.from = e.offsetX;
						}else if(self.range.status.resizable === "right"){
							rect.to = e.offsetX;
						}
						self.$rangeCanvas.css("cursor", "ew-resize");

						self.drawRange(self.$rangeCanvas, rect.from, rect.to);

					}).mouseup(function(e){
						self.range.status.resizing = false;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(self.range.status.resizable){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						self.range.status.selecting = false;
						self.range.status.resizable = false;
						self.range.status.movable = false;
					})

				}else if(self.range.status.movable){

					// move range
					self.$rangeCanvas.mousemove(function(e){
						self.range.status.moving = true;
						
						rect.delta = rect.click.pos - rect.x;

						// if new position is within canvas, redraw range, else set range to appropriate edge
						if((rect.click.from - rect.delta) > 0 && (rect.click.to - rect.delta) < self.canvas.width){

							rect.from = rect.click.from - rect.delta;
							rect.to = rect.click.to - rect.delta;

						}else{

							// if range starts before left edge, push range to left edge
							if((rect.click.from - rect.delta) <= 0){

								rect.from = 0;
								rect.to = rect.from + rect.width;

							}

							// if range ends after right edge, push range to right edge
							if((rect.click.to - rect.delta) >= self.canvas.width){

								rect.from = rect.to - rect.width;
								rect.to = self.canvas.width;

							}
						}

						self.$rangeCanvas.css("cursor", "all-scroll");

						self.drawRange(self.$rangeCanvas, rect.from, rect.to);

					}).mouseup(function(e){
						self.range.status.moving = false;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(self.range.status.movable){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						self.range.status.selecting = false;
						self.range.status.resizable = false;
						self.range.status.movable = false;

					})

				}else{

					// select range
					self.$rangeCanvas.mousemove(function(e){
						e.originalEvent.preventDefault();

						if(!self.range.status.selecting){
							self.range.status.selecting = true;
							rect.from = e.offsetX;
							self.$rangeCanvas.css("cursor", "ew-resize");
						}
						rect.to = e.offsetX;

						self.drawRange(self.$rangeCanvas, rect.from, rect.to);

					}).mouseup(function(e){
						rect.width = self.range.to.px - self.range.from.px;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(self.range.status.selecting){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						self.range.status.selecting = false;
						self.range.status.resizable = false;
						self.range.status.movable = false;
					})
				}
			})
		}

	}

	$.fn.plot = function(data, config, completeCallback, rangeCallback){
		var plot = new Plot(this, data, config, completeCallback, rangeCallback);
		return this;
	}

})(jQuery);