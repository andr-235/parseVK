import { Prisma } from '@/generated/prisma/client';

/**
 * Преобразует значение в формат Prisma InputJsonValue для операций обновления
 *
 * Для операций update:
 * - undefined остается undefined (поле не обновляется)
 * - null преобразуется в Prisma.JsonNull
 * - Остальные значения приводятся к InputJsonValue
 *
 * @param value - Значение для преобразования
 * @returns Prisma InputJsonValue или undefined
 */
export function toUpdateJsonValue(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }
  return value as Prisma.InputJsonValue;
}

/**
 * Преобразует значение в формат Prisma InputJsonValue для операций создания
 *
 * Для операций create:
 * - undefined и null преобразуются в Prisma.JsonNull
 * - Остальные значения приводятся к InputJsonValue
 *
 * @param value - Значение для преобразования
 * @returns Prisma InputJsonValue
 */
export function toCreateJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }
  return value as Prisma.InputJsonValue;
}
