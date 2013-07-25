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
				grid: {
					draw: true
				}
			};

		self.config = $.extend({}, defaults, config);
		self.data = data;
		self.$el = $(elem);
		self.$canvas = self.$el.find("canvas.myPlot");
		self.$selectContainer = self.$el.find("div.mySelectContainer");
		self.$select = self.$el.find("div.mySelect");

		if(self.$canvas.length){
			self.clearCanvas();
		}else{
			self.createCanvas();
		}

		self.events();

		if(self.config.style === "bar"){
			self.drawBarGraph();
		}else if(self.config.style === "line"){
			self.drawLineGraph();
		}

		return this;

	}

	Plot.prototype.createCanvas = function(){
		var self = this;

		// create canvas element and range selector divs
		var canvas = $("<canvas>").addClass("myPlot"),
			selectContainer = $("<div>").addClass("mySelectContainer"),
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
		self.$canvas = $("canvas.myPlot");

		selectContainer.attr({
			height: self.config.height,
			width: self.config.width,
			class: self.config.selectClass
		}).css(css).appendTo(self.$el);
		self.$selectContainer = $("div.mySelectContainer");

		self.$el.css({
			width: self.config.width,
			height: self.config.height,
			position: "relative"
		});

		self.context = self.$canvas[0].getContext("2d");
	}

	Plot.prototype.clearCanvas = function(){
		var self = this;

		self.context = self.$canvas[0].getContext("2d");
		self.context.clearRect(0,0,self.config.width,self.config.height);
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

			self.context.fillStyle = self.config.barStyle.barColor;

			if(dataPoint > 0){
				self.context.fillRect(
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
		
		self.context.beginPath();

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
			self.context.strokeStyle = self.config.lineStyle.lineColor;

			if(i == 0){
				self.context.moveTo(position.left, position.top);
			}

			//console.log(i,"drawing line from " + position.left + "," + position.top + " to " + nextPosition.left + "," + nextPosition.top);

			if(dataPoint > 0){
				self.context.lineTo(nextPosition.left, nextPosition.top);
			}
		}

		self.context.stroke();
	}

	Plot.prototype.events = function(){
		var self = this;

		// when selecting the range container, draw a box and send the range to the callback
		self.$selectContainer.mousedown(function(e){
			var css = {
					position: "absolute",
					top: 0,
					left: e.offsetX,
					height: $(this).height()
				};

			if(!self.$select){
				$("<div>").css(css).appendTo($(this));
				self.$select = $("div.mySelect");
			}else{
				$(this).find("div").css(css);
			}

			$(this).mousemove(function(e){
				console.log(e.offsetX, e.offsetY);

				var $el = $(this).find("div"),
					parentOffset = $(this).offset()	,
					offset = $el.offset();

				$el.css({
					width: e.offsetX-offset.left+parentOffset.left,
					background: "green",
					opacity: 0.2,
					border: "1px solid red"
				})
			})
		}).mouseup(function(e){
			console.log(e.offsetX, e.offsetY);
			$(this).unbind("mousemove");
		});

	}

	$.fn.myPlot = function(data, config, callback){
		new Plot(this, data, config, callback);
		return this;
	}

})(jQuery);