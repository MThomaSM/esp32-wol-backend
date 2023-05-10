var express = require('express');
var router = express.Router();
const authController = require('./../controllers/authController');
const validate = require('./../middlewares/validator');

router.post('/signup', validate(authController.signup.validatorRules), authController.signup.post);

router.post('/login', validate(authController.login.validatorRules), authController.login.post);

router.use(authController.protect);

router.post('/updatePassword', validate(authController.updatePassword.validatorRules), authController.updatePassword.post);

module.exports = router;
