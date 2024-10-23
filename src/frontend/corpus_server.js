const path = require('path') // Import the path class
const express = require('express') // Import the express router module (note that this requires express to be installed in the host machine)
const app = express() // Define a new express router object
const port = 8080 // Define a port to listen on

app.get('/', // Define a default route, to get the html index
    (req, res) => {
        res.sendFile(path.join(__dirname, '/corpus_index.html')); // Respond with index.html
    })

app.get('/corpus_interact.js', // Define a route to provide interact.js
    (req, res) => {
        res.sendFile(path.join(__dirname, '/corpus_interact.js')); // Respond with index.html
    })

app.listen(port, // Initialize the express app router 
    function (err) { // Define a function to write any errors to the console
        if (err) console.log(err); // This is what does the writing
        console.log("Server listening on port", port); // Write this on server init
    });