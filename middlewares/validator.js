const catchAsync = require('catch-async-wrapper-express')
const niv = require('node-input-validator');
const AppError = require('./../utils/appError');

module.exports = rules => {
    return catchAsync(async (req, res, next) => {
        niv.setLang('en');
        niv.extendMessages({ //override existujúcich sprav - len example bo zabudnem
            required: 'The :attribute field must not be empty.',
            email: 'E-mail must be a valid email address.',
            even: 'The value of the field must be even number.',
            status: 'Invalid status'
        }, 'en');

        niv.extend('sumOfFields', ({ value, args }, validator) => { //pridanie vlastného validatora - len example bo zabudnem
            if (args.length !== 2) {
                throw new Error('Invalid seed for rule sumOfFields');
            }

            const anotherValue = Number(validator.inputs[args[0]]);

            const eq = Number(args[1]);

            if ((Number(value) + anotherValue) !== eq) {
                return false;
            }

            return true;
        }); //použije sa potom 'sumOfFields:num2,100|required' - len example bo zabudnem

        niv.addCustomMessages({ //pridanie vlastej - len example bo zabudnem
            'username.required': 'When username attribute required rule failed.',
            username: 'Default message for username attribute.'
        });

        const v = new niv.Validator(req.body, rules);
        const check = await v.check();
        if(!check){
            req.errors = v.errors;
            return next(new AppError('Validation error', 400));
        }
        return next();
    });
}
