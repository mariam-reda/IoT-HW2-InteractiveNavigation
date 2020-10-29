const { start } = require("repl");

//-------------------------------------------------------------------------
var timer_toUpdate;     //timer used to generate 'automated' GET requests to server

function startTimer() {
    timer_toUpdate = setInterval(getLocationsFromServer, 5000);  //call the function every 5 second
    console.log("Timer has been started - getting locations from server every 5 seconds.");
    //alert("Automated Updates are being received from server.");
    $("#messageDisplayed").text("Automatic Updates are being received from server.");
}

function stopTimer() {
    clearInterval(timer_toUpdate);
    timer_toUpdate = null;
    console.log("Timer has been stopped. No longer getting updates from server automatically.");
    //alert("Automated Updates from server have been stopped.");
    $("#messageDisplayed").text("Automated Updates from server have been stopped.");
}

//----------------------------------

function restartAutomaticTracking() //triggered by clicking the 'Start Automatic Updates' button
{
    if (timer_toUpdate == null)
    {   startTimer();   }
    else
    {   $("#messageDisplayed").text("Automated Updates are already being received."); }
    console.log("Restart Automatic Updates button clicked.");
}

function stopAutomaticTracking()    //triggered by clicking the 'Start Automatic Updates' button 
{
    if (timer_toUpdate != null)
    {   stopTimer();    }
    else 
    {   $("#messageDisplayed").text("Automated Updates are already stopped."); }
    console.log("Automatic updates are already off.");
}

//-------------------------------------------------------------------------
//getLocationsFromServer() - function executes GET requests to server
function getLocationsFromServer() 
{
    console.log("Called getLocationsFromServer() method.");
    $("#messageDisplayed").text("");

    $.get("http://localhost:1234",  // url of server
      function (data, textStatus, jqXHR) {              // success callback
          //alert('status: ' + textStatus + ', data: ' + data);
          console.log('status: ' + textStatus + ', data from server: ' + data);
          calculateDirectionAngle(data);                //call function to calculate direction angle using received JSON coordinates
    }).fail((function(jqxhr, settings, ex) {            // failure to connect to server callback function
        alert("Error. Could not connect to server to retrieve current and destination locations.\n" + ex);
        stopTimer();
    }));

    console.log("Finished GET");
}

//-------------------------------------------------------------------------
//calculateDirectionAngle() - calculates the angle between the current and destination locations using bearings calculation
function calculateDirectionAngle(startEndCoordinatesJSON)
{
    //Convert JSON-formatted coordinates to JS object
    var startEndCoordinates = JSON.parse(startEndCoordinatesJSON);
    console.log("startEndCoordinates variable = ", startEndCoordinates); 

    //store coordinates lat and long in separate variables (for easier reference in calculations)
    currentLat = startEndCoordinates.startingCoordinates.lat;
    currentLong = startEndCoordinates.startingCoordinates.lng;
    destinationLat = startEndCoordinates.destinationCoordinates.lat;
    destinationLong = startEndCoordinates.destinationCoordinates.lng;

    console.log("CurrentLat = ", currentLat, ", CurrentLong = ", currentLong, ", DestinationLat = ", destinationLat, ", DestinationLong = ", destinationLong);

    /*
    * Bearing from Point 'a' to Point 'b' = β = atan2(X,Y)
    *   where X = cos(θb) * sin(∆L) 
    *   and Y = cos(θa) * sin(θb) – sin(θa) * cos(θb) * cos(∆L)
    *       with 'L' = longitude and 'θ' = latitude
    */

    //calculate bearing   [a = current, b = destination]
    x = Math.cos(destinationLat) * Math.sin(destinationLong - currentLong);
    y = ( Math.cos(currentLat) * Math.sin(destinationLat) ) - ( Math.sin(currentLat) * Math.cos(destinationLat) * Math.cos(destinationLong - currentLong) );
    bearingResult = Math.atan2(x, y);

    console.log("Bearing result =", bearingResult); //bearing result is in radians

    //convert bearing from radians to degrees
    bearingResult_deg = radians_to_degrees(bearingResult);
    console.log("Bearing result in degrees =", bearingResult_deg);

    //update the displayed arrow angle to convey the new direction angle
    updateDisplayedArrowAngle(bearingResult_deg);
}

//----------------------------------------
function radians_to_degrees(radiansValue)
{
    return radiansValue * (180/Math.PI);
}
//----------------------------------------
//updateDisplayedArrowAngle() - rotates arrow based on new angle between current and destination locations
function updateDisplayedArrowAngle(newAngle)
{
    $('#directionArrow').css('transform', 'rotate(' + (newAngle % 360) + 'deg)');
    console.log("directionArrow angle has been updated.");
    $("#messageDisplayed").text("Direction update has been received and displayed.");
}
