export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  keyPrefix: string;
  password?: string;
  tls?: object;
}
