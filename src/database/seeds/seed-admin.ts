import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { DataSource } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { InvalidSeedInputError } from '../../common/errors/invalid-seed-input.error.js';
import type { SeedAdminResult } from '../../common/interfaces/seed-admin.interface.js';
import { formatValidationErrors } from '../../common/validation/format-validation-errors.js';
import { RegisterDto } from '../../modules/auth/dto/register.dto.js';
import { PasswordService } from '../../modules/auth/password.service.js';

const UPSERT_ADMIN_SQL = `
  INSERT INTO users (email, name, password_hash, role)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    token_version = users.token_version + 1,
    updated_at = now()
  RETURNING id, (xmax = 0) AS created
`;

export const seedAdmin = async (
  dataSource: DataSource,
  raw: RegisterDto,
): Promise<SeedAdminResult> => {
  const input = plainToInstance(RegisterDto, raw);
  const errors = await validate(input);
  if (errors.length > 0) {
    throw new InvalidSeedInputError(
      Object.keys(formatValidationErrors(errors)),
    );
  }

  const passwordHash = await new PasswordService().hash(input.password);
  const [result] = await dataSource.query<SeedAdminResult[]>(UPSERT_ADMIN_SQL, [
    input.email,
    input.name,
    passwordHash,
    UserRole.Admin,
  ]);
  return result;
};
