export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string | string[];
  swaggerEnabled: boolean;
  trustProxyHops: number;
}
