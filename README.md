# thunder
A framework for applications built on top of jQuery.

## Getting started

Thunder requires jquery-1.x.

```html
<script src="jquery-1.12.2.min.js"></script>
<script src="thunder-1.0.9.js"></script>
```

## Hello World!

Define a single top level element for the application.

```html
<html>
  <head>
    <title>Thunder: Hello World!</title>
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0;">  
  </head>
  <body style="margin-top:0px; margin-left:0px;">
  	<div style="position:relative;">
    	<div id="root" style="width: 320px; height: 416px; position:absolute; top:0px, left:0px; background-color:#CCCCCC"></div>
    </div>    
  </body>
</html>
```

Thunder components have the following flow:
* Add assets to the assetManager
* Add layers to the layerManager
* Add Customizers for asset types
* Add Responders for events
* Get assets and place them on a layer

```js
Thunder.DEBUG = true;

$(document).ready(function () {
  var App = new Application($("#root"));
});


var Application = Thunder.Component.extend({			
	init: function(initRootElement) {
		this._super(initRootElement);
			
		//Initialize assets
		this.assetManager.addAsset("gui","html",null,"BG",10,10,640,480);
		
		//Initialize layers
		this.layerManager.addLayer("/BG");
				
		//start
		this.drawMainInterface();
	},
	
	drawMainInterface: function() {
		this.addCustomizer("html",function(asset) {
			asset.container.html("<div>Hello World!</div>");
		});
		
		this.layerManager.layOut(this.assetManager.getAssets("gui","html"),"/BG");
	}
});
```

## Assets

Assets are best defined as anything managed by the given component. 

```js
this.assetManager.addAsset("gui","img","clouds.jpg","BG",0,0,320,416);
```

Once added to a component's asset manager object, they can be quickly retrieved by group, type or tag.

```js
this.assetManager.getAssets("gui","img");
```

## Layers

Layers are containers for assets that have a screen representation. Add layers to the layer manager by specifying a path.

```js
this.layerManager.addLayer("/BG");
this.layerManager.addLayer("/BOARD");
```

Add assets to a layer by using the layOut or addToLayOut functions.

```js
this.layerManager.layOut(this.assetManager.getAssets("gui","btn"),"/BOARD");
```

## Customizers

Customizers are applied to assets after they have been added to layer.

```js
this.addCustomizer("img", function(asset) {
	asset.container.html("<img src='" + asset.src + "'>");
});
```

Use customizers to map events to the component's event queue:

```js
this.addCustomizer("btn", function(asset) {
	asset.container.html("<img class='empty' src='" + asset.src + "' style='cursor:hand;cursor:pointer'>");
	asset.mapEvents(t.eventQueue);
});
```

## Responders

Use responders to define event handlers. 

```js
this.addResponder("MOUSEUP", function(event) {	
	switch(event.owner.type) {
		case "btn":
			event.owner.unMapEvents();
			event.owner.container.html("<img src='x.png'>");
			t.gameBoard[event.owner.param] = t.PLAYER;
			
			if(t.handleVictory(t.checkVictory())) {
				t.reset(); 
			} else {
				t.handleComputerMove();
			}
			break;
	}
});
```