(function($) {

	function Plot(elem, data, config, completeCallback, rangeCallback){

		var self = this,
			defaults = {
				"width": 540, // width of canvas
				"height": 300, // height of canvas
				"type": "bar", // "bar" or "line"
				"range": {
					"show": true // show range selection
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
					"notationPopinTextSize": 14, // size of text in notation popin
					"notationPopinPadding": 10, // padding around text in notation popin
					"notationPopinBackground": "#FFFFFF", // background color of notation popin
					"notationPopinBorderColor": "#000000", // border color for notation popin
					"notationPopinColor": "#333333" // text color of notation popin
				}
			};

		self.config = $.extend(true, {}, defaults, config);
		self.data = data;
		self.$el = $(elem);
		self.completeCallback = completeCallback;
		self.rangeCallback = rangeCallback;
		self.grid = {};
		self.range = self.$el.data("range") || {
			from: {},
			to: {},
			handles: {
				left: {},
				right: {}
			}
		};
		self.canvas = {
			position: "absolute",
			width: (self.config.labels.show) ? self.config.width - self.config.style.labelLeftWidth - (self.config.style.borderColor ? 2 : 0) : self.config.width - (self.config.style.borderColor ? 2 : 0),
			height: (self.config.labels.show) ? self.config.height - self.config.style.labelBottomHeight - (self.config.style.borderColor ? 2 : 0) : self.config.height - (self.config.style.borderColor ? 2 : 0),
			left: (self.config.labels.show) ? self.config.style.labelLeftWidth : 0,
			top: 0,
			border: (self.config.style.borderColor ? "1px solid " + self.config.style.borderColor : "none")
		};

		self.defineElements();

		if(self.$canvas.length){
			self.clearGraph();
			if(self.config.labels.show){
				self.clearLabels();
			}
		}else{
			self.createElements();
		}

		if(self.config.style.handleImage){
			self.loadRangeImage();
		}

		self.rangeEvents();

		if(self.config.style.fillImage || self.config.style.fillColor){
			self.drawBackground();
		}

		if(self.config.type === "bar"){
			self.drawBarGraph();
		}else if(self.config.type === "line"){
			self.drawLineGraph();
		}

		if(self.config.labels.show){
			self.createLabels();
		}

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

		if(typeof G_vmlCanvasManager !== "undefined"){
			G_vmlCanvasManager.initElement(self.$canvas[0]);
		}
		self.graphContext = self.$canvas[0].getContext("2d");

		if(self.config.range.show){
			if(typeof G_vmlCanvasManager !== "undefined"){
				G_vmlCanvasManager.initElement(self.$rangeCanvas[0]);
			}
			self.rangeContext = self.$rangeCanvas[0].getContext("2d");
		}
	}

	Plot.prototype.defineElements = function(){
		var self = this;

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
		for(var l = 0; l < self.config.labels.xCount; l++){
			var label = self.data.slice(
					Math.round(
						self.data.length / (
							self.config.labels.xCount / l
						)
					),
					Math.round(
						self.data.length / (
							self.config.labels.xCount / l
						)
					) + Math.floor(
					self.data.length / self.config.labels.xCount
				))[0][0];

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

			if(self.config.type === "line"){

				widthInterval = Math.floor(containerWidth / (labelCount - 1));
				if(x === 0){
					left = 0;
					align = "left";
					width = widthInterval / 2;
				}else if(x === labelCount - 1){
					left = (containerWidth - (containerWidth / (labelCount - 1))) + (widthInterval / 2);
					width = widthInterval / 2;
					align = "right";
				}else{
					left = (containerWidth / (labelCount - 1)) * (x - 1) + (widthInterval / 2);
					align = "center";
					width = widthInterval;
				}
				
			}else{

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

			}

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

		self.rangeContext = self.$rangeCanvas[0].getContext("2d");
		self.rangeContext.clearRect(0,0,self.canvas.width,self.canvas.height);
	}

	Plot.prototype.clearNotations = function(){
		var self = this;

		self.$el.find(".notation").remove();
	}

	Plot.prototype.drawBackground = function(){
		var self = this
			css = {};

		if(self.config.style.fillImage){
			css.background = "url(" + self.config.style.fillImage + ") repeat 0 0";
		}else if(self.config.style.fillColor){
			css.background = self.config.style.fillColor;
		}

		self.$bg.css(css);
	}

	Plot.prototype.completed = function(){
		var self = this;

		if(typeof self.completeCallback === "function"){
			self.completeCallback();
		}
	}

	Plot.prototype.drawBarGraph = function(){
		var self = this,
			maxUnits, minUnits, unitWidth, unitHeight;

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

		for(var i = 0; i < self.data.length; i++){
			var dataPoint = self.data[i][1],
				nextPoint;

			if(typeof self.data[i+1] !== "undefined"){
				nextPoint = self.data[i+1][1];
			}

			var position = {
					height: dataPoint * unitHeight,
					width: unitWidth - self.config.style.barPadding / 2,
					left: (unitWidth * i) + self.config.style.barPadding / 2
				}

			self.graphContext.fillStyle = self.config.style.barColor;

			if(dataPoint > 0){
				self.graphContext.fillRect(
					position.left,
					self.canvas.height - position.height,
					position.width,
					position.height
				);
			}
		}

		self.updateRange();

		self.$el.data("data",self.data);

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
					left: point.left,
					top: point.top,
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

			if(self.config.style.lineFillColor){
				self.graphContext.fillStyle = self.config.style.lineFillColor;
			}

			// lineFillImage overrides lineFillColor
			if(self.config.style.lineFillImage){
				self.graphContext.fillStyle = self.graphContext.createPattern(image, "repeat-x");
			}

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

						dataAttr[self.config.notations.tooltips["dataTag"]] = self.notations[n][2].text;

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

		self.updateRange();

		self.$el.data("data",self.data);

	}

	Plot.prototype.drawGrid = function(){

		var self = this;

		self.graphContext.beginPath();
		self.graphContext.strokeStyle = self.config.style.gridColor;

		// draw vertical lines
		self.graphContext.lineWidth = self.config.grid.ySize;

		if(self.config.grid.ySize > 0){
			if(self.config.grid.yInterval){
				for(var i = 0; i < (self.data.length / self.config.grid.yInterval); i++){

					if(i > 0){
						self.graphContext.moveTo(Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval), 0);
						self.graphContext.lineTo(Math.ceil(i * self.grid.unitWidth * self.config.grid.yInterval), self.canvas.height);
					}

				}
			}else{
				var yLineInterval = self.$canvas.width() / (self.config.grid.yCount + 1);

				for(var i = 0; i < self.config.grid.yCount + 1; i++){

					if(i > 0){
						self.graphContext.moveTo(Math.ceil(i * yLineInterval), 0);
						self.graphContext.lineTo(Math.ceil(i * yLineInterval), self.canvas.height);
					}

				}
			}
		}

		// draw horizontal lines
		self.graphContext.lineWidth = self.config.grid.xSize;

		if(self.config.grid.xSize > 0){
			if(self.config.grid.xInterval){
				for(var i = 0; i < (self.grid.units / self.config.grid.xInterval); i++){

					if(i > 0){
						self.graphContext.moveTo(0, Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval));
						self.graphContext.lineTo(self.canvas.width, Math.ceil(i * self.grid.unitHeight * self.config.grid.xInterval));
					}

				}
			}else{
				var xLineInterval = self.$canvas.height() / (self.config.grid.xCount + 1);

				for(var i = 0; i < self.config.grid.xCount + 1; i++){

					if(i > 0){
						self.graphContext.moveTo(0, Math.ceil(i * xLineInterval));
						self.graphContext.lineTo(self.canvas.width, Math.ceil(i * xLineInterval));
					}

				}
			}
		}

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

			if(position.width > self.range.handles.image.width * 2){
				self.range.handles.width = self.range.handles.image.width;
				self.range.handles.show = true;

				// place left handle
				self.rangeContext.drawImage(
					self.range.handles.image,
					self.range.from.px - Math.round(self.range.handles.image.width / 2),
					(position.height / 2) - Math.round(self.range.handles.image.height / 2)
				);
				self.range.handles.left = [(self.range.from.px - Math.round(self.range.handles.image.width / 2)),(self.range.from.px + Math.round(self.range.handles.image.width / 2))];

				// place right handle
				self.rangeContext.drawImage(
					self.range.handles.image,
					self.range.to.px - Math.round(self.range.handles.image.width / 2),
					(position.height / 2) - Math.round(self.range.handles.image.height / 2)
				);
				self.range.handles.right = [(self.range.to.px - Math.round(self.range.handles.image.width / 2)),(self.range.to.px + Math.round(self.range.handles.image.width / 2))];
			}else{
				self.range.handles.show = true;
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
			self.rangeCallback({from: self.range.from.data, to: self.range.to.data});
		}
		self.$el.data("range", self.range);
	}

	Plot.prototype.loadRangeImage = function(){
		var self = this;

		self.range.handles.image = new Image();
		self.range.handles.image.src = self.config.style.handleImage;

	}

	Plot.prototype.rangeEvents = function(){
		var self = this,
			selecting = false,
			resizable = false,
			resizing = false,
			movable = false,
			moving = false,
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

			if(self.config.info.show){
				self.updateInfoBox(rect);
			}

			if(self.rangeContext){
				if(!selecting && !moving && !resizing){
					if(typeof rect.from !== "undefined" && rect.x > rect.handles.left[0] && rect.x < rect.handles.right[1]){
						if(rect.x < rect.handles.left[1]){

							// left range handle is hovered, range is resizable
							resizable = "left";
							movable = false;
							self.$rangeCanvas.css("cursor", "ew-resize");

						}else if(rect.x > rect.handles.right[0]){

							// right range handle is hovered, range is resizable
							resizable = "right";
							movable = false;
							self.$rangeCanvas.css("cursor", "ew-resize");

						}else{

							// range area is hovered, range is movable
							resizable = false;
							movable = true;
							self.$rangeCanvas.css("cursor", "all-scroll");

						}
					}else{

						// range is not resizable or movable
						resizable = false;
						movable = false;
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

				if(resizable){

					// resize range
					self.$rangeCanvas.mousemove(function(e){
						resizing = true;

						if(resizable === "left"){
							rect.from = e.offsetX;
						}else if(resizable === "right"){
							rect.to = e.offsetX;
						}
						self.$rangeCanvas.css("cursor", "ew-resize");

						self.drawRange(self.$rangeCanvas, rect.from, rect.to);

					}).mouseup(function(e){
						resizing = false;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(resizable){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						selecting = false;
						resizable = false;
						movable = false;
					})

				}else if(movable){

					// move range
					self.$rangeCanvas.mousemove(function(e){
						moving = true;
						
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
						moving = false;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(movable){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						selecting = false;
						resizable = false;
						movable = false;

					})

				}else{

					// select range
					self.$rangeCanvas.mousemove(function(e){
						e.originalEvent.preventDefault();

						if(!selecting){
							selecting = true;
							rect.from = e.offsetX;
							self.$rangeCanvas.css("cursor", "ew-resize");
						}
						rect.to = e.offsetX;

						self.drawRange(self.$rangeCanvas, rect.from, rect.to);

					}).mouseup(function(e){
						rect.width = self.range.to.px - self.range.from.px;

						self.$rangeCanvas.unbind("mousemove");
						self.$rangeCanvas.unbind("mouseup");

						if(selecting){
							self.returnRange();
						}

						self.$rangeCanvas.css({cursor: "default"});

						selecting = false;
						resizable = false;
						movable = false;
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