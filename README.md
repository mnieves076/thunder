# thunder
A framework for applications built on top of jQuery.

## Getting started

Thunder requires jquery-1.x.

```html
<script src="jquery-1.12.2.min.js"></script>
<script src="thunder-1.0.9.js"></script>
```

## Hello world

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
* Get assets and place them on a layer
* Add Customizers for asset types
* Add Responders for events

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