const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

const cors = require('cors')
const AppError = require('./utils/appError');
const globalErrrorHandler = require('./controllers/errorController');

const indexRouter = require('./routes/index');
const resourcesRouter = require('./routes/resources');
const usersRouter = require('./routes/users');
const app = express();


const limiter = rateLimit({ //rate limiter
    max: 100, //limit requestov
    windowMs: 10 * 60 * 1000,  //za aký čas == 10 minut
    message: { status: 'error', message: 'Too many request from this IP, plese try again in an 10 minutes' } //odpoved po prekročení
});
app.use(limiter);
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(xss());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH');
    next();
});


app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.body)
    // console.log(req.cookies);
    next();
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/resources', resourcesRouter);


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`, 404));
})

app.use(globalErrrorHandler)


module.exports = app;
