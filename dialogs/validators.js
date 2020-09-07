var moment = require('moment');

const emailValidator = async (promptContext) => {
    var regex = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return promptContext.recognized.succeeded && regex.test(promptContext.recognized.value);
};

const nameValidator = async (promptContext) => {
    var regex = /^[a-zA-Z ]{2,30}$/;
    return promptContext.recognized.succeeded && regex.test(promptContext.recognized.value);
};

const phoneNumberValidator = async (promptContext) => {
    var regex = /([+]?\d{1,3}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/g;
    return promptContext.recognized.succeeded && regex.test(promptContext.recognized.value);
};

const dateValidator = async (promptContext) => {
    return promptContext.recognized.succeeded &&
    moment(promptContext.recognized.value, 'D/M/YYYY h:mm a').isValid() &&
    (moment(promptContext.recognized.value).unix() > moment().unix());
};

module.exports = { emailValidator, nameValidator, phoneNumberValidator, dateValidator };
