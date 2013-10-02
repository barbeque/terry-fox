var map;
var activeMarkers = [];
var infoWindow = {};
var MAX_FIELDS = 16;
var terryFoxRoute = {};

// At about 620 km they hit the end of NFLD and switch off.
// HACK: Is there a way to get the total polyline length?
var ISLAND_SWITCH_DISTANCE = 620;
var islandRoute = {};
var mainlandRoute = {};

var palette = [
	'#5260e0', '#8A0447', '#F92664', '#EBCF47',	'#47E0EB',
	'#346CD9', '#2DE134', '#E87626', '#529EE0', '#2BEEB9',
	'#00FF79', '#B71100', '#0400C0', '#22CC14',
	'#9DDB00', '#FF9933'
];

function init() {
	$("button").attr('disabled', 'disabled');
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(51.0453246, -114.05810120000001),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI: true
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	var queryString = document.location.hash.substring(1);
	var distances = queryString.split(';');
	infoWindow = new google.maps.InfoWindow({
		size: new google.maps.Size(150, 150)
	});
	
	initializeForm(distances);

	// go for it
	plotTerryFoxRun();

	$("button").removeAttr('disabled');

	if(distances && distances.length > 0) {
		// They asked for it...
		addMarkersFromMenu();
	}
}

function addMarkersFromMenu() {
	if(!islandRoute || !mainlandRoute) {
		return; // Not loaded yet...
	}

	// First, clear.
	clearMarkers();
	// Then, iterate all of the inputs and make pointers.
	for(var i = 0; i < MAX_FIELDS; ++i) {
		var text = $("input[name=form" + i + "]").val();

		if(text.length > 0) {
			if(isNaN(text)) {
				// I dunno, is there some better way?
				makeMarker(islandRoute, 0, 'Team ' + (i + 1) + " - INVALID DISTANCE PROVIDED", '#ff0000');
			}
			else {
				var distanceInKm = parseInt(text);

				// Figure out if they made it off the island or not, and switch routes if so.
				var isOnMainland = (distanceInKm > ISLAND_SWITCH_DISTANCE);
				var route = isOnMainland ? mainlandRoute : islandRoute;
				var relativeDistance = isOnMainland ? (distanceInKm - ISLAND_SWITCH_DISTANCE) : distanceInKm;

				var c;
				if(i < 0 || i > palette.length) {
					// No idea how this'd happen but let's do it up right
					c = '#ff0000';
				}
				else {
					c = palette[i];
				}

				makeMarker(route, relativeDistance, 'Team ' + (i + 1), c);
			}
		}
	}
}

function clearMarkers() {
	for(var i = 0; i < activeMarkers.length; ++i) {
		activeMarkers[i].setMap(null);
	}
	activeMarkers = [];
}

function initializeForm(values) {
	var fields = MAX_FIELDS;
	for(var i = 0; i < fields; ++i) {
		var value = ''
		if(values && values[i]) {
			value = parseInt(values[i]);
		}
		var f = $('<div class="form-pair"><label for="form' + i + '">Team ' + (i + 1) + '</label><input name="form' + i + '" value="' + value + '"></input></div>');

		$(".form-entries").append(f);

		// Isn't there an easier way to do this in jQuery? I could swear there was.
		$("label[for=form" + i + "]").css('background-color', palette[i]);
	}
}

function buildBounds(points) {
	var x = new google.maps.LatLngBounds();
	for(var i = 0; i < points.length; ++i) {
		x.extend(points[i]);
	}
	return x;
}

function defineRoute(points) {
	// Forget directions, let's do poly lines
	islandRoute = new google.maps.Polyline({
		path: points.slice(0,4), // all of NFLD
		strokeColor: '#ff0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	islandRoute.setMap(map);

	mainlandRoute = new google.maps.Polyline({
		path: points.slice(4),
		strokeColor: '#ff0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});
	mainlandRoute.setMap(map);

	// Make a cool dashed line...
	var oceanRoute = new google.maps.Polyline({
		path: [
			points[3], points[4]
		],
		icons: [{
			icon: {
				path: 'M 0,-1 0,1',
				strokeOpacity: 1,
				scale: 4
			},
			offset: '0',
			repeat: '20px'
		}],
		strokeColor: '#0000ff',
		strokeOpacity: 0.5,
		strokeWeight: 1
	});
	oceanRoute.setMap(map);

	var bounds = buildBounds(points);
	var winnipeg = new google.maps.LatLng(49, -97);
	bounds.extend(winnipeg);
	map.fitBounds(bounds);
}

function makeMarker(polyline, distance, teamName, colour) {
	// Create markers and their content
	var content = teamName + " (" + distance + "km)";
	var ll = polyline.GetPointAtDistance(distance * 1000);
	var marker = new google.maps.Marker({
		position: ll,
		map: map,
		title: content,
		icon: {
			path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			fillColor: colour || "red",
			strokeColor: 'black',
			strokeWeight: 1,
			fillOpacity: 1.0,
			scale: 6
		}
	});
	activeMarkers.push(marker);

	// Hook up the info window (duh)
	google.maps.event.addListener(marker, 'click', function() {
		infoWindow.setContent(content);
		infoWindow.open(map, marker);
	});

	return marker;
}

function plotTerryFoxRun() {
	/*locations = [
	'St Johns Newfoundland',
	'Gander Newfoundland',
	'South Brook Junction Newfoundland',
	'Port-Aux-Basques Newfoundland',
	'Sheet Harbour, Nova Scotia',
	'Dartmouth, Nova Scotia',
	'Charlottetown, PEI',
	'Moncton, NB',
	'Bristol, NB',
	'Perth-Andover, NB',
	'Highway 185, QC',
	'Highway 20, QC',
	'Quebec City, QC',
	'Hawkesbury, ON',
	'Ottawa, ON',
	'Millwood, ON',
	'Pickering, ON',
	'Scarborough Civic Centre, ON',
	'Toronto, ON',
	'Hamilton, ON',
	'Gravenhurst, ON',
	'Sudbury, ON',
	'Sault Ste. Marie, ON',
	'Wawa, ON',
	'Terrace Bay, ON',
	'Thunder Bay, ON'];*/

	var pp = [
		new google.maps.LatLng(47.560541, -52.712831),
		new google.maps.LatLng(48.954408, -54.610349),
		new google.maps.LatLng(49.364459, -56.095238),
		new google.maps.LatLng(47.572115, -59.136429),
		new google.maps.LatLng(44.6652059, -63.5677427),
		//new google.maps.LatLng(44.927851, -62.544239), // Dartmouth causes a gross looking cycle, so drop it
		new google.maps.LatLng(44.665206, -63.567743),
		new google.maps.LatLng(46.238240, -63.131070),
		new google.maps.LatLng(46.087817, -64.778231),
		new google.maps.LatLng(46.471094, -67.580683),
		new google.maps.LatLng(46.745812, -67.697772),
		new google.maps.LatLng(47.667044, -68.974032),
		new google.maps.LatLng(48.487694, -68.452152),
		new google.maps.LatLng(46.803283, -71.242796),
		new google.maps.LatLng(45.607126, -74.604189),
		//new google.maps.LatLng(45.421530, -75.697193), // Millwood also causes a cycle
		new google.maps.LatLng(47.683333, -84.5),
		new google.maps.LatLng(43.838412, -79.086758),
		new google.maps.LatLng(43.772924, -79.257565),
		new google.maps.LatLng(43.653226, -79.383184),
		new google.maps.LatLng(43.250021, -79.866091),
		new google.maps.LatLng(44.919643, -79.374183),
		new google.maps.LatLng(46.49, -81.01),
		new google.maps.LatLng(46.521858, -84.346090),
		new google.maps.LatLng(47.992392, -84.771007),
		new google.maps.LatLng(48.784141, -87.096245),
		new google.maps.LatLng(48.380895, -89.247682)
	];
	defineRoute(pp);
}