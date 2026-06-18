import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function globalSetup(): void {
  execSync('npx tsx src/historical-data-fetcher/seed-dev-candles.ts', {
    cwd: path.resolve(__dirname, '../backend'),
    stdio: 'inherit',
  });
}
