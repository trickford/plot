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
					opacity: 0.5,
					handles: {
						draw: true,
						image: false,
						width: 10,
						height: 40,
						color: "#868695"
					}
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
		self.range = self.$el.data("range");

		self.defineElements();

		if(self.$canvas.length){
			self.clearGraph();
		}else{
			self.createCanvas();
		}

		if(typeof self.range === "undefined"){
			self.range = {
				from: {},
				to: {},
				handles: {
					left: {},
					right: {}
				}
			}
		}

		if(self.config.rangeStyle.handles.image){
			self.loadRangeImage();
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

		self.updateRange();

		self.$el.data("data",self.data);
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

		self.updateRange();

		self.$el.data("data",self.data);
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
		self.rangeContext.fillStyle = self.config.rangeStyle.color;
		self.rangeContext.globalAlpha = self.config.rangeStyle.opacity;

		self.rangeContext.fillRect(
			position.left,
			position.top,
			position.width,
			position.height
		);

		// save range
		self.range.from.px = Math.round(position.left);
		self.range.to.px = Math.round(position.width) + self.range.from.px;

		self.range.from.index = Math.round(position.left / self.range.unitWidth);
		self.range.to.index = Math.round(position.width / self.range.unitWidth) + self.range.from.index;

		self.range.from.data = self.data[self.range.from.index];
		self.range.to.data = self.data[self.range.to.index];

		// draw handles
		if(self.config.rangeStyle.handles.draw){
			self.rangeContext.globalAlpha = 1;

			if(self.config.rangeStyle.handles.image){

				if(position.width > self.range.handles.image.width + 2){

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
				}
			}else{
				if(position.width > self.config.rangeStyle.handles.width + 2){

					self.rangeContext.fillStyle = self.config.rangeStyle.handles.color;

					// place left handle
					self.rangeContext.fillRect(
						self.range.from.px - Math.round(self.config.rangeStyle.handles.width / 2),
						(position.height / 2) - Math.round(self.config.rangeStyle.handles.height / 2),
						self.config.rangeStyle.handles.width,
						self.config.rangeStyle.handles.height
					);
					self.range.handles.left = [(self.range.from.px - Math.round(self.config.rangeStyle.handles.width / 2)),(self.range.from.px + Math.round(self.config.rangeStyle.handles.width / 2))];

					// place right handle
					self.rangeContext.fillRect(
						self.range.to.px - Math.round(self.config.rangeStyle.handles.width / 2),
						(position.height / 2) - Math.round(self.config.rangeStyle.handles.height / 2),
						self.config.rangeStyle.handles.width,
						self.config.rangeStyle.handles.height
					);
					self.range.handles.right = [(self.range.to.px - Math.round(self.config.rangeStyle.handles.width / 2)),(self.range.to.px + Math.round(self.config.rangeStyle.handles.width / 2))];
					
				}
			}
		}
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

			if(fromIndex !== self.range.from.index || toIndex !== self.range.to.index){

				if(fromIndex < 0){
					fromIndex = 0;
				}
				if(toIndex < 1){
					self.clearRange();
					self.$el.removeData("range");
				}

				self.range.from.px = Math.round(fromIndex * self.range.unitWidth) || 0;
				self.range.to.px = Math.round(toIndex * self.range.unitWidth) || 0;

				self.range.from.index = fromIndex || 0;
				self.range.to.index = toIndex || 0;

				self.range.from.data = self.data[fromIndex] || null;
				self.range.to.data = self.data[toIndex] || null;

				self.drawRange(self.$rangeCanvas, self.range.from.px, self.range.to.px);
			}
		}

	}

	Plot.prototype.returnRange = function(){
		var self = this;

		if(typeof self.callback === "function"){
			self.callback({from: self.range.from.data, to: self.range.to.data});
			self.$el.data("range", self.range);
		}
	}

	Plot.prototype.loadRangeImage = function(){
		var self = this;

		self.range.handles.image = new Image();
		self.range.handles.image.src = self.config.rangeStyle.handles.image;

	}

	Plot.prototype.rangeEvents = function(){
		var rect = {},
			selecting = false,
			resizing = false,
			movable = false,
			moving = false,
			self = this;

		// get cursor location, determine if a resize event is applicable
		self.$el.mousemove(function(e){
			rect.x = e.offsetX;
			rect.y = e.offsetY;

			if(!selecting){
				if(e.offsetX > self.range.handles.left[0] && e.offsetX < self.range.handles.left[1]){

					if(!moving){
						resizing = "left";
						movable = false;
						self.$rangeCanvas.css("cursor", "ew-resize");
					}

				}else if(e.offsetX > self.range.handles.right[0] && e.offsetX < self.range.handles.right[1]){

					if(!moving){
						resizing = "right";
						movable = false;
						self.$rangeCanvas.css("cursor", "ew-resize");
					}

				}else if(e.offsetX > self.range.handles.left[1] && e.offsetX < self.range.handles.right[0]){

					if(!moving){
						resizing = false;
						movable = true;
						self.$rangeCanvas.css("cursor", "all-scroll");
					}

				}else{

					resizing = false;
					movable = false;
					self.$rangeCanvas.css({cursor: "default"});

				}
			}
		})

		// when selecting the range container, draw a box and send the range to the callback
		self.$rangeCanvas.mousedown(function(e){
			e.originalEvent.preventDefault();
			rect.width = self.range.to.px - self.range.from.px;
			rect.click = {
				pos: e.offsetX,
				from: rect.from,
				to: rect.to
			};

			if(resizing){

				// resize range
				self.$rangeCanvas.mousemove(function(e){

					if(resizing === "left"){
						rect.from = e.offsetX;
					}else if(resizing === "right"){
						rect.to = e.offsetX;
					}
					self.$rangeCanvas.css("cursor", "ew-resize");

					self.drawRange(self.$rangeCanvas, rect.from, rect.to);

				}).mouseup(function(e){

					self.$rangeCanvas.unbind("mousemove");
					self.$rangeCanvas.unbind("mouseup");

					if(resizing){
						self.returnRange();
					}

					self.$rangeCanvas.css({cursor: "default"});

					selecting = false;
					resizing = false;
					movable = false;
				})

			}else if(movable){

				// resize range
				self.$rangeCanvas.mousemove(function(e){
					moving = true;
					
					rect.delta = rect.click.pos - rect.x;

					// if new position is within canvas, redraw range, else set range to appropriate edge
					if((rect.click.from - rect.delta) > 0 && (rect.click.to - rect.delta) < self.config.width){

						rect.from = rect.click.from - rect.delta;
						rect.to = rect.click.to - rect.delta;

					}else{

						// if range starts before left edge, push range to left edge
						if((rect.click.from - rect.delta) <= 0){

							rect.from = 0;
							rect.to = rect.from + rect.width;

						}

						// if range ends after right edge, push range to right edge
						if((rect.click.to - rect.delta) >= self.config.width){

							rect.from = rect.to - rect.width;
							rect.to = self.config.width;

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
					resizing = false;
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

					self.$rangeCanvas.unbind("mousemove");
					self.$rangeCanvas.unbind("mouseup");

					if(selecting){
						self.returnRange();
					}

					self.$rangeCanvas.css({cursor: "default"});

					selecting = false;
					resizing = false;
					movable = false;
				})
			}
		})

	}

	$.fn.plot = function(data, config, callback){
		new Plot(this, data, config, callback);
		return this;
	}

})(jQuery);
