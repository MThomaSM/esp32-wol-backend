const {PrismaClient} = require("@prisma/client");
const catchAsync = require("catch-async-wrapper-express");
const AppError = require("../utils/appError");

const prisma = new PrismaClient({ log: ['warn', 'error'], errorFormat: 'minimal'}) //minimal / pretty


module.exports = {
    validationRules: {
        name: 'required|string',
        macAddress: 'required|string',
        deviceId: 'required|string'
    },
    post: catchAsync(async (req, res, next) => {
        const { name, macAddress, deviceId } = req.body;

        const computer = await prisma.computer.create({
            data: {
                name,
                macAddress,
                user: {
                    connect: {
                        id: req.user.id
                    }
                },
                device: {
                    connect: {
                        id: deviceId
                    },
                },
            }
        });
        res.status(201).json(computer);
    }),
    get: catchAsync(async (req, res, next) => {
        const user = req.user;
        const { id } = req.params;

        const isAdmin = user.role === "ADMIN";
        const where = isAdmin && id ? {id} : isAdmin && !id ? {} : !isAdmin && id ? {userId: user.id, id: id} : !isAdmin && !id ? {userId: user.id} : null;

        if(where === null)
            throw new AppError('Computer not found', 404);

        const computers = await prisma.computer.findMany({
            where: where,
            include: { user: false, device: true },
        });

        if(computers === null)
            throw new AppError('Computer not found', 404);

        return res.json(computers);
    }),
    patch: catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { name, macAddress, deviceId } = req.body;

        const updatedComputer = await prisma.computer.update({
            where: { id },
            data: { name, macAddress, deviceId },
        });

        res.json(updatedComputer);
    }),
    delete:  catchAsync(async (req, res, next) => {
        const { id } = req.params;

        await prisma.computer.delete({
            where: { id },
        });

        res.status(204).json({"message": "success"});
    }),
    getByDeviceUuid: catchAsync(async (req, res, next) => {
        const computers = await prisma.computer.findMany({
            where: {
                device: {
                    uuid: req.params.deviceUuid
                }
            },
            include: {
                device: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        })
        res.json(computers);
    })
}