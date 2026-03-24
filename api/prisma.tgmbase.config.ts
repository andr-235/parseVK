import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/tgmbase.prisma',
  datasource: {
    url:
      process.env.TGMBASE_DATABASE_URL ?? 'postgresql://localhost:5432/dummy',
  },
});
