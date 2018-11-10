const decode = require('geojson-polyline').decode
const TerraformerArcGIS = require('terraformer-arcgis-parser');
const path = require('path');
const fs = require('fs');
const express = require('express');
const strava = require('strava-v3');
const port = process.env.PORT || 3000
const app = express();
require("isomorphic-fetch");
require("isomorphic-form-data");
require("@esri/arcgis-rest-request");
const esriFeatureService = require('@esri/arcgis-rest-feature-service');
const esriFeatureServiceAdmin = require('@esri/arcgis-rest-feature-service-admin');
const esriRestAuth = require('@esri/arcgis-rest-auth');
const esriRestItems = require('@esri/arcgis-rest-items');
const geodist = require('geodist');

const hostname = '127.0.0.1';

/*
const userSession = new esriRestAuth.UserSession({
  username: "nsynes",
  password: "???"
})
esriFeatureServiceAdmin.createFeatureService({
  authentication: userSession,
  item: {
    "name" : "EmptyServiceName",
    "spatialReference" : {
      "wkid" : 102100
      },
    "initialExtent" : {
      "xmin" : -20037507.0671618,
      "ymin" : -30240971.9583862,
      "xmax" : 20037507.0671618,
      "ymax" : 18398924.324645,
      "spatialReference" : {
          "wkid" : 102100,
          "latestWkid" : 3857
          }
      }
    }
}).then(function(response) {
  console.log('SUCCESS', response);
},function(err) {
  console.log('FAILURE', err);
});
*/
/*
esriFeatureService.addFeatures({
url: 'http://www.arcgis.com/sharing/rest/content/items/b844454b418544ca9ccc9da577aa5d1c/data',
authentication: userSession,
adds: [{
  "geometry": {
    "paths" : [[[-97.06138,32.837],[-97.06133,32.836],[-97.06124,32.834],[-97.06127,32.832]], 
              [[-97.06326,32.759],[-97.06298,32.755]]]
  },
  "spatialReference" : {"wkid" : 102100}
}]
}).then(function(response) {
  console.log('SUCCESS', response);

},function(err) {
  console.log('FAILURE', err);
});
*/
/*
esriRestItems.getItem(
  'b844454b418544ca9ccc9da577aa5d1c', {authentication: userSession}
).then(function(response) {
  console.log('SUCCESS', response);

},function(err) {
  console.log('FAILURE', err);
});
*/
/*
esriRestItems.createItem({
  authentication: userSession,
  item: {
    title: "Nick's feature service",
    type: "Feature Service" //"Web Map"
  }
}).then(function(response) {
  console.log('SUCCESS', response);
},function(err) {
  console.log('FAILURE', err);
});
*/

app.get('/',  (req, res) => {

  res.sendFile(path.join(__dirname, 'index.html'));

});

app.get('/stravamap/',  (req, res) => {

  res.sendFile(path.join(__dirname, 'stravamap/index.html'));

  /*
  strava.athlete.get({},function(err,payload,limits) {
      if(!err) {
          //console.log("ATHLETE",payload);
      }
      else {
          console.log(err);
      }
  })
  */

});

app.get('/stravamap/listActivities', (req, res) => {

  const before = req.query.before;
  const perPage = req.query.perPage;
  const page = req.query.page;

  strava.athlete.listActivities({'before':before, 'per_page':perPage, 'page':page},function(err,payload,limits) {
    if(!err) {
        // Send only the activity IDs
        //var activityIds = [];
        //payload.map(function(value,index) {activityIds[index] = value.id});
        //res.json(activityIds);

        // Send entire payload (and add geoJson data)
        var data = payload;
        for ( i in data ) {
          if ( data[i].map && data[i].map.summary_polyline ) {
            var polygon = {
              type: 'MultiLineString',
              coordinates: [data[i].map.summary_polyline]
            }
            var geoJson = decode(polygon);
            // TO DO: Add check and handling for if there are multiple coordinates arrays
            var coordsLength = geoJson.coordinates[0].length;
            var dist = 0;
            var newCoords = []
            var coordSegment = 0;
            var segStart = 0;
            for (var j = 0 ; j < coordsLength-1; j++) {
              // TO DO: Check if lat,lon in correct order from geoJson and for geodist?
              dist = geodist(geoJson.coordinates[0][j], geoJson.coordinates[0][j+1], {unit:'km'});
              if ( dist > 10 ) {
                newCoords[coordSegment] = geoJson.coordinates[0].slice(segStart, j);
                coordSegment+=1;
                segStart = j+1;
              }
            }
            //catch last segment of path
            if ( segStart > 0 ) {
              newCoords[coordSegment] = geoJson.coordinates[0].slice(segStart);
            } else {
              newCoords[0] = geoJson.coordinates[0];
            }
            data[i].map['coordinates'] = newCoords;
          }
        }
        res.json(data);
    }
    else {
        console.log(err);
    }
  });
})

app.get('/stravamap/getActivity', (req, res) => {
  const activityID = req.query.id;
  //console.log('\n--------------\n')
  strava.activities.get({id:activityID},function(err,payload,limits) {
    if(!err) {
      //console.log('activityEg',activityEg);
      if ( payload.map && payload.map.polyline ) {
        //console.log('ACTIVITY HAS MAP');
        //console.log('activity type',payload.type);
        //console.log("MAP",payload.map);
        //console.log('payload.map.polyline',payload.map.polyline);
        var polygon = {
          type: 'MultiLineString', //'Polygon',
          coordinates: [payload.map.polyline]
          //coordinates: [payload.map.summary_polyline]
        }
        var activityType = payload.type;
        var geoJson = decode(polygon)
        var activity = {id: activityID, geoJson: geoJson, activityType: activityType};
        //var arcJson = TerraformerArcGIS.convert(geoJson);

        res.json(activity);
      } else {
        res.json(payload);
      }
      }
    else {
        console.log(err);
    }
    
  })  
});

app.use('/stravamap', express.static(path.join(__dirname, 'stravamap')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`server is listening on ${port}\n`);
});


