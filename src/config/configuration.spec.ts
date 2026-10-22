import { envValidationSchema } from './configuration.js';

const baseEnv = {
  DB_USERNAME: 'app',
  DB_DATABASE: 'app',
  JWT_SECRET: 'x'.repeat(32),
};

const productionEnv = {
  ...baseEnv,
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://app.example.com',
  DB_PASSWORD: 'db-secret',
  REDIS_PASSWORD: 'redis-secret',
};

describe('envValidationSchema', () => {
  it('keeps permissive defaults outside production', () => {
    const { error, value } = envValidationSchema.validate(baseEnv);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ CORS_ORIGIN: '*', SWAGGER_ENABLED: true });
  });

  it('disables swagger by default in production', () => {
    const { error, value } = envValidationSchema.validate(productionEnv);

    expect(error).toBeUndefined();
    expect(value.SWAGGER_ENABLED).toBe(false);
  });

  it.each(['CORS_ORIGIN', 'DB_PASSWORD', 'REDIS_PASSWORD'])(
    'requires %s in production',
    (key) => {
      const env: Record<string, string> = { ...productionEnv };
      delete env[key];

      expect(envValidationSchema.validate(env).error).toBeDefined();
    },
  );

  it('rejects wildcard CORS origin in production', () => {
    const { error } = envValidationSchema.validate({
      ...productionEnv,
      CORS_ORIGIN: '*',
    });

    expect(error).toBeDefined();
  });
});
