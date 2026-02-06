import { registerAs } from '@nestjs/config';

export default registerAs('clickhouse', () => ({
  host: process.env.CLICKHOUSE_HOST || 'localhost',
  port: parseInt(process.env.CLICKHOUSE_PORT || '8123', 10),
  database: process.env.CLICKHOUSE_DATABASE || 'parsevk_analytics',
  username: process.env.CLICKHOUSE_USER || 'parsevk',
  password: process.env.CLICKHOUSE_PASSWORD || 'clickhouse_pass',
}));
