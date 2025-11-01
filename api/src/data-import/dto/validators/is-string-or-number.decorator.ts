import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStringOrNumber', async: false })
class IsStringOrNumberConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      value === undefined ||
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number'
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} должно быть строкой или числом`;
  }
}

export function IsStringOrNumber(validationOptions?: ValidationOptions) {
  return function registerIsStringOrNumberDecorator(
    object: object,
    propertyName: string,
  ) {
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
