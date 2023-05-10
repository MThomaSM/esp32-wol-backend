const catchAsync = require('catch-async-wrapper-express');
const AppError = require("../utils/appError");
const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient({ log: ['warn', 'error'], errorFormat: 'minimal'}) //minimal / pretty

const checkAuthorization = (model, idParam = "id", idParamType = "params", compareId = "id") => catchAsync(async (req, res, next) => {
    let id = req.params[idParam];
    if (idParamType === "body") {
        id = req.body[idParam];
    }
    const user = req.user;

    const instance = await prisma[model].findUnique({
        where: { [compareId]: id },
        include: { user: true }
    });

    //console.log(model, idParam, idParamType, compareId, { [compareId]: id })

    if (!instance) {
        throw new AppError(`${model} not found`, 404);
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = instance.user.id === user.id;

    if (!isAdmin && !isOwner) {
        throw new AppError('Unauthorized', 401);
    }

    return next();
});

module.exports = checkAuthorization;