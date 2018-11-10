require([
    "esri/request",
    "esri/config",
    "esri/views/MapView",
    "esri/WebMap",
    "esri/geometry/Point",
    "esri/layers/FeatureLayer",
    'dojo/_base/lang',
    "dojo/domReady!"
  ], function(
    esriRequest, esriConfig, MapView, WebMap, Point, FeatureLayer, lang
  ) {

    /************************************************************
     * Creates a new WebMap instance. A WebMap must reference
     * a PortalItem ID that represents a WebMap saved to
     * arcgis.com or an on-premise portal.
     *
     * To load a WebMap from an on-premise portal, set the portal
     * url with esriConfig.portalUrl.
     ************************************************************/
    this.webmap = new WebMap({
      portalItem: { // autocasts as new PortalItem()
        id: "a92a66821ace41adb8a2387b401094d2"
      }
    });

    /************************************************************
     * Set the WebMap instance to the map property in a MapView.
     ************************************************************/
    var view = new MapView({
      map: webmap,
      container: "viewDiv"
    });

    
    const makeRequestButton = document.getElementById('makeRequest');
    esriConfig.request.proxyUrl = "/proxy/";

    makeRequestButton.addEventListener('click', lang.hitch(this, function(e) {

        console.log("request started");
        //var url = "/proxy/https://www.arcgis.com/sharing/rest/content/users/nsynes/createService";

        var url = "/proxy/https:/www.arcgis.com/portal/sharing/rest/generateToken";

        esriRequest(url, {
            responseType: "json",
            useProxy: true,
            username: "nsynes",
            password: "tester"
        }).then(function(response){
            // The requested data
            var geoJson = response.data;
            console.log(geoJson);
        });
        console.log("request ended");

    }));


    var getActivity = lang.hitch(this, function(id) {
        console.log('Added:', id);
        fetch('/clicked?id='+id, {method: 'GET'})
        .then(function(response) {
        if(response.ok) {
            return response.json();
        }
        throw new Error('Request failed.');
        })
        .then(data => {
            console.log("data",data);

            var lineColour = "#006400"; //green
            if ( data.activityType === 'Hike' || data.activityType === 'Walk' ) {
                lineColour = "#000000"; //black
            } else if ( data.activityType === 'Run' ) {
                lineColour = "#0000ff"; //blue
            } else if ( data.activityType === 'Ride' ) {
                lineColour = "#ff0000"; // red
            }

            var otherSym = {
                type: "simple-line", // autocasts as new SimpleLineSymbol()
                color: lineColour,
                width: 3,
                style: "solid"
            };

            var hwyRenderer = {
                //type: "unique-value", // autocasts as new UniqueValueRenderer()
                type: "simple",
                symbol: otherSym
            }

            var features = [
                {
                    geometry: {
                        type: "polyline",
                        paths: data.geoJson.coordinates
                    }
                }
            ]

            this.layer = new FeatureLayer({
                source: features,
                fields: [],
                objectIdField: "ObjectID",
                spatialReference: { wkid: 4326 },
                geometryType: "polyline",
                renderer: hwyRenderer
            });

            this.webmap.add(this.layer);
        })
        .catch(function(error) {
        console.log(error);
        });
    })

    var getActivities = lang.hitch(this, function(listActivityIDs) {
        
        for (var i in listActivityIDs) {
            getActivity(listActivityIDs[i]);
        }
    })

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

    addPolylineButton.addEventListener('click', lang.hitch(this, function(e) {
        console.log('button was clicked');

        var timeStamp = Math.floor(Date.now() / 1000);
        const perPage = 50;
        const startPage = 1;

        activities = getListOfActivities([], timeStamp, perPage, startPage, getActivities);

        setTimeout(function(){ 
            console.log('activities',activities);
            const subsetActivities = activities.filter(function(x,i) {if ((i+1) % 4 === 0) {return x}})
            console.log('Subset of activities',subsetActivities);
            getActivities(subsetActivities);
        }, 30000);
        

    }));

    const addActivityButton = document.getElementById('addActivity');
    addActivityButton.addEventListener('click', lang.hitch(this, function(e) {
        console.log('button was clicked');
        getActivity(281607383);
    }));


  });