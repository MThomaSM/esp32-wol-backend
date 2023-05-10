var express = require('express');
var router = express.Router();
const authController = require('./../controllers/authController');
const validate = require('./../middlewares/validator');
const checkAuthorization = require('./../middlewares/checkAuthorization');
const deviceController = require("./../controllers/deviceController");
const computerController = require('./../controllers/computerController');
const startlistController = require('./../controllers/startlistController');

router.use(authController.protect);

router.get("/devices/:id?", deviceController.get);
router.post('/devices', validate(deviceController.validationRules), deviceController.post);
router.patch("/devices/:id", checkAuthorization("device", "id", "params", "uuid"), deviceController.patch);
router.delete("/devices/:id", checkAuthorization("device", "id", "params", "uuid"), deviceController.delete);

router.get("/computers/:id?", computerController.get);
router.post('/computers', validate(computerController.validationRules), computerController.post);
router.patch("/computers/:id", checkAuthorization("computer"), computerController.patch);
router.delete("/computers/:id", checkAuthorization("computer"), computerController.delete);
router.get("/computers/byDevice/:deviceUuid", computerController.getByDeviceUuid);

router.get("/startlist/:deviceId", checkAuthorization("device", "deviceId", "params", "uuid"), startlistController.get)
router.post("/startlist/:deviceId/add/:computerId", checkAuthorization("device", "deviceId"),  checkAuthorization("computer", "computerId"), startlistController.addToStartlist);
router.post("/startlist/bulk/:deviceId", checkAuthorization("device", "deviceId"), startlistController.bulkAddToStartlist);
router.delete("/startlist/:id", checkAuthorization("startList"), startlistController.delete) //remove computer from startlist
router.get("/startlist/maclist/:deviceUuid", checkAuthorization("startList", "deviceUuid"), startlistController.maclist)
router.put("/startlist/maclist/:deviceUuid/remove/:macAddress", checkAuthorization("startList", "deviceUuid"), startlistController.updateStartlistByMac)

module.exports = router;
