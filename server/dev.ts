/**
 * Local server: serves the production build (dist/) and the same API handler that Vercel runs.
 *   npm run build && npm run serve        (PORT, DATABASE_URL or SQLITE_PATH, ADMIN_TOKEN from the environment)
 */
import express from 'express';
import path from 'node:path';
import handler, { ApiRequest, ApiResponse } from '../api/index.ts';

const app = express();
app.disable('x-powered-by');
app.use('/api', express.json({ limit: '10kb' }));
app.all('/api/*', (req, res) => {
  const adapted: ApiResponse = {
    status(code) {
      res.status(code);
      return adapted;
    },
    setHeader: (n, v) => res.setHeader(n, v),
    send: (b) => res.send(b),
  };
  void handler({ method: req.method, url: req.originalUrl, headers: req.headers, body: req.body } as ApiRequest, adapted);
});
app.use(express.static(path.resolve('dist')));

const port = Number(process.env.PORT || 4173);
app.listen(port, '0.0.0.0', () => console.log(`serving dist/ and /api on http://localhost:${port}`));
