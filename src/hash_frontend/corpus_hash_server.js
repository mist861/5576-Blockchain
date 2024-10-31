const path = require('path') // Import the path class
const express = require('express') // Import the express router module (note that this requires express to be installed in the host machine)
const app = express() // Define a new express router object
const multer = require('multer');
const port = 8080 // Define a port to listen on

const storage_directory = '/upload/corpus/'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
         cb(null, path.join(__dirname, storage_directory))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

app.get('/', // Define a default route, to get the html index
    (req, res) => {
        res.sendFile(path.join(__dirname, '/corpus_hash_index.html')); // Respond with index.html
    })

app.get('/corpus_hash_interact.js', // Define a route to provide interact.js
    (req, res) => {
        res.sendFile(path.join(__dirname, '/corpus_hash_interact.js')); // Respond with index.html
    })

//app.post('/upload', upload.single('file'), (req, res) => {
//       upload(req, res, function (err) {
//           if (err) {
//               console.log(err)
//           } else {
//               var FileName = req.file.filename;
//                res.status(200).send(FileName);
//            }
//        })
//   });

app.post('/upload', upload.single('file'), (req, res) => {
    // Handle the uploaded file
    res.json({ message: 'File uploaded successfully!' });
  });

app.get('/download', function(req, res){
    const filename = req.query.filename;
    const file = path.join(__dirname, storage_directory, filename)
    res.sendFile(file)
    //`${__dirname}/upload/corpus/${filename}`;
  });

app.listen(port, // Initialize the express app router 
    function (err) { // Define a function to write any errors to the console
        if (err) console.log(err); // This is what does the writing
        console.log("Server listening on port", port); // Write this on server init
    });