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