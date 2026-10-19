import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Dev-only: POST /__snap?name=foo with a PNG data URL body → .snaps/foo.png (for automated visual checks). */
function snapshots(): Plugin {
  return {
    name: 'sfh-snapshots',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__snap', (req, res) => {
        const name = (new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'snap').replace(/[^\w.-]/g, '_');
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const dir = join(process.cwd(), '.snaps');
          mkdirSync(dir, { recursive: true });
          const b64 = body.slice(body.indexOf(',') + 1);
          writeFileSync(join(dir, `${name}.png`), Buffer.from(b64, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  // Relative URLs so the build works from any sub-path (e.g. GitHub Pages /strike-force-heroes/).
  base: './',
  plugins: [snapshots()],
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    target: 'es2022',
    assetsDir: 'build', // keep Vite's output apart from the game's public/assets/
    chunkSizeWarningLimit: 2000,
    // The symbol viewer (viewer.html) is a dev-server tool and is not part of the published build.
    rollupOptions: { input: { main: 'index.html' } },
  },
});
