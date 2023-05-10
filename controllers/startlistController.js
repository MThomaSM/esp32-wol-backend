const {PrismaClient} = require("@prisma/client");
const catchAsync = require("catch-async-wrapper-express");
const AppError = require("../utils/appError");

const prisma = new PrismaClient({ log: ['warn', 'error'], errorFormat: 'minimal'}) //minimal / pretty

module.exports = {
    get: catchAsync(async (req, res, next) => {
        const { deviceId } = req.params;
        const user = req.user;

        const startlists = await prisma.startList.findMany({
            where: {
                device: { uuid: deviceId }
            },
            select: {
                computer: {
                    select: {
                        name: true,
                        macAddress: true
                    }
                },
                device: {
                    select: {
                        name: true,
                        uuid: true,
                        updatedAt: true
                    }
                },
                startTime: true,
                id: true,
                executedTime: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        res.json(startlists);
    }),
    addToStartlist: catchAsync(async (req, res, next) => {
        const {deviceId, computerId} = req.params;
        const userId = req.user.id;
        console.log(userId)
        const newStartlist = await prisma.startList.create({
            data: {
                startTime: new Date(),
                user: {
                    connect: {
                        id: userId,
                    },
                },
                device: {
                    connect: {
                        id: deviceId,
                    },
                },
                computer: {
                    connect: {
                        id: computerId,
                    },
                },
            },
            include: {
                computer: true,
                device: true
            }
        });
        return res.json(newStartlist);
    }),
    bulkAddToStartlist: catchAsync(async (req, res, next) => {
        const {deviceId} = req.params;
        const body = req.body;
        const userId = req.user.id;

        const startListData = req.body.map(({ computer, time }) => ({
            deviceId,
            computerId: computer,
            userId: req.user.id,
            startTime: new Date(time),
        }));

        const newStartlists = await prisma.startList.createMany({
            data: startListData
        });

        return res.json(newStartlists);
    }),
    delete:  catchAsync(async (req, res, next) => {
        const { id } = req.params;
        await prisma.startList.delete({
            where: { id },
        });

        res.status(204).json({"message": "success"});
    }),
    maclist: catchAsync(async (req, res, next) => {
        const { deviceUuid } = req.params;

        if (!deviceUuid) {
            return res.status(400).json({ error: "uuid is missing" });
        }

        const startLists = await prisma.startList.findMany({
            where: {
                device: {
                    uuid: deviceUuid
                },
                startTime: {lte: new Date()},
                executedTime: null
            },
            select: {
                computer: {
                    select: {
                        macAddress: true
                    }
                }
            }
        })

        const uniqueMacAddresses = [...new Set(startLists.map(item => item.computer.macAddress))];

        await prisma.device.update({
            where: {
                uuid: deviceUuid,
            },
            data: {
                updatedAt: new Date(),
            }
        });


        res.json(uniqueMacAddresses);
    }),
    updateStartlistByMac: catchAsync(async (req, res, next) => {
        const { deviceUuid, macAddress } = req.params;
        const updated = await prisma.startList.updateMany({
            where: {
                computer: {
                    macAddress: macAddress,
                },
                device: { uuid: deviceUuid },
                executedTime: null,
                startTime: {
                    lte: new Date(),
                },
            },
            data: {
                executedTime: new Date(),
            },
        });
        return res.json({message: "Macaddress "+macAddress+" was successfully removed"});
    })
}