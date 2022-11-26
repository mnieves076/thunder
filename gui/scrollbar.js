/*
 *    Thunder Scrollbar
 *
*/

(function(){		
	Thunder.Scrollbar = Thunder.Component.extend({		
		init: function(initRootElement, initName, initAssetManager, initWidth, initHeight, initHorizontal) {
			this._super(initRootElement);
						
			//Initialize properties	
			this.horizontal = (initHorizontal !== null) ? initHorizontal : false;
			
			if(initAssetManager !== null) {
				this.assetManager = initAssetManager;
			} else {
				this.assetManager = this.getScrollbarAssetManager();
			}
			
			this.width = initWidth;
			this.height = initHeight;			
			this.value = 0;
			this.fireUpdateOnSetValue = true;
			this.scrollTimer = null;			
			this.min = 0;
			this.max = 1;
			this.tabSegment = 0;
			this.increment = 10;
			this.rectMouseDownOffSet = null;
			this.dragTab = false;
			this.name = initName;
			this.tag = "PARENT";			
			
			//Initialize layers			
			this.layerManager.addLayer("/GUI");
			
			//Initialize event map
			new Thunder.EventMap(this.container,this,this.eventQueue);
			
			//Initialize window listeners
			var t = this;
			document.addEventListener("mouseup",function(event) { if(t.dragTab) {t.eventQueue.addEvent("WINDOW_MOUSEUP",0,t,event); return false; } });
			document.addEventListener("mousemove",function(event) { if(t.dragTab) {t.eventQueue.addEvent("WINDOW_MOUSEMOVE",0,t,event); return false; } });
			
			//start
			this.drawMainInterface();
		},
		
		drawMainInterface: function() {
			var t = this;
			
			this.addResponder("MOUSEDOWN", function(event) {
				t.trace("SCROLLBAR EVENT: " + event.name + ": " + event.owner.tag);
				
				switch(event.owner.tag) {					
					case "UP": 
						if(t.scrollTimer === null) {
							t.scrollTimer = setInterval(function() {
								t.handleButton(t.increment * -1);
							},20);
						}
						break;
					case "DOWN": 
						if(t.scrollTimer === null) {
							t.scrollTimer = setInterval(function() {
								t.handleButton(t.increment);
							},20);
						}
						break;
					case "RECT":
					case "TAB":
						t.dragTab = true;
						break;
				}
			});
			
			this.addResponder("MOUSEUP", function(event) {
				t.trace("SCROLLBAR EVENT: " + event.name + ": " + event.owner.tag);
				
				if(t.scrollTimer !== null) {
					clearInterval(t.scrollTimer);
					t.scrollTimer = null;
				}
				
				t.dragTab = false;
				
				switch(event.owner.tag) {
					case "UP": 
						t.handleButton(t.increment * -1);	
						break;
					case "DOWN": 
						t.handleButton(t.increment);
						break;
					case "RECT":
						t.dragTab = false;
						
						if(t.horizontal) {	
							t.rectMouseDownOffSet = event.getLocalEventPosition().x;
						} else {
							t.rectMouseDownOffSet = event.getLocalEventPosition().y;
						}
						
						t.handleDrag();
						break;
				}
			});
			
			this.addResponder("MOUSELEAVE", function(event) {
				t.trace("SCROLLBAR EVENT: " + event.name + ": " + event.owner.tag);
				
				switch(event.owner.tag) {
					case "UP": 
					case "DOWN": 
						if(t.scrollTimer !== null) {
							clearInterval(t.scrollTimer);
							t.scrollTimer = null;
						}
						break;
				}
			});
				
			this.addResponder("WINDOW_MOUSEUP", function(event) {
				t.trace("SCROLLBAR EVENT: " + event.name + ": " + event.owner.tag);
				
				if(t.scrollTimer !== null) {
					clearInterval(t.scrollTimer);
					t.scrollTimer = null;
				}
				
				t.dragTab = false;
			});
				
			this.addResponder("WINDOW_MOUSEMOVE", function(event) {		
				t.trace("SCROLLBAR EVENT: " + event.name + ": " + event.owner.tag);
			
				if(t.dragTab) {
					var tabAsset = t.assetManager.getAsset("TAB");
					
					if(t.horizontal) {	
						t.rectMouseDownOffSet = event.getLocalEventPosition().x - (tabAsset.getWidth() / 2);
					} else {
						t.rectMouseDownOffSet = event.getLocalEventPosition().y - (tabAsset.getHeight() / 2);;
					}
					
					t.handleDrag();
				}				
			});
		
			this.addCustomizer("btn", function(asset) {
				asset.attach("<img src='" + asset.src + "' style='cursor:hand;cursor:pointer'/>");
				var em = new Thunder.EventMap(asset.container.firstChild,asset,t.eventQueue);
				
				switch (asset.tag) {
					case "DOWN":
						if(t.horizontal) {
							asset.setPosition(t.width - asset.width,0);
						} else {
							asset.setPosition(0,t.height - asset.height);
						}
						break;
					case "TAB":
						var upAsset = t.assetManager.getAsset("UP");
						
						if(t.horizontal) {
							asset.setPosition(upAsset.getX() + upAsset.getWidth(),0);
						} else {
							asset.setPosition(0,upAsset.getY() + upAsset.getHeight());
						}
						break;
					case "RECT":
						var upAsset = t.assetManager.getAsset("UP");
						var downAsset = t.assetManager.getAsset("DOWN");
						
						if(t.horizontal) {
							asset.width = t.width - (upAsset.getWidth() + downAsset.getWidth());
							asset.setPosition(upAsset.getWidth(),0);
							asset.container.firstChild.style.width = asset.getWidth();
							asset.container.firstChild.style.height = t.height;
						} else {
							asset.height = t.height - (upAsset.getHeight() + downAsset.getHeight());
							asset.setPosition(0,upAsset.getHeight());
							asset.container.firstChild.style.width = t.width;
							asset.container.firstChild.style.height = asset.getHeight();
						}
						break;							
				}
			});
			
			this.layerManager.layOut(this.assetManager.getAssets("gui","btn|mask"),"/GUI");			
			this.setTabSegment();
		},		
		
		handleDrag: function() {
			var rectAsset = this.assetManager.getAsset("RECT");
			var tabAsset = this.assetManager.getAsset("TAB");
			
			if(this.horizontal) {	
				if(this.rectMouseDownOffSet < rectAsset.getX())
					this.rectMouseDownOffSet = rectAsset.getX();
				
				var segment_start = rectAsset.getX(); 
				var segment_end = segment_start + this.tabSegment;
				var tabHalfWidth = tabAsset.getWidth() / 2;
				
				for(var i = this.min; i < this.max; i++) {
					if (this.rectMouseDownOffSet >= (segment_start - tabHalfWidth) && this.rectMouseDownOffSet <= (segment_end + tabHalfWidth)) {
						if(this.value !== i) {
							this.value = i;
							tabAsset.setX(this.rectMouseDownOffSet);
							this.adjustTabPosition();
							this.broadcastEvent("SCROLL_UPDATE");
							return;
						}
					}       
					
					segment_start += this.tabSegment;
					
					if(segment_start >= rectAsset.getWidth())
						segment_start = rectAsset.getWidth();
					
					segment_end = segment_start + this.tabSegment;
				}
			} else {
				if(this.rectMouseDownOffSet < rectAsset.getY())
					this.rectMouseDownOffSet = rectAsset.getY();
				
				var segment_start = rectAsset.getY(); 
				var segment_end = segment_start + this.tabSegment;
				var tabHalfHeight = tabAsset.getHeight() / 2;
				
				for(var i = this.min; i < this.max; i++) {
					if( (this.rectMouseDownOffSet >= (segment_start - tabHalfHeight)) && (this.rectMouseDownOffSet <= (segment_end + tabHalfHeight)) ) {
						if(this.value !== i) {
							this.value = i;
							tabAsset.setY(this.rectMouseDownOffSet);	
							this.adjustTabPosition();								
							this.broadcastEvent("SCROLL_UPDATE");
							return;
						}
					}       
					
					segment_start += this.tabSegment;
					
					if(segment_start >= rectAsset.getHeight())
						segment_start = rectAsset.getHeight();
					
					segment_end = segment_start + this.tabSegment;
				}
			}
			
			if(this.value !== this.max) {
				this.value = this.max;
				this.adjustTabPosition();
				this.broadcastEvent("SCROLL_UPDATE");
			}
		},		
		
		handleButton: function(changeValue) { 	  
			if ( (this.value !== this.max && changeValue > 0) || (this.value !== this.min && changeValue < 0) ) {
				this.value += changeValue;
				
				// constrain value
				if (this.value > this.max) { 
				  this.value = this.max;
				} else if (this.value < this.min) { 
				  this.value = this.min;
				}
			} else {
				return;
			}
			
			var pixels = this.tabSegment * changeValue;				
			var tabAsset = this.assetManager.getAsset("TAB");
			
			if(this.horizontal) {	
				tabAsset.setX(tabAsset.getX() + pixels);
			} else {
				tabAsset.setY(tabAsset.getY() + pixels);
			}
			
			this.adjustTabPosition();  
			this.broadcastEvent("SCROLL_UPDATE");
		},		
		
		setTabSegment: function() {
			if(this.horizontal) {	
		  		this.tabSegment = (this.assetManager.getAsset("RECT").getWidth() - this.assetManager.getAsset("TAB").width) / (this.max - this.min);	
			} else {
				this.tabSegment = (this.assetManager.getAsset("RECT").getHeight() - this.assetManager.getAsset("TAB").height) / (this.max - this.min);
			}
		},		
		
		adjustTabPosition: function() {
			// correct the tab position  
			var rectAsset = this.assetManager.getAsset("RECT");
			var tabAsset = this.assetManager.getAsset("TAB");
			
			if(this.horizontal) {	
				var upperTabConstraint = rectAsset.getX();
				var lowerTabConstraint = (rectAsset.getX() + rectAsset.getWidth()) - tabAsset.getWidth();
				
				if ( (tabAsset.getX() <= upperTabConstraint)) {
					tabAsset.setX(upperTabConstraint);
					this.value = this.min;
				}
				
				if ( (tabAsset.getX() >= lowerTabConstraint)) {
					tabAsset.setX(lowerTabConstraint);
					this.value = this.max;
				}
			} else {
				var upperTabConstraint = rectAsset.getY();
				var lowerTabConstraint = (rectAsset.getY() + rectAsset.getHeight()) - tabAsset.getHeight();
				
				if (tabAsset.getY() <= upperTabConstraint) {
					tabAsset.setY(upperTabConstraint);
					this.value = this.min;
				}
				
				if ( (tabAsset.getY() >= lowerTabConstraint)) {
					tabAsset.setY(lowerTabConstraint);
					this.value = this.max;
				}
			}
		},	
		
		getValue: function() {
			return this.value;
		},		
		
		setValue: function(newValue) {
			if(isNaN(newValue))
				return;
			
			if(this.horizontal) {	
				var upperTabConstraint = this.assetManager.getAsset("RECT").getX();
			} else {
				var upperTabConstraint = this.assetManager.getAsset("RECT").getY();
			}
			
			if(newValue > this.max)
				newValue = this.max;
			
			if(newValue < this.min)
				newValue = this.min;
	
			this.value = newValue;
			
			if(this.scrollTimer === null) {	
				if(this.horizontal) {	
					this.assetManager.getAsset("TAB").setX(upperTabConstraint + (this.value - this.min) * this.tabSegment);
				} else {
					this.assetManager.getAsset("TAB").setY(upperTabConstraint + (this.value - this.min) * this.tabSegment);
				}
			}
			
			this.adjustTabPosition();
					
			if(this.fireUpdateOnSetValue)
				this.broadcastEvent("SCROLL_UPDATE");
		},		
		
		getMin: function() {
			return this.min;
		},		
		
		setMin: function(newMin) {
			this.min = newMin;
			this.setTabSegment();
			
			if(this.value < this.min) {
				this.setValue(this.min);
			} else {
				this.adjustTabPosition();  
			}
		},		
		
		getMax: function() {
			return this.max;
		},		
		
		setMax: function(newMax) {
			this.max = newMax;
			this.setTabSegment();
			
			if(this.value > this.max) {
				this.setValue(this.max);
			} else {
				this.adjustTabPosition();  
			}
		},	
				
		getWidth: function() {
			return this.width;
		},		
		
		getHeight: function() {
			return this.height;
		},			
		
		setWidth: function(newWidth) {
			if(this.width !== newWidth) {
				this.width = newWidth;
				this.drawMainInterface();
			}
		},		
		
		setHeight: function(newHeight) {
			if(this.height !== newHeight) {
				this.height = newHeight;
				this.drawMainInterface();
			}
		},		
		
		setIncrement: function(newIncrement) {
			this.increment = newIncrement;
		},		
		
		getIncrement: function() {
			return increment;
		},		
		
		setFireUpdateOnSetValue: function(newState) {
			this.fireUpdateOnSetValue = newState;
		},		
		
		getScrollbarAssetManager: function() {
			var am = new Thunder.AssetManager();	
			
			am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_rect.png","RECT");
			am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_tab.png","TAB",0,0,16,16);
			
			if(this.horizontal) {				
				am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_left.png","UP",0,0,16,16);
				am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_right.png","DOWN",0,0,16,16);				
			} else {
				am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_up.png","UP",0,0,16,16);
				am.addAsset("gui","btn",Thunder.ROOT + "/gui/images/scroll_down.png","DOWN",0,0,16,16);
			}
			
			return am;
		}
	})
})();