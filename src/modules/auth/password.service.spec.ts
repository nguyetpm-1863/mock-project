import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with argon2id and verifies the password', async () => {
    const hash = await service.hash('Str0ng!Pass');

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    expect(await service.verify(hash, 'Str0ng!Pass')).toBe(true);
    expect(await service.verify(hash, 'Wr0ng!Pass')).toBe(false);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([
      service.hash('Str0ng!Pass'),
      service.hash('Str0ng!Pass'),
    ]);

    expect(first).not.toBe(second);
  });
});
