const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    value = err.errmsg.match(/(["'])(.*?[^\\])\1/)[0];
    const message = `Duplicate field value: ${value}.Please use another value!`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.erros).map(el => el.message) //object.valus vratí hodnoty z vstupneho objektu
    const message = `Invalid input data ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJsonWebTokenError = err => new AppError('Invalid token. Please log in again', 401);
const handleTokenExpiredError = err => new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
    const isValidatorError = req.errors && Object.keys(req.errors).length > 0;
    if(isValidatorError){
        err.status = "Validator error";
        err.message = req.errors;
    }
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: true,
            message: err.message
        });
    }
    console.error('ERROR 💥', err);
    return res.status(500).json({
        status: 'error',
        error: true,
        message: 'Something went very wrong!'
    });
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Unkown error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, req, res);
    } else if(process.env.NODE_ENV === 'production'){
        let error = Object.create(err);

        if(error.name === 'CastError') error = handleCastErrorDB(error)
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJsonWebTokenError(error);
        if(error.name === 'TokenExpiredError') error = handleTokenExpiredError(error);
        
        sendErrorProd(error, req, res);
    }

    next();
}