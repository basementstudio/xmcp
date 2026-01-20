export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY,
  logLevel: process.env.LOG_LEVEL || 'debug',
});

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiKey?: string;
  logLevel: string;
}
