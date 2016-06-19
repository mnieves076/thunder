var Thunder = {};
Thunder.VERSION = "1.0.9";
Thunder.DEBUG = false;
Thunder.ID = 0; //Global used for instance names
Thunder.VERTICAL = 0;
Thunder.HORIZONTAL = 1;

//get Thunder's root directory
var scripts = document.getElementsByTagName("script");
var i = scripts.length;

while(i--){
	var match = scripts[i].src.match(/(^|.*\/)thunder-(.*)\.js$/);
	if(match){ Thunder.ROOT = match[1]; } 
}


/*
 *    BaseObject
 *
 *    Based on work by John Resig
 */


(function(){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

	// The base implementation does nothing
	this.BaseObject = function(){};
	
	// Create a new BaseObject that inherits from this class
	BaseObject.extend = function(prop) {
		var _super = this.prototype;
		
		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;
		
		// Copy the properties over onto the new prototype
		for (var name in prop) {
		  // Check if we're overwriting an existing function
		  prototype[name] = typeof prop[name] === "function" &&
			typeof _super[name] === "function" && fnTest.test(prop[name]) ?
			(function(name, fn){
			  return function() {
				var tmp = this._super;
			   
				// Add a new ._super() method that is the same method
				// but on the super-class
				this._super = _super[name];
			   
				// The method only need to be bound temporarily, so we
				// remove it when we're done executing
				var ret = fn.apply(this, arguments);       
				this._super = tmp;
			   
				return ret;
			  };
			})(name, prop[name]) :
			prop[name];
		}
		
		// The dummy class constructor
		function BaseObject() {
		  // All construction is actually done in the init method
		  if ( !initializing && this.init )
			this.init.apply(this, arguments);
		}
		
		// Populate our constructed prototype BaseObject
		BaseObject.prototype = prototype;
		
		// Enforce the constructor to be what we expect
		BaseObject.prototype.constructor = BaseObject;
		
		// And make this class extendable
		BaseObject.extend = arguments.callee;
		
		return BaseObject;
	};
})();

/*
 *    Thunder Object
 *
*/

(function(){		
	Thunder.Object = BaseObject.extend({
		init: function() {
			this.listeners = [];
			this.responders = {};
			this.eventQueue = new Thunder.EventQueue(this,this.handleEvents,0);
		},
		
		handleEvents: function(events) { 
			for(var i = 0, ii = events.length; i < ii; i++) {			
				var responder = this.responders[events[i].name];
				
				if(typeof responder != "undefined") {
					responder.apply(this,[events[i]]);
				}
			}
		},
				
		addListener: function(evtQue) {				
			this.listeners.push(evtQue);
		},		
		
		removeListener: function(evtQue) {
			for(var i = 0, ii = this.listeners.length; i < ii; i++) {
				if(this.listeners[i] === evtQue) {
					this.listeners.splice(i,1);
					return true;
				}
			}
			
			return false;
		},		
		
		removeListeners: function() {
			for(var i = 0, ii = this.listeners.length; i < ii; i++) {
				this.listeners[i] = null;
			}
			
			this.listeners = [];
		},
		
		addResponder: function(eventString,callBackFunction) {
			this.responders[eventString] = callBackFunction;
		},
		
		removeResponder: function(eventString) {
			delete this.responders[eventString];
		},
		
		removeResponders: function() {
			this.responders = {};
		},
		
		broadcastEvent: function(evtName, evtObj, delayMSecs) {
			if(typeof delayMSecs == "undefined") {
				delayMSecs = 0;
			}
			
			for(var i = 0, ii = this.listeners.length; i < ii; i++) {
				this.listeners[i].addEvent(evtName,delayMSecs,this,evtObj);
			}
		},
		
		broadcastUniqueEvent: function(evtName, evtObj, delayMSecs) {
			if(typeof delayMSecs == "undefined") {
				delayMSecs = 0;
			}
			
			for(var i = 0, ii = this.listeners.length; i < ii; i++) {
				this.listeners[i].addUniqueEvent(evtName,delayMSecs,this,evtObj);
			}
		},
		
		trace: function(msg) {
			if(window.console && Thunder.DEBUG) console.log(msg);
		}
	})
})();

/*
 *    Thunder DisplayObject
 *
*/

(function(){		
	Thunder.DisplayObject = Thunder.Object.extend({
		init: function(initRootElement) {
			this._super();
			this.container = initRootElement;
			this.position = new Thunder.Point(0,0);
			this.isVisible = true;
			this.alpha = 1;
			this.width = 0;
			this.height = 0;
			this.eventMap = null;
		},
		
		move: function(xOffset,yOffset) {
			if(this.container !== null) {
				var p = this.container.position();	
				this.container.css("top",p.top + yOffset);	
				this.container.css("left",p.left + xOffset);	
			}
			
			this.position.addValues(xOffset,yOffset);
		},
		
		setPosition: function(newX,newY) {
			if(this.container !== null) {
				this.container.css("top",newY);	
				this.container.css("left",newX);	
			}
			
			this.position.setValues(newX,newY);
		},
		
		getPosition: function() {
			if(this.container !== null) {
				var p = this.container.position();	
				this.position.setValues(p.left,p.top);
			}
			
			return this.position;
		},	
		
		getX: function() {
			return this.position.x;
		},
		
		setX: function(newX) {
			if(this.container !== null)
				this.container.css({left:newX});
				
			this.position.x = newX;
		},
		
		getY: function() {
			return this.position.y;
		},			
		
		setY: function(newY) {
			if(this.container !== null)
				this.container.css({top:newY});
				
			this.position.y = newY
		},
		
		setVisible: function(newState) {
			this.isVisible = newState;
			
			if(this.container !== null) {
				if(this.isVisible) {			
					this.container.css("display","");
				} else {
					this.container.css("display","none");
				}
			}
		},
		
		getVisible: function() {
			return this.isVisible;
		},
		
		setWidth: function(newWidth) {
			if(!isNaN(newWidth)) {
				if(this.container !== null) {
					this.container.width(newWidth);					
				}
				
				this.width = newWidth;
			}
		},
		
		getWidth: function() {
			return this.width;
		},
		
		setHeight: function(newHeight) {
			if(!isNaN(newHeight)) {
				if(this.container !== null) {
					this.container.height(newHeight);					
				}
				
				this.height = newHeight;
			}
		},
		
		getHeight: function() {
			return this.height;
		},
		
		setMask: function(top,right,bottom,left) {
			if(this.container !== null) {
				if(!isNaN(top) && !isNaN(right) && !isNaN(bottom) && !isNaN(left)) {
					this.container.css("clip","rect(" + top + "px," + right + "px," + bottom + "px," + left + "px)");
				}
			}
		},
		
		setAlpha: function(newValue) {
			if(this.container !== null) {
				this.container.css("opacity",newValue);
			}
			
			this.alpha = newValue;
		},
		
		getAlpha: function() {
			return this.alpha;
		},		
		
		setContainer: function(newContainer) {
			this.container = newContainer;	
		},
		
		getContainer: function() {
			return this.container;
		},
		
		rotate: function(degree) {
			this.container.css("rotate",degree + "deg");
			this.container.css("-webkit-transform","rotate(" + degree + "deg)");
			this.container.css("-moz-transform","rotate(" + degree + "deg)");
		},
		
		setZIndex: function(newZIndex) {
			this.container.css("z-index",newZIndex);	
		},
		
		mapEvents: function(eventQueue) {
			if(this.eventMap != null) {
				this.unMapEvents();
			}
			
			this.eventMap = new Thunder.EventMap(this.container,this,eventQueue);
			return this;
		},
		
		unMapEvents: function() {
			if(this.eventMap != null) {
				this.eventMap.unMapEvents();
				return true;
			} else {
				return false;
			}
		},
		
		getEventMap: function() {
			return this.eventMap;
		}
	})
})();

/*
 *    Thunder Component
 *
*/

(function(){		
	Thunder.Component = Thunder.DisplayObject.extend({		
		init: function(initRootElement) {
			this._super(initRootElement);		
			this.customizers = {};
			this.assetManager = new Thunder.AssetManager();
			this.layerManager = new Thunder.LayerManager(this.container,this.handleCustomization,this);			
		},
		
		handleCustomization: function(assetList) {
			for(var i = 0, ii = assetList.length; i < ii; i++) {			
				var customizer = this.customizers[assetList[i].type];
				
				if(typeof customizer != "undefined") {
					customizer.apply(this,[assetList[i]]);
				}
			}
		},
		
		addCustomizer: function(assetType,callBackFunction) {
			this.customizers[assetType] = callBackFunction;
		},
		
		removeCustomizer: function(assetType) {
			delete this.customizers[assetType];
		},
		
		setContainer: function(newContainer) {
			this.container = newContainer;	
			this.layerManager.setContainer(this.container);
		}
	});
})();

/*
 *    Thunder Event
 *
*/

(function(){		
	Thunder.Event = function(initName, delayMSecs, initOwner, initEventObject) {
		this.name = initName;
		this.delay = (new Date()).getTime() + delayMSecs;
		this.owner = initOwner;
		this.eventObject = initEventObject;
	};
	
	Thunder.Event.prototype = {
		getName: function() {
			return this.name;
		},
		
		getLocalEventPosition: function() {
			var t = this.eventObject;
			
			if(typeof this.eventObject.originalEvent.touches != "undefined" 
			|| typeof this.eventObject.originalEvent.changedTouches != "undefined") {
				t = this.eventObject.originalEvent.touches[0] || this.eventObject.originalEvent.changedTouches[0];
			}
			
			var x = t.pageX - this.owner.container.offset().left;
			var y = t.pageY - this.owner.container.offset().top;
			return new Thunder.Point(x,y);
		}
	};
})();

/*
 *    Thunder EventMap
 *
*/

(function(){		
	Thunder.EventMap = function(initContainer, initOwner, initEventQueue) {
		this.container = initContainer;
		this.owner = initOwner;
		this.eventQueue = initEventQueue;
		this.mapEvents();
		
		if(!Thunder.DEBUG) {
			$(document).on("contextmenu",function(e){ return false; }); 
		}
	};
	
	Thunder.EventMap.prototype = {
		mapEvents: function() {
			var t = this;
			this.container.on('mouseup',function(event) { t.eventQueue.addEvent("MOUSEUP",0,t.owner,event); return false;});
			this.container.on('mousedown',function(event) { t.eventQueue.addEvent("MOUSEDOWN",0,t.owner,event); return false;});
			this.container.on('mouseenter',function(event) { t.eventQueue.addEvent("MOUSEENTER",0,t.owner,event); return false;});
			this.container.on('mouseleave',function(event) { t.eventQueue.addEvent("MOUSELEAVE",0,t.owner,event); return false;});
			this.container.on('dblclick',function(event) { t.eventQueue.addEvent("DOUBLECLICK",0,t.owner,event); return false;});	
			this.container.on('touchstart',function(event) { event.preventDefault(); t.eventQueue.addEvent("MOUSEDOWN",0,t.owner,event); return false;});
			this.container.on('touchend',function(event) { event.preventDefault(); t.eventQueue.addEvent("MOUSEUP",0,t.owner,event); return false;});
			this.container.on('tap',function(event) { event.preventDefault(); t.eventQueue.addEvent("MOUSEUP",0,t.owner,event); return false;});
		},
		
		unMapEvents: function() {
			this.container.off('mouseup');
			this.container.off('mousedown');
			this.container.off('mouseenter');
			this.container.off('mouseleave');
			this.container.off('dblclick');
			this.container.off('touchstart');
			this.container.off('touchend');
			this.container.off('tap');
		},
		
		mapMouseMoveEvent: function() {
			var t = this;
			this.container.on('mousemove',function(event) { t.eventQueue.addUniqueEvent("MOUSEMOVE",10,t.owner,event); return false; });	
			this.container.on('touchmove',function(event) { event.preventDefault(); t.eventQueue.addUniqueEvent("MOUSEMOVE",10,t.owner,event); return false; });	
		},
		
		unMapMouseMoveEvent: function() {
			this.container.off('mousemove');	
			this.container.off('touchmove');	
		}
	};
})();


/*
 *    Thunder KeyEventMap
 *
*/

(function(){		
	Thunder.KeyEventMap = function(initContainer,initEventQueue) {
		this.container = initContainer;
		this.eventQueue = initEventQueue;
		this.keyMap = [];
		this.mapKeyEvents();
	};
	
	Thunder.KeyEventMap.prototype = {
		mapKeyEvents: function() {
			var t = this;
						
			this.container.keypress(function(event) {			
				if (event.keyCode) { 
					var k = event.keyCode; 
				} else if(event.which) {
					var k = event.which;
				} else {
					return;
				}
				
				t.onKeyDown(k);
			});
		},		
		
		unMapKeyEvents: function() {		
			this.container.off('keypress');
		},	
	
		mapKey: function(keyCode, eventName) {
			this.keyMap[keyCode] = eventName;
		},		
		
		onKeyDown: function(keyCode) {
			var evtName = this.keyMap[keyCode];
			
			if(typeof evtName != "undefined") {
				this.eventQueue.addEvent(evtName,0,{"keyCode":keyCode});
			} else {
				this.eventQueue.addEvent("KEYUP",0,{"keyCode":keyCode});	
			}
		}
	};
})();

/*
 *    Thunder EventQueue
 *
*/

(function(){		
	Thunder.EventQueue = function(initCallBackObject,initCallBackFunction) {
		this.callBackObject = initCallBackObject;
		this.callBackFunction = initCallBackFunction;
		this.eventList = [];
		this.eventTimer = null;
	};
	
	Thunder.EventQueue.prototype = {
		addEvent: function(eventName, delayMSecs, owner, eventObject) {
			if(!delayMSecs) {
				delayMSecs = 0;	
			}
			
			if (eventName !== null && eventName !== "") {		  
				this.eventList.push(new Thunder.Event(eventName, delayMSecs, owner, eventObject));
				this.exitIdleState();
		  	}
		},
		
		
		addUniqueEvent : function(eventName, delayMSecs, owner, eventObject) {
			this.removeEvent(eventName);
			this.addEvent(eventName, delayMSecs, owner, eventObject);
		},
		
		
		eventInQueue: function(eventName) {
			for(var i = 0, ii = this.eventList.length; i < ii; i++) {
				if(this.eventList[i].name === eventName) {
					return true;
				}
			}
			
			return false;
		},
		
		removeEvent: function(eventName) {		
		  for(var i = 0, ii = this.eventList.length; i < ii; i++) {
			if(this.eventList[i].name === eventName) {
				this.eventList.splice(i,1);
				this.removeEvent(eventName);
				return true;
			}
		  }
		  
		  this.enterIdleState();
		  return false;
		},
			
		
		removeAllEvents: function() {
		  this.eventList = [];
		  this.enterIdleState();
		},
		
		
		getNextEvent: function() {
		  if (this.eventList.length > 0) {
			var evt = this.eventList.shift();
			
			if ((new Date()).getTime() >= evt.delay) {
			  return evt;
			} else {
			  this.eventList.push(evt);
			}
		  } else {
			this.enterIdleState();
		  }
		  
		  return null;
		},
		
		
		getEvents: function() {
			var remainingEventList = [];
			var firingEventList = [];  
			var time = (new Date()).getTime();
			
			for(var i = 0, ii = this.eventList.length; i < ii; i++) {
				if (time >= this.eventList[i].delay) {
					firingEventList.push(this.eventList[i]);
				} else {
					remainingEventList.push(this.eventList[i]);
				}
			}
			
			this.eventList = remainingEventList.concat();			
			this.enterIdleState();		
			return firingEventList;
		},
		
		
		enterIdleState: function() {
			if(this.eventList.length === 0) {
				if(this.eventTimer !== null) {
					clearInterval(this.eventTimer);
					this.eventTimer = null;
				}
				
				return true;
			}
			
			return false;
		},
		
		
		exitIdleState: function() {			
			if(this.eventList.length > 0 && this.eventTimer == null) {
				var t = this;
				this.eventTimer = setInterval(function() {
					t.callBackFunction.apply(t.callBackObject, [t.getEvents()]);									   
				},10);	
			}
		}
	};
})();

/*
 *    Thunder Layer
 *
*/

(function(){		
	Thunder.Layer = Thunder.DisplayObject.extend({		
		init: function(initRootElement,initSurfaceElement,initLayerSetName,initLayerId) {
			this._super(initRootElement);
			this.surface = initSurfaceElement;
			this.layerSetName = initLayerSetName;
			this.layerId = initLayerId;
		},
		
		clear: function() {		
			this.surface.empty();
		},
			
		addAssets: function(assetList) {
			for(var i = 0, ii = assetList.length; i < ii; i++) {
				var newId = "THUNDER_ASSET_" + Thunder.ID++;
				
				var newAsset = $('<div>', {
					"id": newId,
					"class": "THUNDER_ASSET",
					"css": {
						"position": "absolute",
						"top": assetList[i].getY() + "px",
						"left": assetList[i].getX() + "px",
						"width": (typeof assetList[i].width != "undefined") ? assetList[i].width + "px" : "auto",
						"height": (typeof assetList[i].height != "undefined") ? assetList[i].height + "px" : "auto"
					}
				}).appendTo(this.surface);
				
				assetList[i].setContainer(newAsset);
			}
		},
		
		setMask: function(top,right,bottom,left) {
			if(this.container !== null) {
				if(!isNaN(top) && !isNaN(right) && !isNaN(bottom) && !isNaN(left)) {
					//layers use overflow instead of clip
					this.container.css({'width': right,'height': bottom,'overflow':'hidden'});
				}
			}
		}
	})
})();

/*
 *    Thunder LayerManager
 *
*/

(function(){		
	Thunder.LayerManager = function(initContainer, initCallBackFunction, initCallBackObject) {
		this.container = initContainer;
		this.callBackFunction = initCallBackFunction;
		this.callBackObject = initCallBackObject;
		this.layers = {"sets": {},"layer": null};;
		this.index = 0;
	};
	
	Thunder.LayerManager.prototype = {		 
		layOut: function(assetList, path) {
			var layerObj = this.get(path).layer; 
			
			if(layerObj != null) {
				layerObj.clear();
				layerObj.addAssets(assetList);			
				this.callBackFunction.apply(this.callBackObject, [assetList]);
			}
			
			return layerObj;
		},
		
		addToLayOut: function(assetList, path) {
			var layerObj = this.get(path).layer;  
			
			if(layerObj != null) {
				layerObj.addAssets(assetList);
				this.callBackFunction.apply(this.callBackObject, [assetList]);
			}
			
			return layerObj;
		},
		
		getLayerObject: function(path) {
			return this.get(path).layer;
		},
		
		getLayerObjects: function(path) {
			var r = this.get(path);
			
			if(r != null) {
				var layers = (r.layer == null) ? [] : [r.layer];
				layers = layers.concat(this.getChildLayers(r.sets));
				return layers;
			} else {
				return [];
			}
		},		
		
		getChildLayers: function(sets) {
			var layers = [];
			
			for(r in sets) {
				layers.push(sets[r].layer);
				layers = layers.concat(this.getChildLayers(sets[r].sets));
			}
			
			return layers;
		},		
		 
		addLayer: function(path) {		
			var layerId = "THUNDER_LAYER_" + Thunder.ID++;
			var surfaceId = "THUNDER_LAYER_SURFACE_" + Thunder.ID++;
			
			var newSurface = $('<div>', {
				"id": surfaceId,
				"class": "THUNDER_LAYER_SURFACE",
				"css": {
					"position": "absolute",
					"top": "0px",
					"left": "0px"
				}
			});
			
			var newLayer = $('<div>', {
				"id": layerId,
				"class": "THUNDER_LAYER",
				"name": path,
				"css": {
					"position": "absolute",
					"top": "0px",
					"left": "0px"
				}
			});
			
			newSurface.appendTo(newLayer.appendTo(this.container));				
			this.get(path).layer = new Thunder.Layer(newLayer,newSurface,path,layerId);
		},
		
		get: function(path) {
			if(path == "/") {
				return this.layers;
			}
			
			var sets = path.replace(/^\/|\/$/g,'').split("/");
			var x = this.layers.sets;
			var r = null;
			
			for(s in sets) {
				if(!x.hasOwnProperty(sets[s])) {
					x[sets[s]] = {"sets": {},"layer": null};
				}
				
				r = x[sets[s]];
				x = r.sets;
			}
			
			return r;
		},
		
		clearSet: function(path) {
			var layers = this.getLayerObjects(path);
			for(var i = 0, ii = layers.length; i < ii; i++) {
				layers[i].clear();
			}
		},
		 
		clearLayer: function(path) {
			var layerObj = this.get(path);	
			
			if(layerObj != null) {
				layerObj.layer.clear();
			}
		},
		 
		clearAll: function() {
			var layers = this.getChildLayers(this.layers.sets);
			for(var i = 0, ii = layers.length; i < ii; i++) {
				layers[i].clear();
			}
		},
		 
		setLayerSetPosition: function(path, newPosition) {
			var layers = this.getLayerObjects(path);
			for(var i = 0, ii = layers.length; i < ii; i++) {
				layers[i].setPosition(newPosition.x,newPosition.y);
			}
		},
			
		moveLayerSet: function(path, destinationPoint) {
			var layers = this.getLayerObjects(path);
			for(var i = 0, ii = layers.length; i < ii; i++) {
				var newPosition = layers[i].getPosition().addPoint(destinationPoint)
				layers[i].move(newPosition.x,newPosition.y);
			}
		},
		
		setVisible: function(path, visible) {
			var layerObj = this.get(path).layer;	
			
			if(layerObj != null) {
				layerObj.setVisible(visible);
			}
		},
		 
		setLayerMask: function(path,top,right,bottom,left) {
			var layerObj = this.get(path).layer;	
			
			if(layerObj != null) {
				layerObj.setMask(top,right,bottom,left);
			}
		},
		
		setContainer: function(newContainer) {
			this.container.children().appendTo(newContainer);
			this.container = newContainer;
		},
		
		moveToLayer: function(path,container,toRear) {
			var layerObj = this.get(path).layer;
			
			if(layerObj != null) {
				if(toRear) {
					container.appendTo(layerObj.surface).insertBefore(layerObj.surface.find(".THUNDER_ASSET").first());
				} else {
					container.appendTo(layerObj.surface);
				}
				
				return true;
			}
			
			return false;
		}
	};
})();

/*
 *    Thunder Cookie
 *
*/

(function(){		
	Thunder.Cookie = function() {};
	
	Thunder.Cookie.prototype = {
		create: function(name,value,days) {
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				var expires = "; expires="+date.toGMTString();
			}
			else var expires = "";
			document.cookie = name+"="+value+expires+"; path=/";
		},
		
		read: function(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0, ii = ca.length; i < ii; i++) {
				var c = ca[i];
				while (c.charAt(0)===' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		},
		
		erase: function(name) {
			this.create(name,"",-1);
		}
	};
})();

/*
 *    Thunder Point
 *
*/

(function(){		
	Thunder.Point = function(initX, initY) {
		this.x = initX;
		this.y = initY;
	};
	
	Thunder.Point.prototype = {
		addPoint: function(p) {
			this.x += p.x;
			this.y += p.y;
			return this;
		},
		
		addValues: function(_x,_y) {
			this.x += _x;
			this.y += _y;
			return this;
		},
		
		setValues: function(_x,_y) {
			this.x = _x;
			this.y = _y;
			return this;
		},
	
		equals: function(p) {
			if(this.x === p.x && this.y === p.y)
				return true;
		
			return false;
		},
		
		getDistance: function(p2) {
			return Math.sqrt((this.x - p2.x) * (this.x - p2.x) +  (this.y - p2.y) * (this.y - p2.y));	
		},
		
		getAngle: function(p2) {
			var a = 270 + (Math.atan2(this.y - p2.y, this.x - p2.x) * (180 / Math.PI));
			
			if(a > 360) {
				return a - 360;	
			}
			
			return a;
		},
		
		getCopy: function() {
			return new Thunder.Point(this.x, this.y);	
		},
		
		toString: function() {
			return "(" + this.x + "," + this.y + ")";
		}
	};
})();


/*
 *    Thunder Asset
 *
*/

(function(){		
	Thunder.Asset = Thunder.DisplayObject.extend({		
		init: function(initGroup, initType, initSrc, initTag) {
			this._super(null);
			this.group = null;
			this.type = null;
			this.groupArray = [];
			this.typeArray = [];
			this.setGroups(initGroup);
			this.setTypes(initType);
			this.src = initSrc;
			this.tag = initTag;
			this.width = null;
			this.height = null;
			this.param = null;
		},
	
		attach: function(html) {
			if(this.container !== null) {
				this.container.append(html);
			}
		},
		
		getName: function() {
			return this.name;
		},		
		
		setSize: function(newWidth, newHeight) {
			this.width = newWidth;
			this.height = newHeight;
		},	
		
		getWidth: function() {
			return this.width;
		},
		
		getHeight: function() {
			return this.height;
		},
		
		setParam: function(newParam) {
			this.param = newParam;	
		},
		
		setGroups: function(newGroup) {
			if(typeof newGroup == "string") {
				this.group = newGroup;
				this.groupArray = this.group.split("|");
			}
		},
		
		getGroup: function() {
			return this.group;
		},
		
		getGroupArray: function() {
			return this.groupArray;
		},
		
		setTypes: function(newType) {
			if(typeof newType == "string") {
				this.type = newType;
				this.typeArray = this.type.split("|");
			}
		},
		
		getType: function() {
			return this.type;
		},
		
		getTypeArray: function() {
			return this.typeArray;
		}
	})
})();

/*
 *    Thunder AssetManager
 *
*/

(function(){		
	Thunder.AssetManager = function(initGroup, initType, initSrc, initTag) {
		this.assetList = {};
		this.assetTagList = [];
	};
	
	Thunder.AssetManager.prototype = {
		addAsset: function(initGroup, initType, initSrc, initTag, initX, initY, initWidth, initHeight, initParam) {
			var asset = new Thunder.Asset(initGroup, initType, initSrc, initTag);
			
			if(typeof initX != "undefined" && typeof initY != "undefined") {
				asset.setPosition(initX, initY);
			}
			
			asset.setSize(initWidth, initHeight);
			asset.setParam(initParam);
			
			// add groups to assetList if needed
			for(var g = 0, gg = asset.groupArray.length; g < gg; g++) {
				if(typeof this.assetList[asset.groupArray[g]] == "undefined") {
					this.assetList[asset.groupArray[g]] = {};
				}
				
				// add types to group
				for(var t = 0, tt = asset.typeArray.length; t < tt; t++) {
					if(typeof this.assetList[asset.groupArray[g]][asset.typeArray[t]] == "undefined") {
						this.assetList[asset.groupArray[g]][asset.typeArray[t]] = [];
					}
					
					this.assetList[asset.groupArray[g]][asset.typeArray[t]].push(asset);
				}
			}
			
			this.assetTagList[asset.tag] = asset;
			return asset;
		},		
		
		removeAssets: function(group, type) {
			var groupList = [];
			var typeList = [];
			
			if(typeof group != "undefined") {
				groupList = group.split("|");
			}
			
			if(typeof type != "undefined") {
				typeList = type.split("|");
			}
			
			for(var g = 0, gg = groupList.length; g < gg; g++) {
				if(typeof this.assetList[groupList[g]] != "undefined") {
					if(typeList.length == 0) {
						//delete all assets for this group
						for(var t in this.assetList[groupList[g]]) {
							if(typeof t != "undefined") {
								for(var i = 0; i < this.assetList[groupList[g]][t].length; i++) {
									delete this.assetTagList[this.assetList[groupList[g]][t][i].tag];
								}
							}
						}	
						
						delete this.assetList[groupList[g]];
					} else {
						for(var t = 0, tt = typeList.length; t < tt; t++) {					
							var assets = this.assetList[groupList[g]][typeList[t]];
							
							if(typeof assets != "undefined") {
								for(var i = 0, ii = assets.length; i < ii; i++) {
									delete this.assetTagList[assets[i].tag];
								}
							}
							
							delete this.assetList[groupList[g]][typeList[t]];
						}
					}
				}
			}
		},		
			
		removeAsset: function(tag) {				
			var asset = this.assetTagList[tag];
			var result = 0;
			
			if(typeof asset != "undefined") {
				var groups = asset.getGroupArray();
				
				for(var g = 0, gg = groups.length; g < gg; g++) {
					for(var t in this.assetList[groups[g]]) {
						var assets = this.assetList[groups[g]][t];
						
						for(var i = 0; i < assets.length; i++) {  
							if(assets[i].tag === tag) {
								assets.splice(i--,1);
							}
						}
					}
				}
				
				delete this.assetTagList[tag];
				result = 1;
			}
			
			return result;
		},
		
		getAssets: function(group, type) {
			var matchList = [];
			var groupList = [];
			var typeList = [];
			
			if(typeof group != "undefined") {
				groupList = group.split("|");
			}
			
			if(typeof type != "undefined") {
				typeList = type.split("|");
			}
			
			for(var g = 0, gg = groupList.length; g < gg; g++) {
				if(typeof this.assetList[groupList[g]] != "undefined") {
					if(typeList.length == 0) {
						//get all assets for this group					
						for(var t in this.assetList[groupList[g]]) {
							if(typeof t != "undefined") {
								matchList = matchList.concat(this.assetList[groupList[g]][t]);
							}
						}					
					} else {
						for(var t = 0, tt = typeList.length; t < tt; t++) {					
							var assets = this.assetList[groupList[g]][typeList[t]];
							
							if(typeof assets != "undefined") {
								matchList = matchList.concat(assets);
							}
						}
					}
				}
			}
			
			return matchList;
		},	
		
		getAsset: function(tag) {
			var k = this.assetTagList[tag];
				
			if(typeof k != "undefined") {
				return k;
			}
			
			return null;		
		},		
		
		stack: function(_assetList, direction, x, y, offSet) {		
			for(var i = 0, ii = _assetList.length; i < ii; i++) {
				_assetList[i].setX(x);
				_assetList[i].setY(y);
			
				if (direction === Thunder.VERTICAL) {
					x = x;
					y = y + _assetList[i].height + offSet;
				} else if (direction === Thunder.HORIZONTAL) {
					x = x + _assetList[i].width + offSet;
					y = y;
				}       
			} 
			
			return _assetList;
		},
		
		getStackedSize: function(_assetList, direction, offSet) {	
			var d = 0;
			
			for(var i = 0, ii = _assetList.length; i < ii; i++) {			
				if (direction === Thunder.VERTICAL) {
					d += _assetList[i].height + offSet;
				} else if (direction === Thunder.HORIZONTAL) {
					d += _assetList[i].width + offSet;
				}       
			} 
			
			return d;
		}
	};
})();

/*
 *    Thunder XMLDataManager
 *
 */

(function(){		
	Thunder.XMLDataManager = Thunder.Object.extend({	
		init: function(initReadyEvent) {
			this._super();
			this.xml = null;
			this.data = [];
			
			if(initReadyEvent == null) {
				this.readyEvent = "XML_DATA_READY";
			} else {
				this.readyEvent = initReadyEvent;	
			}
		},
		
		load: function(src) {
			var t = this;
			
			$.get(src, function(data) {				
				t.xml = data;
				t.process(t.xml,t.data);
				t.broadcastEvent(t.readyEvent);
			});
		},
		
		parse: function(str) {			
			try {
				this.xml = $.parseXML(str);
			} catch(e) {
				this.xml = null;	
			}
		},
		
		process: function(node, data) {	
			for(var i = 0, ii = node.childNodes.length; i < ii; i++) {	
				switch(node.childNodes[i].nodeName) {					
					default:
						if (node.childNodes[i].nodeType === 3 || node.childNodes[i].nodeType == 4) { //TEXT or CDATA
							var v = $.trim(node.childNodes[i].nodeValue);
							
							if(v.length > 0) {
								data["TEXT"] = v;
							}
						} else if (node.childNodes[i].nodeType == 1) { //ELEMENT
							if(data[node.childNodes[i].nodeName] == null) {
								data[node.childNodes[i].nodeName] = [];
							}
							
							data[node.childNodes[i].nodeName].push([]);
							var iii = data[node.childNodes[i].nodeName].length - 1;
							
							if(node.childNodes[i].hasChildNodes()) {
								this.process(node.childNodes[i],data[node.childNodes[i].nodeName][iii]);
							}
							
							for(var a = 0, aa = node.childNodes[i].attributes.length; a < aa; a++) {
								data[node.childNodes[i].nodeName][iii][node.childNodes[i].attributes[a].name] = node.childNodes[i].attributes[a].value;
							}
						}
				}
			}		
		}
	})
})();