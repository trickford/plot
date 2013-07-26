(function($) {

	function Plot(elem, data, config, callback){

		var self = this,
			defaults = {
				width: 540, // width of canvas
				height: 300, // height of canvas
				style: "bar",
				barStyle: {
					hPadding: 2, // padding around
					barColor: "#FF9900"
				},
				lineStyle: {
					lineColor: "#FF9900"
				},
				rangeStyle: {
					color: "#E5E5E5",
					opacity: 0.5
				},
				grid: {
					draw: true
				},
				classes: {
					graph: "plot",
					range: "range"
				}
			};

		self.config = $.extend({}, defaults, config);
		self.data = data;
		self.$el = $(elem);
		self.callback = callback;

		self.defineElements();

		if(self.$canvas.length){
			self.clearGraph();
		}else{
			self.createCanvas();
		}

		if(typeof self.range === "undefined"){
			self.range = {
				from: {},
				to: {}
			}
		}

		self.rangeEvents();

		if(self.config.style === "bar"){
			self.drawBarGraph();
		}else if(self.config.style === "line"){
			self.drawLineGraph();
		}

		return this;

	}

	Plot.prototype.defineElements = function(){
		var self = this;

		self.$canvas = self.$el.find("canvas." + self.config.classes.graph);
		self.$rangeCanvas = self.$el.find("canvas." + self.config.classes.range);
	}

	Plot.prototype.createCanvas = function(){
		var self = this;

		// create canvas element and range selector divs
		var canvas = $("<canvas>").addClass(self.config.classes.graph),
			rangeCanvas = $("<canvas>").addClass(self.config.classes.range),
			css = {
				position: "absolute",
				top: 0,
				left: 0,
				height: self.config.height,
				width: self.config.width
			}

		// create canvas and set dimensions
		canvas.attr({
			height: self.config.height,
			width: self.config.width
		}).css(css).appendTo(self.$el);

		// create range container and set dimensions and positioning
		rangeCanvas.attr({
			height: self.config.height,
			width: self.config.width
		}).css(css).appendTo(self.$el);

		// set dimensions of parent container
		self.$el.css({
			width: self.config.width,
			height: self.config.height,
			position: "relative"
		});

		self.defineElements();

		self.graphContext = self.$canvas[0].getContext("2d");
		self.rangeContext = self.$rangeCanvas[0].getContext("2d");
	}

	Plot.prototype.clearGraph = function(){
		var self = this;

		self.graphContext = self.$canvas[0].getContext("2d");
		self.graphContext.clearRect(0,0,self.config.width,self.config.height);
	}

	Plot.prototype.clearRange = function(){
		var self = this;

		self.rangeContext = self.$rangeCanvas[0].getContext("2d");
		self.rangeContext.clearRect(0,0,self.config.width,self.config.height);
	}

	Plot.prototype.drawBarGraph = function(){
		var self = this,
			heightUnits = 0,
			unitWidth, unitHeight;

		// get data max
		for(var i = 0; i < self.data.length; i++){
			if(self.data[i][1] > heightUnits){
				heightUnits = self.data[i][1];
			}
		}

		// set chart measurement units
		unitWidth = self.config.width / self.data.length;
		unitHeight = (self.config.height / (heightUnits + 1));

		self.range.unitWidth = unitWidth;

		for(var i = 0; i < self.data.length; i++){
			var dataPoint = self.data[i][1],
				nextPoint;

			if(typeof self.data[i+1] !== "undefined"){
				nextPoint = self.data[i+1][1];
			}

			var position = {
					height: dataPoint * unitHeight,
					width: Math.round(unitWidth - self.config.barStyle.hPadding),
					left: Math.round(unitWidth * i)
				}

			self.graphContext.fillStyle = self.config.barStyle.barColor;

			if(dataPoint > 0){
				self.graphContext.fillRect(
					position.left,
					self.config.height - position.height,
					position.width,
					position.height
				);
			}
		}

	}

	Plot.prototype.drawLineGraph = function(){
		var self = this,
			heightUnits = 0,
			unitWidth, unitHeight;

		// get data max
		for(var i = 0; i < self.data.length; i++){
			if(self.data[i][1] > heightUnits){
				heightUnits = self.data[i][1];
			}
		}

		// set chart measurement units
		unitWidth = self.config.width / self.data.length;
		unitHeight = (self.config.height / (heightUnits + 1));

		self.range.unitWidth = unitWidth;
		
		self.graphContext.beginPath();

		for(var i = 0; i < self.data.length; i++){
			var dataPoint = self.data[i][1],
				nextPoint;

			if(typeof self.data[i+1] !== "undefined"){
				nextPoint = self.data[i+1][1];
			}

			var position = {
					top: self.config.height - (dataPoint * unitHeight),
					left: Math.round(unitWidth * i)
				},
				nextPosition = {
					top: self.config.height - (nextPoint * unitHeight),
					left: Math.round(unitWidth * (i + 1))
				}
			self.graphContext.strokeStyle = self.config.lineStyle.lineColor;

			if(i == 0){
				self.graphContext.moveTo(position.left, position.top);
			}

			if(dataPoint > 0){
				self.graphContext.lineTo(nextPosition.left, nextPosition.top);
			}
		}

		self.graphContext.stroke();
	}

	Plot.prototype.drawRange = function(elem, from, to){
		var self = this,
			position = {
				top: 0,
				left: from,
				height: elem.height(),
				width: to - from
			}

		self.clearRange();

		self.rangeContext.fillStyle = self.config.rangeStyle.color;
		self.rangeContext.globalAlpha = self.config.rangeStyle.opacity;

		self.rangeContext.fillRect(
			position.left,
			position.top,
			position.width,
			position.height
		);

		self.range.position = position;

		self.calculateRange();

		if(self.config.rangeStyle.handles){
			console.log("handles!");
		}
	}

	Plot.prototype.calculateRange = function(){
		var self = this;

		self.range.from.index = Math.round(self.range.position.left / self.range.unitWidth);
		self.range.to.index = Math.round(self.range.position.width / self.range.unitWidth) + self.range.from.index;

		self.range.from.data = self.data[self.range.from.index];
		self.range.to.data = self.data[self.range.to.index];
	}

	Plot.prototype.returnRange = function(){
		var self = this;

		if(typeof self.callback === "function"){
			self.callback({from: self.range.from.data, to: self.range.to.data});
		}
	}

	Plot.prototype.rangeEvents = function(){
		var self = this,
			rectFrom, rectTo;

		// when selecting the range container, draw a box and send the range to the callback
		self.$rangeCanvas.mousedown(function(e){
			self.clearRange();

			rectFrom = e.offsetX;

			$(this).mousemove(function(e){
				rectTo = e.offsetX;

				self.drawRange($(this), rectFrom, rectTo);
			})
		}).mouseup(function(e){
			rectTo = e.offsetX;

			self.drawRange($(this), rectFrom, rectTo);

			$(this).unbind("mousemove");

			self.returnRange();
		})

	}

	$.fn.plot = function(data, config, callback){
		new Plot(this, data, config, callback);
		return this;
	}

})(jQuery);
