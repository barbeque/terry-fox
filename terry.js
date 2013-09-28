var map;
var activeMarkers = [];
var infoWindow = {};
var MAX_FIELDS = 16;
var terryFoxRoute = {};

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
	if(!terryFoxRoute) {
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
				makePointer(terryFoxRoute, 0, 'Team ' + (i + 1) + " - INVALID DISTANCE PROVIDED");
			}
			else {
				var distanceInKm = parseInt(text);
				makePointer(terryFoxRoute, distanceInKm, 'Team ' + (i + 1));
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

	var director = new google.maps.DirectionsService();
	director.route({
		avoidHighways: false,
		avoidTolls: false,
		origin: points[points.length - 1],//points[0],
		destination: points[0],//points[points.length - 1],
		durationInTraffic: false,
		optimizeWaypoints: false,
		provideRouteAlternatives: false,
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.METRIC,
		waypoints: degradeList(points, 8) // google sucks
	},
	function(result, status) {
		if(status == google.maps.DirectionsStatus.OK) {
			var route = result.routes[0];
			var polylineResult = routeToPolyLine(route);
			var polyline = polylineResult.polyline;
			terryFoxRoute = polyline;

			map.fitBounds(polylineResult.bounds);
			polyline.setMap(map);

			makePointer(polyline, 10, 'Ten');
			makePointer(polyline, 100, 'One Hundred');
			makePointer(polyline, 1000, 'One Thousand');
		}
	});
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

function makePointer(polyline, distance, teamName) {
	var content = teamName + " (" + distance + "km)";
	var ll = polyline.GetPointAtDistance(distance * 1000);
	var marker = new google.maps.Marker({
		position: ll,
		map: map,
		title: content
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
		new google.maps.LatLng(43.25002080000001, -79.86609140000002),
		new google.maps.LatLng(43.653226, -79.38318429999998),
		new google.maps.LatLng(43.7729244, -79.25756469999999),
		new google.maps.LatLng(43.83841169999999, -79.08675790000001),
		new google.maps.LatLng(44.6652059, -63.5677427),
		new google.maps.LatLng(44.919643, -79.37418339999999),
		new google.maps.LatLng(44.9278509, -62.544239000000005),
		new google.maps.LatLng(45.4215296, -75.69719309999999),
		new google.maps.LatLng(45.6071264, -74.60418900000002),
		new google.maps.LatLng(46.0878165, -64.77823130000002),
		new google.maps.LatLng(46.23824, -63.1310704),
		new google.maps.LatLng(46.471094, -67.5806829),
		new google.maps.LatLng(46.48999999999999, -81.00999999999999),
		new google.maps.LatLng(46.52185799999999, -84.34608960000003),
		new google.maps.LatLng(46.7458117, -67.69777210000001),
		new google.maps.LatLng(46.8032826, -71.242796),
		new google.maps.LatLng(47.5605413, -52.71283149999999),
		new google.maps.LatLng(47.5721149, -59.13642900000002),
		new google.maps.LatLng(47.6670443, -68.9740324),
		new google.maps.LatLng(47.683333, -84.5),
		new google.maps.LatLng(47.992392, -84.771007),
		new google.maps.LatLng(48.3808951, -89.24768230000001),
		new google.maps.LatLng(48.4876939, -68.4521517),
		new google.maps.LatLng(48.784141, -87.09624500000001),
		new google.maps.LatLng(48.954408, -54.6103488),
		new google.maps.LatLng(49.3644591, -56.09523760000002) 
	];
	defineRoute(pp);
}