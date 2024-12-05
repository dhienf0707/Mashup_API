const morngan = require('morgan');
const helmet = require('helmet');
const reload = require('reload');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const indexRouter = require('./routes/index');
const search = require('./routes/search');
const categories = require('./routes/categories');
const responseTime = require('response-time');
const axios = require('axios');
require('dotenv').config();


// HTTPS server
const privateKey = fs.readFileSync('./sslcert/domain-key.txt', 'utf8');
const certificate = fs.readFileSync('./sslcert/domain-crt.txt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

// app settings
const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use(responseTime());
app.use(helmet());
app.use(morngan('tiny'));
app.use(express.json()); // parse json req
app.use(express.urlencoded({ extended: true })); // url endcode key:value
app.use(express.static(__dirname + '/public')); // static files

// return google map api response to frontend
app.get('/maps/api', async (req, res) => {
    const { query } = req; // Pass any query parameters
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Load the API key from an environment variable
    try {
         // Forward the request to the Google Maps API
         const response = await axios.get('https://maps.googleapis.com/maps/api/js', {
            params: {
                ...query,
                key: apiKey,
            },
            responseType: 'text', // Ensure it's treated as plain text
        });

        // Set correct headers for JavaScript
        res.set('Content-Type', 'application/javascript');
        res.send(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch Google Maps API');
    }
});

app.use('/', indexRouter);
app.use('/search', search);
app.use('/categories', categories);

// PORT
const httpPort = 3000;
const httpsPort = 3443;

// create sever
const httpServer = http.createServer(app);
httpServer.listen(httpPort);

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(httpsPort);
reload(app);