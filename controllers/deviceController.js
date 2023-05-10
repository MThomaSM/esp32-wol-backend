const {PrismaClient} = require("@prisma/client");
const catchAsync = require("catch-async-wrapper-express");
const AppError = require("../utils/appError");
const {de} = require("date-fns/locale");

const prisma = new PrismaClient({ log: ['warn', 'error'], errorFormat: 'minimal'}) //minimal / pretty


module.exports = {
    validationRules: {
        name: 'required|string',
    },
    post: catchAsync(async (req, res, next) => {
        const { uuid, name, userId } = req.body;

        const device = await prisma.device.create({
            data: {
                name,
                uuid,
                user: {
                    connect: {
                        id: req.user.id
                    }
                }
            }
        });
        res.status(201).json(device);
    }),
    get: catchAsync(async (req, res, next) => {
        const user = req.user;
        const { id } = req.params;

        const isAdmin = user.role === "ADMIN";
        const where = isAdmin && id ? {uuid: id} : isAdmin && !id ? {} : !isAdmin && id ? {userId: user.id, uuid: id} : !isAdmin && !id ? {userId: user.id} : null;

        if(where === null)
            throw new AppError('Device not found', 404);

        const devices = await prisma.device.findMany({
            where: where,
            include: { user: false },
            orderBy: {
                createdAt: 'asc'
            }
        });

        if(devices === null)
            throw new AppError('Device not found', 404);

        return res.json(devices);
    }),
    patch: catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { name } = req.body;

        const updatedDevice = await prisma.device.update({
            where: { uuid: id },
            data: { name },
        });

        res.json(updatedDevice);
    }),
    delete:  catchAsync(async (req, res, next) => {
        const { id } = req.params;

        // Zmažeme dané zariadenie
        await prisma.device.delete({
            where: { uuid:id },
        });

        res.status(204).json({ message: 'success' });
    })
}