/**
 * Gera o vídeo do escudo em movimento (usado no herói da home).
 *
 * Por que vídeo e não WebGL ao vivo: o GLB tem ~16 MB e o runtime do
 * model-viewer mais ~1 MB. Um MP4/WebM em loop entrega o mesmo resultado
 * visual por uma fração do peso e sem custo de GPU no celular.
 *
 * O balanço reproduz o da logo do site Ortoative: dois senos em eixos
 * diferentes. As frequências são múltiplas do período do loop (2 ciclos na
 * horizontal, 1 na vertical), então a última imagem encosta na primeira e o
 * loop não tem emenda.
 *
 * Para regerar. A página de captura fica em _fonte/; o GLB NÃO é versionado
 * (126 MB, acima do limite do GitHub) — peça o arquivo ao cliente ou exporte
 * de novo no Meshy e salve como _fonte/elite-3d.glb:
 *
 *   mkdir -p public/models && cp _fonte/elite-3d.glb public/models/
 *   cp _fonte/render-escudo.astro src/pages/
 *   npm i -D @google/model-viewer
 *   npm run build && npm run preview -- --port 4399   (noutro terminal)
 *   RENDER_URL=http://localhost:4399/render-escudo node scripts/render-escudo.mjs
 *   # depois desfaça as cópias
 *
 * Importante: renderize contra o preview estático, não contra `astro dev` —
 * o hot reload recarrega a página no meio e mata a captura.
 *
 * Receita de cor (o Meshy entrega o escudo estourando para branco):
 *   1. corrige-dourado-textura.py — contém o brilho e levanta a saturação
 *      SÓ nos pixels quentes, para o prata do escudo não virar dourado.
 *   2. troca-textura-glb.py — devolve a textura corrigida ao .glb sem
 *      recomprimir a geometria.
 *   3. escurece-cinzas-textura.py — baixa os cinzas MÉDIOS (os contornos
 *      prateados vinham lavados). Só pixels neutros, com força em sino no
 *      meio-tom, então o texto branco e os pretos não se movem.
 *   4. ajusta-material-glb.py — metallic 0.14 / roughness 0.60 e, sobretudo,
 *      normalTexture.scale 2.0: é o relevo que tira o ar de massinha. A
 *      rugosidade alta que segurava o estouro era o que achatava o escudo;
 *      com os cinzas já escuros dá para baixá-la de volta.
 *   5. exposure 0.70 na página de captura.
 *
 *   Medido contra a versão anterior: brancos nas letras 10,7% -> 3,3%,
 *   brilho médio 76,0 -> 67,4, cinza do topo do escudo 135,8 -> 117,2 e
 *   nitidez 8,13 -> 8,64 (mais nitidez = menos massinha).
 *   O _fonte/elite-3d.glb já guarda os passos 1 a 4 aplicados.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const URL_RENDER = process.env.RENDER_URL ?? 'http://localhost:4321/render-escudo';
const LARGURA = 1400;
const ALTURA = 1050;
const DURACAO = 18; // segundos do loop
const FPS = 20;
const TOTAL = DURACAO * FPS;
const TMP = join(process.cwd(), '.frames');
const SAIDA = join(process.cwd(), 'public', 'videos');

const AMP_THETA = 22; // ±22° na horizontal (igual à Ortoative)
const BASE_PHI = 86;
const AMP_PHI = 9; // 77°..95° na vertical

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(SAIDA, { recursive: true });

const navegador = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader'],
});
const pagina = await navegador.newPage({
  viewport: { width: LARGURA, height: ALTURA },
  deviceScaleFactor: 1,
});

console.log(`abrindo ${URL_RENDER}`);
await pagina.goto(URL_RENDER, { waitUntil: 'load', timeout: 120_000 });
await pagina.waitForFunction(() => '__pronto' in window, null, { timeout: 120_000 });
await pagina.evaluate(() => window.__pronto);
console.log('modelo carregado; capturando quadros...');

// Captura a página, não o elemento: #palco tem exatamente o tamanho da
// viewport, e a captura de elemento espera "estabilidade" — o que estoura o
// tempo quando a máquina está ocupada, sem que nada esteja errado no quadro.
for (let i = 0; i < TOTAL; i++) {
  const t = i / TOTAL; // 0..1 dentro do loop
  const theta = Math.sin(2 * Math.PI * 2 * t) * AMP_THETA; // 2 ciclos
  const phi = BASE_PHI + Math.sin(2 * Math.PI * t + 1) * AMP_PHI; // 1 ciclo
  await pagina.evaluate(([a, b]) => window.__orbita(a, b), [theta, phi]);
  await pagina.screenshot({ path: join(TMP, `f${String(i).padStart(4, '0')}.png`) });
  if (i % 40 === 0) console.log(`  ${i}/${TOTAL}`);
}
await navegador.close();
console.log('quadros prontos; codificando...');

const ff = (args) => {
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${args.join(' ')}`);
};

const entrada = ['-y', '-framerate', String(FPS), '-i', join(TMP, 'f%04d.png')];

// MP4 (H.264) — funciona em todo lugar, inclusive iOS.
ff([
  ...entrada,
  '-c:v',
  'libx264',
  '-profile:v',
  'high',
  '-crf',
  '24',
  '-preset',
  'slow',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-an',
  join(SAIDA, 'escudo.mp4'),
]);

// Sem WebM: neste conteúdo o VP9 saiu MAIOR que o H.264 (2,2 MB vs 1,8 MB),
// e o MP4 já toca em todos os navegadores. Um arquivo só, o menor deles.

// Primeiro quadro vira o poster (aparece antes de o vídeo começar).
ff([
  '-y',
  '-i',
  join(TMP, 'f0000.png'),
  '-vf',
  'scale=600:-1',
  '-q:v',
  '4',
  join(SAIDA, 'escudo-poster.jpg'),
]);

rmSync(TMP, { recursive: true, force: true });
console.log('pronto: public/videos/escudo.{mp4,webm} + escudo-poster.jpg');
