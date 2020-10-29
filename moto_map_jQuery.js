
var mymap;
var currentLocationCoordinates;
var accuracyRadiusCircle;
var radiusDisplayedOnce = false;
var control;

//---------------------------------------------
//custom red icon (used to differentiate between starting location and destination (default blue icon))
var redIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

//------------------------------------------------------------
//SETTING UP THE MAP

window.onload = function() {
    //Initialize map - set to world view initially
    mymap = L.map('motoMap_div').fitWorld();

    //Add Mapbox Streets tile layer to map
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXJlZGEyMCIsImEiOiJja2dxeWY2bDEyejNlMzB0ZXJqajcyY2d1In0.B5o1M7F8RvZmBhKJ_dnYUg', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(mymap);

    //---------------------------------------------
    //Geolocation - locate user's current location
    mymap.locate({setView: true, watch: true, maxZoom: 16});    //will either call onLocationFound() or onLocationError
                                                                // 'watch:true' will continuously track user's location and update map accordingly (calls onLocationFound)

    //---------------------------------------------

    //Geolocation - location found function
    function onLocationFound(e) 
    {
        //accuracy radius of location detected
        var radius = e.accuracy / 8;

        //store current location coordinates
        currentLocationCoordinates = e.latlng;

        //set marker at current location [uses red icon]
        var currentLocationMarker = L.marker(currentLocationCoordinates, {icon: redIcon}).addTo(mymap).bindPopup("<b>Detected Current Location</b><br/>You are within " + radius + " meters from this point").openPopup();

        //display radius circle
        if (!radiusDisplayedOnce) 
        {   
            accuracyRadiusCircle = L.circle(currentLocationCoordinates, radius, {color: 'yellow', fillColor: 'yellow', fillOpacity: 0.2}).addTo(mymap); 
            radiusDisplayedOnce = true;
        }
        //set map view to be centered at current location
        mymap.setView(currentLocationCoordinates, 13);
    }

    //attach location found listener
    mymap.on('locationfound', onLocationFound);

    //---------------------------------------------
    //Geolocation - location error function
    function onLocationError(e) 
    {
        alert(e.message + "\n\nAllow the website to access your location to set your current location on the map.");
    }

    //attach location found listener
    mymap.on('locationerror', onLocationError);



    //-------------------------------------------------------------
    //onMapClick() - listener created for when user clicks on map; sets the destination location
    function onMapClick(e) 
    {
        //hide accuracy radius circle on first click
        if (accuracyRadiusCircle != undefined)
        {
            mymap.removeLayer(accuracyRadiusCircle);
            accuracyRadiusCircle = undefined;
        }

        //only display route and destination marker if current location has been read
        if (currentLocationCoordinates != undefined)
        {
            //if not yet initialized, then initialize control object for routing
            if (control == undefined)
            {   initializeControl();    }

            //pass destination coordinates to routeMap() function
            var destination_latlong = e.latlng;
            routeMap(destination_latlong);
        }
        else    //current location detection was blocked/error occurred
        {
            alert("Allow the website to access your location to be able to set a destination and determine a route.");
        }
    }
    mymap.on('click', onMapClick);      //attach function to event
};



//-------------------------------------------------------------
//routing control object
function initializeControl() 
{
    control = L.Routing.control({
        routeWhileDragging: true,
        lineOptions : {addWaypoints: false},     //avoids allowing additional waypoints by clicking line (only 2 points allowed - from-to)
        collapsible: true,                       //hides directions panel
        createMarker: function(i, wp, nWps) {    //differentiates between start/current and destination markers
            let locMarker = L.marker(wp.latLng);
            if (i == 0) //starting location marker
            {
                locMarker.setIcon(redIcon);                             //starting location marker uses red icon
                locMarker.bindPopup("Starting Location");
            }
            else if (i == 1)    //destination location marker
            {
                locMarker.bindPopup("Destination Location");            //destination marker uses default blue icon
            }
            return locMarker;
        },
    }).addTo(mymap);
}


//-------------------------------------------------------------
//function sets waypoints for control object, calculating and displaying the route
function routeMap(dest_latlong) 
{
    //update destination point and route
    console.log("routeMap() function called");

    //set the location waypoints (triggers route calculation and display)
    control.setWaypoints([currentLocationCoordinates, dest_latlong]);

    //hide regenerated directions box
    $(".leaflet-routing-container").css("display", "none");
    //$(".leaflet-control-container").css("display", "none");

    //post the updated locations to the server
    postLocationsToServer(currentLocationCoordinates, dest_latlong);
}

//-------------------------------------------------------------
//postLocationsToServer() - function executes POST requests to server
function postLocationsToServer(startLoc, destinationLoc) 
{
    console.log("Called postLocationsToServer() method.");
    console.log("StartLoc = " + startLoc + ", destinationLoc = " + destinationLoc);

    $.post('http://localhost:1234',  // url
        JSON.stringify({
            startingCoordinates: startLoc,
            destinationCoordinates: destinationLoc,
        }),
        function(data, status, xhr) {                       // success callback function
            //alert('status: ' + status + ', data: ' + data);
            console.log('POST status: ' + status + ', data from server: ' + data);
        }).fail((function(jqxhr, settings, ex) {            // failure to connect to server callback function
            alert("Error. Could not connect to server to post current and destination locations.\n" + ex);
        }));
}
