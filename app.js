const path = require('path');
const express = require('express');
const createError = require('http-errors');

// express config
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', 8080);

// express cors
const cors = function (request, response, next) {
    const whitelist = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];
    const origin = request.headers.origin;
    if (whitelist.indexOf(origin) > -1)
        response.setHeader('Access-Control-Allow-Origin', origin);
    next();
}
app.use(cors);

// express routes
app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;