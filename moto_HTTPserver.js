
// Simple HTTP server using TCP sockets
var net = require('net');

var routeCoordinates;   //will be a JSON object containing the start and destination coordinates

//server socket code
var server = net.createServer(function(socket) {
    
    socket.on('data', function(data) {
        //convert request data to string
        req = data.toString();
        console.log("\n--------------------------------\n RECEIVED:\n", req, "\n");

        // find the "GET" command in the request
        getpos = req.indexOf("GET");
        getStr = req.slice(getpos,getpos+3);
        console.log("GET_STR =", getStr);

        // find the "POST" command in the request
        postpos = req.indexOf("POST");
        postStr = req.slice(postpos, postpos+4);
        console.log("POST_STR =", postStr);

        //------------------------------------------------------------------------------------
        //"POST" command found in the request [for request from map]
        if (postStr=="POST")         //received a post request (from map - new locations)
        {
            console.log("\n--------------------------------\n RECIEVED COMMAND: " + req.slice(postpos, postpos + 4));
        
            //locate and slice post body (all parameters in one string)
            all_post_params = req.slice(req.indexOf('{"startingCoordinates"'), req.length);
            console.log("POST BODY:", all_post_params);

            //update the stored coordinates variable
            routeCoordinates = JSON.parse(all_post_params);
            console.log("COORDINATES:", routeCoordinates);

            //send back message to client
            sendback_content = "Coordinates have been received.";
            console.log("SENDING BACK:", sendback_content);
            
            //write to socket
            socket.write("HTTP/1.1 200 OK\n");
            socket.write("Access-Control-Allow-Origin: *\n");
            socket.write("Content-Length:"+sendback_content.length);
            socket.write("\n\n");
            socket.write(sendback_content);
        }
        //------------------------------------------------------------------------------------
        //"GET" command found in the request [for request from the directions arrow]
        else if(getStr=="GET")               //received a get request (from arrow - to calculate direction)
        {
            console.log("\n--------------------------------\n RECIEVED COMMAND: " + req.slice(getpos, getpos + 3));
        
            //send the start and destination coordinates to the directions arrow page
            var sendback_content;
            console.log("RouteCoordinates =", routeCoordinates);            
            if (routeCoordinates != undefined)
            {
                sendback_content = routeCoordinates;
            }
            else 
            {
                sendback_content = {"startingCoordinates": {"lat":0,"lng":0},"destinationCoordinates":{"lat":0,"lng":0}};
            }
            console.log("\nSENDBACK_CONTENT:", sendback_content);

            //convert content to send it
            sendback_content = JSON.stringify(sendback_content);
            console.log("\nSENDING BACK ="+ sendback_content);

            //write to socket
            socket.write("HTTP/1.1 200 OK\n");
            socket.write("Access-Control-Allow-Origin: *\n");
            socket.write("Content-Length:"+sendback_content.length);
            socket.write("\n\n");
            socket.write(sendback_content);
        }
        //------------------------------------------------------------------------------------
        else
        {
            console.log("else else else");
            socket.write("HTTP/1.1 200 OK\n");
            socket.write("\n\n");
        };
    });  
    socket.on('close', function() {
        console.log('Connection closed\n');
    });
    socket.on('end', function() {
        console.log('Client disconnected - end\n');
     });

    socket.on('error', function() {
        console.log('Client disconnected - error\n');
     });
});
server.listen(1234, function() { 
    console.log('Server is listening on port 1234...\n');
});
