var map;
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
	
	initializeForm(distances);
	// TODO: if they actually provided distances, remember to run the button
	// method after the route plot is done.

	// go for it
	plotTerryFoxRun();
}

function initializeForm(values) {
	var fields = 16;
	for(var i = 0; i < fields; ++i) {
		var value = ''
		if(values && values[i]) {
			value = parseInt(values[i]);
		}
		var f = $('<div class="form-pair"><label for="form' + i + '">Team ' + (i + 1) + '</label><input name="form' + i + '" value="' + value + '"></input></div>');

		$(".form-entries").append(f);
	}
}

var successes = 0;

function plotTerryFoxRun() {
	// TODO: store latlongs
	locations = [
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
	'Thunder Bay, ON'];

	resolvePoints(locations);
}

function resolvePoints(locations) {
	var promises = [];

	for(l in locations) {
		promises.push(doGeocode(locations[l], l));
	}
	$.when.apply($, promises).then(function() {
		// Convert arguments into an array
		var args = Array.prototype.slice.call(arguments, 0);
		var pp = args.sort();
		// All done
		defineRoute(pp);
	});
}

function doGeocode(location, index) {
	var gc = new google.maps.Geocoder();
	var def = $.Deferred();

	var stall = 750;

	// Do one request every 200ms so we're not in trouble with The Google.
	// This is a terrible HACK
	setTimeout(function() {
		gc.geocode({'address': location}, function(results, status) {
			if(status == google.maps.GeocoderStatus.OK) {
				var latlong = results[0].geometry.location;
				def.resolve(latlong);
				++successes;
			}
			else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
				alert("Over query limit (t = " + index * stall + ").");
			}
		});
	}, index * stall);

	return def.promise();
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
		waypoints: degradeList(locations, 8) // google sucks
	},
	function(result, status) {
		if(status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);

			// Wait for it... then set the map center
			//map.setCenter(new google.maps.LatLng(53.0779, -67.98867));
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

function makePointer(route, distance) {

}