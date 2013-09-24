var map;
function init() {
	var mapOptions = {
		zoom: 8,
		center: new google.maps.LatLng(-34.397, 150.644),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	// go for it
	plotTerryFoxRun();
}

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

	var points = [];
	var gc = new google.maps.Geocoder();

	for(loc in locations) {
		gc.geocode( {'address': loc }, function(results, status) {
			if(status == google.maps.GeocoderStatus.OK) {
				var latlong = results[0].geometry.location;
				points.push(latlong);
			}
		});
	}

	var rendererOptions = { map: map };
	var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

	var director = new google.maps.DirectionsService();
	director.route({
		avoidHighways: false,
		avoidTolls: false,
		destination: points[points.length - 1],
		durationInTraffic: false,
		optimizeWaypoints: false,
		origin: points[0],
		provideRouteAlternatives: false,
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.METRIC,
		waypoints: degradeList(locations, 8) // google sucks
	},
	function(result, status) {
		if(status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);
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