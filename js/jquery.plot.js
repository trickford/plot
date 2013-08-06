(function($) {

	function Plot(elem, data, config, callback){

		var self = this,
			defaults = {
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
					"xaxis": "Time", // x-axis info description
					"yaxis": "TPM" // y-axis into description
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
			};

		self.config = $.extend(true, {}, defaults, config);
		self.data = data;
		self.$el = $(elem);
		self.callback = callback;
		self.range = self.$el.data("range");
		self.grid = {},
		self.canvas = {
			position: "absolute",
			width: (self.config.labels.show) ? self.config.width - self.config.style.labelLeftWidth - 2 : self.config.width - 2,
			height: (self.config.labels.show) ? self.config.height - self.config.style.labelBottomHeight - 2 : self.config.height - 2,
			left: (self.config.labels.show) ? self.config.style.labelLeftWidth : 0,
			top: 0,
			border: "solid 1px " + self.config.style.border
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

		if(self.config.style.handleImage){
			self.loadRangeImage();
		}

		self.rangeEvents();

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

	Plot.prototype.defineElements = function(){
		var self = this;

		self.$canvas = self.$el.find("canvas." + self.config.classes.graph);
		self.$rangeCanvas = self.$el.find("canvas." + self.config.classes.range);
		self.$labelLeft = self.$el.find("div." + self.config.classes.label + "-left");
		self.$labelBottom = self.$el.find("div." + self.config.classes.label + "-bottom");
		self.$info = self.$el.find("div." + self.config.classes.info);
	}

	Plot.prototype.createLabels = function(){
		var self = this;

		var leftMin, leftMax, bottomMin, bottomMax;
			
		if(self.config.labels.xaxis === "time"){
			bottomMin = self.convertTime(self.data[0][0]);
			bottomMax = self.convertTime(self.data[self.data.length - 1][0]);
		}else{
			bottomMin = self.data[0][0];
			bottomMax = self.data[self.data.length - 1][0];
		}

		// create left labels
		$("<span>").addClass(self.config.classes.label).css({
			position: "absolute",
			top: 0,
			right: 2,
			"font-size": self.config.style.labelTextSize
		}).appendTo(self.$labelLeft).html(self.grid.units.max);

		$("<span>").addClass(self.config.classes.label).css({
			position: "absolute",
			bottom: 0,
			right: 2,
			"font-size": self.config.style.labelTextSize
		}).appendTo(self.$labelLeft).html(self.grid.units.min);

		// create bottom labels
		$("<span>").addClass(self.config.classes.label).css({
			position: "absolute",
			top: 2,
			left: 0,
			"font-size": self.config.style.labelTextSize
		}).appendTo(self.$labelBottom).html(bottomMin);

		$("<span>").addClass(self.config.classes.label).css({
			position: "absolute",
			top: 2,
			right: 0,
			"font-size": self.config.style.labelTextSize
		}).appendTo(self.$labelBottom).html(bottomMax);

	}

	Plot.prototype.clearLabels = function(){
		var self = this;

		self.$labelLeft.html("");
		self.$labelBottom.html("");
	}

	Plot.prototype.createElements = function(){
		var self = this;

		// create canvas element and range selector divs
		var canvas = $("<canvas>").addClass(self.config.classes.graph),
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

		self.graphContext = self.$canvas[0].getContext("2d");
		self.rangeContext = self.$rangeCanvas[0].getContext("2d");
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
		self.grid.units = {
			max: maxUnits + 1,
			min: minUnits,
			total: ((Math.abs(maxUnits) + Math.abs(minUnits) + 1))
		}
		
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
					width: Math.round(unitWidth - self.config.style.barPadding),
					left: Math.round(unitWidth * i)
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
	}

	Plot.prototype.drawLineGraph = function(){
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
		self.grid.units = {
			max: maxUnits + 1,
			min: minUnits,
			total: ((Math.abs(maxUnits) + Math.abs(minUnits) + 1))
		}

		if(self.config.grid.show){
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
					top: self.canvas.height - (dataPoint * unitHeight),
					left: Math.round(unitWidth * i)
				},
				nextPosition = {
					top: self.canvas.height - (nextPoint * unitHeight),
					left: Math.round(unitWidth * (i + 1))
				}
			self.graphContext.strokeStyle = self.config.style.lineColor;

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
		self.graphContext.strokeStyle = self.config.style.gridColor;

		// draw vertical lines
		for(var i = 0; i < (self.data.length / self.config.grid.interval); i++){

			if(i > 0){
				self.graphContext.moveTo(Math.round(i * self.grid.unitWidth * self.config.grid.interval), 0);
				self.graphContext.lineTo(Math.round(i * self.grid.unitWidth * self.config.grid.interval), self.canvas.height);
			}

		}

		// draw horizontal lines
		for(var i = 0; i < self.grid.units.total; i++){

			if(i > 0){
				self.graphContext.moveTo(0, Math.round(i * self.grid.unitHeight));
				self.graphContext.lineTo(self.canvas.width, Math.round(i * self.grid.unitHeight));
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

		self.range.from.index = Math.round(self.range.from.px / self.grid.unitWidth);
		self.range.to.index = Math.round((self.range.to.px / self.grid.unitWidth) - 1);

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
			info, pos;

		point = {
			x: self.data[Math.round(rect.x / self.grid.unitWidth) - 1][0],
			y: self.data[Math.round(rect.x / self.grid.unitWidth) - 1][1],
			i: Math.round(rect.x / self.grid.unitWidth) - 1
		}

		info = self.config.info.xaxis + ": " + self.convertTime(point.x) + ", " + self.config.info.yaxis + ": " + point.y;
		
		self.$info.html(info).show();
	}

	Plot.prototype.hideInfoBox = function(){
		var self = this;

		self.$info.hide();
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
		self.range.handles.image.src = self.config.style.handleImage;

	}

	Plot.prototype.convertTime = function(timestamp){
		var date, hours, minutes, formattedTime;

		// create a new javascript Date object based on the timestamp
		// multiplied by 10000 so that the argument is in milliseconds, not seconds
		date = new Date(timestamp*10000);

		hours = (date.getHours() < 10) ? "0" + date.getHours() : date.getHours();
		minutes = (date.getMinutes() < 10) ? "0" + date.getMinutes() : date.getMinutes();
		// will display time in 10:30 format
		formattedTime = hours + ':' + minutes;

		return formattedTime;
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
		self.$el.unbind("mouseout");
		self.$rangeCanvas.unbind("mousedown");
		self.$rangeCanvas.unbind("mousemove");
		self.$rangeCanvas.unbind("mouseup");

		// get cursor location, determine if a resize or move event is applicable
		self.$el.mousemove(function(e){
			rect.x = e.offsetX;
			rect.y = e.offsetY;

			self.updateInfoBox(rect);

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
		}).mouseout(function(){
			self.hideInfoBox();
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

	$.fn.plot = function(data, config, callback){
		new Plot(this, data, config, callback);
		return this;
	}

})(jQuery);
