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
					draw: true,
					interval: 10,
					color: "#F0F0F0"
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
		self.grid = {};

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

		self.grid.unitWidth = unitWidth;
		self.grid.unitHeight = unitHeight;
		self.grid.units = heightUnits + 1;
		
		if(self.config.grid.draw){
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

		self.grid.unitWidth = unitWidth;
		self.grid.unitHeight = unitHeight;
		self.grid.units = heightUnits + 1;

		if(self.config.grid.draw){
			self.drawGrid();
		}
		
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

	Plot.prototype.drawGrid = function(){

		var self = this;

		self.graphContext.beginPath();
		self.graphContext.strokeStyle = self.config.grid.color;

		// draw vertical lines
		for(var i = 0; i < (self.data.length / self.config.grid.interval); i++){

			if(i > 0){
				self.graphContext.moveTo(Math.round(i * self.grid.unitWidth * self.config.grid.interval), 0);
				self.graphContext.lineTo(Math.round(i * self.grid.unitWidth * self.config.grid.interval), self.config.height);
			}

		}

		// draw horizontal lines
		for(var i = 0; i < self.grid.units; i++){

			if(i > 0){
				self.graphContext.moveTo(0, Math.round(i * self.grid.unitHeight));
				self.graphContext.lineTo(self.config.width, Math.round(i * self.grid.unitHeight));
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

		self.range.from.index = Math.round(self.range.from.px / self.grid.unitWidth);
		self.range.to.index = Math.round((self.range.to.px / self.grid.unitWidth) - 1);

		self.range.from.data = self.data[self.range.from.index];
		self.range.to.data = self.data[self.range.to.index];

		// draw handles
		if(self.config.rangeStyle.handles.draw){
			self.rangeContext.globalAlpha = 1;

			if(self.config.rangeStyle.handles.image){

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
				if(position.width > self.config.rangeStyle.handles.width * 2){
					self.range.handles.width = self.config.rangeStyle.handles.width;
					self.range.handles.show = true;

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
					
				}else{
					self.range.handles.show = false;
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

				self.range.from.px = Math.round(fromIndex * self.grid.unitWidth);
				self.range.to.px = Math.round(toIndex * self.grid.unitWidth);

				self.range.from.index = fromIndex;
				self.range.to.index = toIndex;

				self.range.from.data = self.data[fromIndex];
				self.range.to.data = self.data[toIndex];

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
					from: self.range.from.px,
					to: self.range.to.px,
					width: self.range.to.px - self.range.from.px,
					handles: self.range.handles
				}
			};

		defineRect();

		// remove all existing mouse events to prevent duplicate event firing
		self.$el.unbind("mousemove");
		self.$rangeCanvas.unbind("mousedown");
		self.$rangeCanvas.unbind("mousemove");
		self.$rangeCanvas.unbind("mouseup");

		// get cursor location, determine if a resize or move event is applicable
		self.$el.mousemove(function(e){
			rect.x = e.offsetX;
			rect.y = e.offsetY;

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
		})

		// when selecting the range container, draw a box and send the range to the callback
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

	$.fn.plot = function(data, config, callback){
		new Plot(this, data, config, callback);
		return this;
	}

})(jQuery);
