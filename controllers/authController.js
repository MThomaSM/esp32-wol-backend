const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('catch-async-wrapper-express')
const jwt = require('jsonwebtoken');
const sendEmail = require('./../utils/email');
const {PrismaClient} = require("@prisma/client");
const AppError = require('./../utils/appError');
const bcrypt = require('bcryptjs');
const {request} = require("express");
const add = require('date-fns/add')

const prisma = new PrismaClient({ log: ['warn', 'error'], errorFormat: 'minimal'}) //minimal / pretty

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) });
}

exports.createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);
    res.cookie('jwt', token, {
        expiresIn: new Date(Date.now + parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    })

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token: token,
        expiresIn: Math.floor(new Date(new Date().getTime() + (60 * 60 * 1000)) / 1000),
        data: {
            user: user
        }
    })

}

exports.signup = {
    validatorRules: {
        email: 'required|email',
        password: 'required',
        passwordConfirm: 'required',
    },
    post: catchAsync(async (req, res, next) => {
        let passwordHash = "";

        if(req.body.passwordConfirm === req.body.password){
            passwordHash = await bcrypt.hash(req.body.password, 12);
        }
        if(passwordHash === ""){
            return next(new AppError('Password and password confirm are not the same', 400));
        }

        try{

            const user = await prisma.user.findUnique({
                where: {
                    email: req.body.email
                }
            });

            if(user)
                return next(new AppError('There is already registered somebody with that mail', 409));


            const newUser = await prisma.user.create({
                data: {
                    email: req.body.email,
                    password: passwordHash,
                    role: "USER",
                },
            })
            return this.createAndSendToken(newUser, 201, res);
        } catch (e){
            return next(new AppError(e.message, 400));
        }
    })
}


exports.login = {
    validatorRules: {
        email: 'required|email',
        password: 'required',
    },
    post: catchAsync(async (req, res, next) => {
        const { email, password } = req.body;


        if(!email || !password){
            return next(new AppError('Email or password is missing', 400));
        }


        const user = await prisma.user.findUnique({
            where: {
                email: email
            },
        });

        if(!user){
            return next(new AppError('Incorrect email or password', 409));
        }

        if(await bcrypt.compare(password, user.password) === false){
            return next(new AppError('Incorrect email or password', 409));
        }

        this.createAndSendToken(user, 200, res);
    })
}

exports.updatePassword = {
    validatorRules: {
        oldPassword: 'required',
        newPassword: 'required',
        confirmPassword: 'required',
    },
    post: catchAsync(async (req, res, next) => {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const user = req.user;

        if(await bcrypt.compare(oldPassword, user.password) === false){
            return next(new AppError('Incorrect old password', 200));
        }

        if(newPassword !== confirmPassword){
            return next(new AppError("Password and password confirm are not equal.", 200))
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: newPasswordHash,
                passwordChangeAt: new Date()
            }
        });

        if(!updatedUser)
            return next(new AppError("Something went wrong with creating new password", 400));
        return this.createAndSendToken(updatedUser, 200, res);
    })
}

exports.protect = catchAsync(async (req, res, next) => {

    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access.', 401))
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await prisma.user.findUnique({
        where: {
            id: decoded.id
        }
    })

    if(!currentUser) return next(new AppError('The user belonging to this token does no longer exist', 401))

    req.user = currentUser;
    next();
})


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action', 403))
        next();
    }
}