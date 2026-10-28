import { registerDecorator, type ValidationArguments } from 'class-validator';
import { BLANK_MESSAGE } from '../constants/error-messages.constants.js';

export const RequireAnyField =
  (errorField: string, fields: string[]): ClassDecorator =>
  (target) =>
    registerDecorator({
      name: 'requireAnyField',
      target,
      propertyName: errorField,
      options: { message: BLANK_MESSAGE },
      validator: {
        validate: (_value: unknown, { object }: ValidationArguments) =>
          fields.some(
            (field) => (object as Record<string, unknown>)[field] !== undefined,
          ),
      },
    });
