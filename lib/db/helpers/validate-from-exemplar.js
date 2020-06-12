"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
function validateFromExemplar(toValidate, exemplar) {
    const modelAsPlain = toValidate.get({ plain: true });
    const exemplarInstance = Object.assign(new exemplar(), modelAsPlain);
    // NOTE any asynchronous validations will Be ignored...
    const errors = class_validator_1.validateSync(exemplarInstance, {
        skipMissingProperties: true
    });
    if (errors.length) {
        const res = errors.reduce((str, error) => {
            return str + '\n' + error.toString();
        }, '');
        throw Error(res);
    }
}
exports.validateFromExemplar = validateFromExemplar;
//# sourceMappingURL=validate-from-exemplar.js.map