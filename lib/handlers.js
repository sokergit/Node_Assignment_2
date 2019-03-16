/*
* Request handlers
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');


// Define the Handlers
var handlers = {};

// sample handler
/*handlers.sample = function(data, callback) {
    // callback an http status code, and a payload object
    callback(406, {name: 'sample handler'});
};*/

// ping handler
handlers.ping = function(data, callback) {
    callback(200);
};

// hello handler
handlers.hello = function(data, callback) {
    callback(200, {'message': "'sup World!"});
}

// not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};


// Users handler
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the user's sub-methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Checked that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doen't already exist
        // (when a user is added, a file is created named with its phone number)
        _data.read('users', phone, function(err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };
    
                    // Store the user
                    _data.create('users', phone, userObject, function(err, data) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user.'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password.'});
                }
            } else {
                callback(400, {'Error': 'A user with that phone number already exists.'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields.'});
    }
};

// Users - get
// Required: phone
// Optional: none
// @TODO Only let an authenticated user access their object. Don't let them access anyone else's
handlers._users.get = function(data, callback) {
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
            if (!err && data) {
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'})
    }
};

// Users - put
// Required: phone
// Optional: firstName, lastName, password. (at least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update any one else's
handlers._users.put = function(data, callback) {
    // Checked for the required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error is the phone invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
        // Lookup the user
        _data.read('users', phone, function(err, userData) {
            if (!err && userData) {
                // Update the fields necessary
                if (firstName) {
                    userData.firstName = firstName;
                }
                if (lastName) {
                    userData.lastName = lastName;
                }
                if (password) {
                    userData.hashedPassword = helpers.hash(password);
                }
                // Store the new updates
                _data.update('users', phone, userData, function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error' : 'Could not update the user.'})
                    }
                });
            } else {
                callback(400, {'Error': 'The specified user does not exist'});
            }
        });
        } else {
            callback(400, {'Error': 'Missing fields to update.'});
        }
    } else {
        callback(400, {'Error': 'Missing required fields.'});
    }
};

// Users - delete
// Required: phone
// @TODO Only let an authenticated user delete their own object. Don't let them delete any one else's
// @TODO Clean up (delete) any other data files associated with this user
handlers._users.delete = function(data, callback) {
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
            if (!err && data) {
                _data.delete('users', phone, function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error' : 'Could not delete the specified user.'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Could not find the specified user.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'})
    }
};


module.exports = handlers;