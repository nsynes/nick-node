
// 2D map from leaflet and osm tiles
// create map object, tell it to live in 'map' div and give initial latitude, longitude, zoom values
// pass option to turn scroll wheel zoom off
map = L.map('map',{scrollWheelZoom:true}).setView([53, -3], 6);

// add base map tiles from OpenStreetMap and attribution info to 'map' div
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// 3D map from eeGeo and Wrld3D tiles (requires API key)
/*
var map = L.eeGeo.map('map', 'de7940464fd8803d51ef32e3ba3886a9', {
    center: [53, -03],
    zoom: 6
});
*/

var getActivities = function(listActivityIDs) {
    
    const activityListLength = listActivityIDs.length
    for (var i = 0; i < activityListLength; i++) {
        console.log('Activity',i+1,'of',activityListLength)
        getActivity(listActivityIDs[i]);
    }
}

var getListOfActivities = function(allActivities, timeStamp, perPage, page) {
    
    var endOfList = false;

    fetch('/stravamap/listActivities?before='+timeStamp+'&perPage='+perPage+'&page='+page, {method: 'GET'})
    .then(function(response) {
        if(response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
        })
    .then(activities => {
        //console.log('# activities:', activities.length);
        //console.log('page', page);
        page += 1;
        if ( activities.length < perPage ) {
            endOfList = true;
        }
        displayActivities(activities);

        allActivities.push.apply(allActivities, activities);
        if ( !endOfList ) {
            getListOfActivities(allActivities, timeStamp, perPage, page);
        }
    })
    return allActivities;
}

var displayActivities = function(activities) {
    var data = {};
    for (i in activities) {
        data = activities[i];
        if (data.map.coordinates ) {

            var lineColour = "000000"; //black
            if ( data.type === 'Hike' || data.type === 'Walk' ) {
                lineColour = "#006400"; //green
            } else if ( data.type === 'Run' ) {
                lineColour = "#0000ff"; //blue
            } else if ( data.type === 'Ride' ) {
                lineColour = "#ff0000"; // red
            }

            var coords = data.map.coordinates;
            // lat lon wrong way round
            for (ii in coords) {
                coords[ii] = coords[ii].map(function(x) {return [x[1],x[0]]});
            }
            
            // add line from toUnion array points to map with some basic styling
            L.polyline(coords,{color:lineColour,opacity:0.9,weight:3,interactive:false}).addTo(map);
        }
    }
}

window.onload = function () {
    var timeStamp = Math.floor(Date.now() / 1000);
    const perPage = 50;
    const startPage = 1;

    getListOfActivities([], timeStamp, perPage, startPage, getActivities);
}