import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // O `astro preview` é single-thread e o herói serve um vídeo de alguns MB.
  // Com 4 navegadores baixando tudo ao mesmo tempo, o servidor vira gargalo e
  // testes saudáveis estouram o tempo. Dois workers mantêm o paralelismo sem
  // afogar o servidor (em série cada teste leva 3-7s).
  workers: 2,
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
  },
  // Porta própria (4322) e servidor dedicado: os testes rodam sempre contra o
  // build estático, nunca contra o `astro dev` (que compila sob demanda e
  // engasga com vários workers em paralelo).
  webServer: {
    command: 'npm run build && npm run preview -- --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
