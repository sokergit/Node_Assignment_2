/*
* Primary file for the API
*/

// dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
// var _data = require('./lib/data');


// TEST
// @todo delete this
/*_data.create('test', 'NewFile', {'foo': 'bar'}, function(err) {
    console.log('This was the error: ', err);
});*/
/*_data.read('test', 'NewFilee', function(err, data) {
    console.log('This was the error [' + err + '], and this was the data [' + data + ']');
});*/
/*_data.update('test', 'NewFile', {'fizz': 'buzz'}, function(err) {
    console.log('This was the error: ', err);
});*/
/*_data.delete('test', 'NewFile', function(err) {
    console.log('This was the error: ', err);
});*/

// the server should respond to all requests with a string
// Instantiate the HTTP server
var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

// start the HTTP server
httpServer.listen(config.httpPort, function(){
    console.log('The server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode.');
});

// Instantiate the HTTPS server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log('The server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode.');
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res) {
    // get the url and parse it
    var parsedUrl = url.parse(req.url, true);

    // get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // get the query string as an object
    var queryStringObject = parsedUrl.query;

    // get the HTTP method
    var method = req.method.toLowerCase();

    // get the headers as an object
    var headers = req.headers;

    // get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
        buffer += decoder.write(data);
    });

    req.on('end', function() {
        buffer += decoder.end();

        // choose the handler this request should go to. If one is not found, use notFound handler
        var chosenHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;

        // construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload) {
            // Use the status code called back by the handler, or use default
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

             // log the request path
            console.log('Request received on path: ' + trimmedPath + '; with method: ' + method + '; and with these query string parameters:', queryStringObject);
            console.log('Request received with the following headers: ', headers);
            console.log('Request received with this payload: ', buffer);
            console.log('Returning this response:', statusCode, payloadString);
        });

        // send the respose
        // res.end('Hello world!\n');
    });
};


// define a request router
var router = {
    'ping': handlers.ping,
    'hello': handlers.hello,
    'users': handlers.users
};