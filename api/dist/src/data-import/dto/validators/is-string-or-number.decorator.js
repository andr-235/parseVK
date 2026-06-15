var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { registerDecorator, ValidatorConstraint, } from 'class-validator';
let IsStringOrNumberConstraint = class IsStringOrNumberConstraint {
    validate(value) {
        return (value === undefined ||
            value === null ||
            typeof value === 'string' ||
            typeof value === 'number');
    }
    defaultMessage(args) {
        return `${args.property} должно быть строкой или числом`;
    }
};
IsStringOrNumberConstraint = __decorate([
    ValidatorConstraint({ name: 'isStringOrNumber', async: false })
], IsStringOrNumberConstraint);
export function IsStringOrNumber(validationOptions) {
    return function registerIsStringOrNumberDecorator(object, propertyName) {
        registerDecorator({
            name: 'isStringOrNumber',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: IsStringOrNumberConstraint,
        });
    };
}
//# sourceMappingURL=is-string-or-number.decorator.js.map