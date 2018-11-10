
// 2D map from leaflet and osm tiles
/*
// create map object, tell it to live in 'map' div and give initial latitude, longitude, zoom values
// pass option to turn scroll wheel zoom off
map = L.map('map',{scrollWheelZoom:true}).setView([53, -3], 6);

// add base map tiles from OpenStreetMap and attribution info to 'map' div
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
*/

// 3D map from eeGeo and Wrld3D tiles (requires API key)
var map = L.eeGeo.map('map', 'de7940464fd8803d51ef32e3ba3886a9', {
    center: [53, -03],
    zoom: 6
  });


var getActivity = function(id) {
    fetch('/clicked?id='+id, {method: 'GET'})
    .then(function(response) {
    if(response.ok) {
        return response.json();
    }
    throw new Error('Request failed.');
    })
    .then(data => {

        if (data.activityType && data.geoJson ) {

            var lineColour = "#006400"; //green
            if ( data.activityType === 'Hike' || data.activityType === 'Walk' ) {
                lineColour = "#A020F0"; //purple
            } else if ( data.activityType === 'Run' ) {
                lineColour = "#0000ff"; //blue
            } else if ( data.activityType === 'Ride' ) {
                lineColour = "#ff0000"; // red
            }

            var coords = data.geoJson.coordinates[0]
            // lat lon wrong way round
            coords = coords.map(function(x) {return [x[1],x[0]]});
            // add line from toUnion array points to map with some basic styling
            L.polyline(coords,{color:lineColour,opacity:1}).addTo(map);
        }
    })
    .catch(function(error) {
    console.log('ERROR',id,error);
    });
}

var getActivities = function(listActivityIDs) {
    
    const activityListLength = listActivityIDs.length
    for (var i = 0; i < activityListLength; i++) {
        console.log('Activity',i+1,'of',activityListLength)
        getActivity(listActivityIDs[i]);
    }
}

var getListOfActivities = function(allActivities, timeStamp, perPage, page) {
    
    var endOfList = false;

    fetch('/listActivities?before='+timeStamp+'&perPage='+perPage+'&page='+page, {method: 'GET'})
    .then(function(response) {
        if(response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
        })
    .then(activities => {
        console.log('# activities:', activities.length);
        console.log('page', page);
        page += 1;
        if ( activities.length < perPage ) {
            endOfList = true;
        }
        allActivities.push.apply(allActivities, activities);
        if ( !endOfList ) {
            getListOfActivities(allActivities, timeStamp, perPage, page);
        }
    })
    return allActivities;
}


const addPolylineButton = document.getElementById('addPolyline');

addPolylineButton.addEventListener('click', function(e) {
    console.log('button was clicked');

    var timeStamp = Math.floor(Date.now() / 1000);
    const perPage = 50;
    const startPage = 1;

    activities = getListOfActivities([], timeStamp, perPage, startPage, getActivities);

    setTimeout(function(){ 
        console.log('ALL ACTIVITIES:',activities);
        var data = {};
        for (i in activities) {
            data = activities[i];
            if (data.map.coordinates ) {

                var lineColour = "#006400"; //green
                if ( data.type === 'Hike' || data.type === 'Walk' ) {
                    lineColour = "#A020F0"; //purple
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
                L.polyline(coords,{color:lineColour,opacity:0.7,weight:2.5,interactive:false}).addTo(map);
            }
        }
    }, 70000);
    /*
    setTimeout(function(){ 
        console.log('activities',activities);
        //const subsetActivities = activities.filter(function(x,i) {if ((i+1) % 4 === 0) {return x}})
        //console.log('Subset of activities',subsetActivities);
        getActivities(activities);
    }, 30000);
    */
    

});

const addActivityButton = document.getElementById('addActivity');
addActivityButton.addEventListener('click', function(e) {
    console.log('button was clicked');
    getActivity(1902574653);
});
