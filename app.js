const morngan = require('morgan');
const helmet = require('helmet');
const Joi = require('joi');
const reload = require('reload');
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const indexRouter = require('./routes/index');
const search = require('./routes/search');

// HTTPS server
const privateKey = fs.readFileSync('./sslcert/domain-key.txt', 'utf8');
const certificate = fs.readFileSync('./sslcert/domain-crt.txt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express();


console.log(`NODE_EVN: ${process.env.NODE_EVN}`);
console.log(`app: ${app.get('env')}`);

app.set('view engine', 'pug');
app.set('views', './views');

app.use(helmet());
app.use(morngan('tiny'));
app.use(express.json()); // parse json req
app.use(express.urlencoded({ extended: true })); // url endcode key:value
app.use(express.static(__dirname + '/public')); // static files
// app.use(function(req, res, next) {
//     console.log('Logging...');
//     next();
// });

app.use('/', indexRouter);
app.use('/search', search)
// const courses = [
//     {id: 1, name: 'course1'},
//     {id: 2, name: 'course2'},
//     {id: 3, name: 'course3'}
// ];



// app.get('/api/courses', (req, res) => {
//     res.send(courses);
// });

// app.get('/api/courses/:id', (req, res) => {
//     const course = courses.find(course => course.id === parseInt(req.params.id))
//     if (!course) return res.status(404).send('The course with given id was not found');
//     res.send(course);
// });

// app.post('/api/courses', (req, res) => {
//     const { error } = validateCourse(req.body);
//     if (error) return res.status(400).send(error.details[0].message);

//     const course = {
//         id: courses.length + 1,
//         name: req.body.name
//     };

//     courses.push(course);
//     res.send(course);
// });

// app.put('/api/courses/:id', (req, res) => {
//     const course = courses.find(course => course.id === parseInt(req.params.id));
//     if (!course) return res.status(404).send('The course with given id was not found');
   
//     const { error } = validateCourse(req.body);
//     if (error) return res.status(400).send(error.details[0].message);

//     course.name = req.body.name;
//     res.send(courses);
// });

// app.delete('/api/courses/:id', (req, res) => {
//     const course = courses.find(c => c.id === parseInt(req.params.id));
//     if (!course) return res.status(404).send('The course with the given Id was not found');

//     // Delte
//     const index = courses.indexOf(course);
//     courses.splice(index, 1);

//     // response
//     res.send(course);
// })

// PORT
const port = process.env.PORT || 3000; 

// create sever
const httpServer = http.createServer(app);
httpServer.listen(port);

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(3443);
reload(app);

// function
function validateCourse(course) {
    const schema = {
        name: Joi.string().min(3).required()
    };

    return Joi.validate(course, schema);
}