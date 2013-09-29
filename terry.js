var map;
var activeMarkers = [];
var infoWindow = {};
var MAX_FIELDS = 16;
var terryFoxRoute = {};

// At about 300 km they hit the end of NFLD and switch off.
var ISLAND_SWITCH_DISTANCE = 300;
var islandRoute = {};
var mainlandRoute = {};

// TODO Use this palette when you figure out how to use custom icons.
var palette = [
	'#5260e0', '#8A0447', '#F92664', '#EBCF47',	'#47E0EB',
	'#346CD9', '#2DE134', '#E87626', '#529EE0', '#2BEEB9',
	'#00FF79', '#B71100', '#0400C0', '#22CC14',
	'#9DDB00', '#FF9933'
];

function init() {
	$("button").attr('disabled'	, 'disabled');
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
	// TODO: if they actually provided distances, remember to run the button
	// method after the route plot is done.

	// go for it
	plotTerryFoxRun();

	$("button").removeAttr('disabled');
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
				makePointer(islandRoute, 0, 'Team ' + (i + 1) + " - INVALID DISTANCE PROVIDED", '#ff0000');
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

				makePointer(route, distanceInKm, 'Team ' + (i + 1), c);
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

function routeToPolyLine(route) {
	var legs = route.legs;
	var steps = legs[0].steps;
	var points = [];
	var bounds = new google.maps.LatLngBounds;

	for(var i = 0; i < steps.length; ++i) {
		var point = steps[i].start_location;
		bounds = bounds.extend(point);
		points.push(point);
		// Clean it up real nice.
		if(i == steps.length - 1) {
			point = steps[i].end_location;
			bounds = bounds.extend(point);
			points.push(point);
		}
	}

	var polyLine = new google.maps.Polyline({
		path: points,
		strokeColor: '#ff0000',
		strokeOpacity: 1.0,
		strokeWeight: 3
	});

	return {
		bounds: bounds,
		polyline: polyLine
	};
}

function defineRoute(points) {
	var rendererOptions = { map: map };
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

	var islandDirector = new google.maps.DirectionsService();
	var baseOptions = {
		avoidHighways: false,
		avoidTolls: false,
		durationInTraffic: false,
		optimizeWaypoints: false,
		provideRouteAlternatives: false,
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.METRIC
	};

	// Do the island route first
	var islandOptions = $.extend(baseOptions, {
		origin: points[3], // Port-Aux-Basques NFLD
		destination: points[0],
		waypoints: [] //points.slice(1,3)
	});
	var director = new google.maps.DirectionsService();
	director.route(islandOptions,
		function(result, status) {
			if(status == google.maps.DirectionsStatus.OK) {
				var resultRoute = result.routes[0];
				var polylineResult = routeToPolyLine(resultRoute);
				islandRoute = polylineResult.polyline;
				var bounds = polylineResult.bounds;
				islandRoute.setMap(map);

				map.fitBounds(bounds);

				// Now that we have the island, do the rest of the points
				/*var mainlandOptions = $.extend(baseOptions, {
					origin: points[points.length - 1],
					destination: points[4],
					waypoints: degradeList(points.slice(4), 8) // it will knock off the first one by design
				});
				var mainlandDirector = google.maps.DirectionsService();
				mainlandDirector.route(mainlandOptions,
					function(mainlandResult, mainlandStatus) {
						if(mainlandStatus == google.maps.DirectionsStatus.OK) {
							var mainlandResultRoute = mainlandResult.routes[0];
							var polylineMainlandResult = routeToPolyLine(mainlandResultRoute);
							mainlandRoute = polylineMainlandResult.polyline;
							// Extend bounds from previous step by these bounds
							bounds.union(polylineMainlandResult.bounds);
							mainlandRoute.setMap(map);
						}
					}
				);*/
			}
		}
	);
}

function degradeList(list, targetSize) {
	// Take off the first and last
	var sliced = list.slice(1, list.length - 2);
	var out = [];
	var n = Math.ceil(sliced / targetSize);
	for(var i = 0; i < sliced.length; ++i) {
		if(i % n == 0) {
			out.push(sliced[i]);
		}
	}
	return out;
}

function clone(o) {
	// Strangely this is actually one of the fastest ways to clone in JS..
	return JSON.parse(JSON.stringify(o));
}

function makePointer(polyline, distance, teamName, colour) {
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

	google.maps.event.addListener(marker, 'click', function() {
		infoWindow.setContent(content);
		infoWindow.open(map, marker);
	});

	return marker;
}

function plotTerryFoxRun() {
	// TODO: store latlongs
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

	//resolvePoints(locations);

	var pp = [
		new google.maps.LatLng(47.560541, -52.712831),
		new google.maps.LatLng(48.954408, -54.610349),
		new google.maps.LatLng(49.364459, -56.095238),
		new google.maps.LatLng(47.572115, -59.136429),
		new google.maps.LatLng(44.6652059, -63.5677427),
		new google.maps.LatLng(44.927851, -62.544239),
		new google.maps.LatLng(44.665206, -63.567743),
		new google.maps.LatLng(46.238240, -63.131070),
		new google.maps.LatLng(46.087817, -64.778231),
		new google.maps.LatLng(46.471094, -67.580683),
		new google.maps.LatLng(46.745812, -67.697772),
		new google.maps.LatLng(47.667044, -68.974032),
		new google.maps.LatLng(48.487694, -68.452152),
		new google.maps.LatLng(46.803283, -71.242796),
		new google.maps.LatLng(45.607126, -74.604189),
		new google.maps.LatLng(45.421530, -75.697193),
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