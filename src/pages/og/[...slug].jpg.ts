/**
 * Gera no build uma arte de compartilhamento (1200×630) para cada página:
 * foto da página + degradê azul + etiqueta + título + logo.
 * Saída: /og/<caminho-da-pagina>.jpg (a home é /og/home.jpg). JPG para ficar abaixo de 300 KB (limite do WhatsApp).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';
import { artesOg, type ArteOg } from '../../lib/og';
import { caminhoArquivo } from '../../lib/imagens';

export const getStaticPaths: GetStaticPaths = async () =>
  (await artesOg()).map((a) => ({ params: { slug: a.slug || 'home' }, props: { arte: a } }));

const raiz = process.cwd();
const fonte = (arq: string) => readFileSync(`${raiz}/node_modules/@fontsource/${arq}`);
const fontes = [
  { name: 'Barlow Condensed', data: fonte('barlow-condensed/files/barlow-condensed-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Barlow Condensed', data: fonte('barlow-condensed/files/barlow-condensed-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Barlow', data: fonte('barlow/files/barlow-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];
const logoSvg = readFileSync(`${raiz}/src/assets/brand/logo-mono.svg`, 'utf8').replace('fill="currentColor"', 'fill="#ffffff"');
const logo = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

const W = 1200;
const H = 630;
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) => ({
  type,
  props: { style, children, ...extra },
});

async function fundo(arte: ArteOg) {
  const arq = caminhoArquivo(arte.imagem);
  if (!arq) return undefined;
  const buf = await sharp(arq).resize(W, H, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

export const GET: APIRoute = async ({ props }) => {
  const arte = props.arte as ArteOg;
  const foto = await fundo(arte);
  const tamanhoTitulo = arte.titulo.length > 34 ? 78 : arte.titulo.length > 26 ? 90 : 104;

  const arvore = el('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#1b2a54', fontFamily: 'Barlow' }, [
    foto ? el('img', { position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }, undefined, { src: foto, width: W, height: H }) : null,
    // degradê para leitura do texto
    el('div', {
      position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex',
      backgroundImage: 'linear-gradient(90deg, rgba(18,29,61,0.96) 0%, rgba(18,29,61,0.86) 45%, rgba(18,29,61,0.25) 100%)',
    }),
    // moldura interna, como o retângulo do logo
    el('div', { position: 'absolute', top: 24, left: 24, width: W - 48, height: H - 48, display: 'flex', border: '2px solid rgba(255,255,255,0.28)', borderRadius: 4 }),
    // conteúdo
    el('div', { position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px' }, [
      el('img', { width: 190, height: 64 }, undefined, { src: logo, width: 190, height: 64 }),
      el('div', { display: 'flex', flexDirection: 'column', maxWidth: 820 }, [
        el('div', {
          display: 'flex', alignSelf: 'flex-start', alignItems: 'center', gap: 12, marginBottom: 22,
          padding: '8px 18px', border: '2px solid rgba(255,255,255,0.45)', borderRadius: 4,
          fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#cbd8f5',
        }, [el('div', { width: 22, height: 3, backgroundColor: '#cbd8f5' }), arte.eyebrow]),
        el('div', {
          display: 'flex', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: tamanhoTitulo, lineHeight: 0.95,
          textTransform: 'uppercase', color: '#ffffff',
        }, arte.titulo),
        arte.sub ? el('div', { display: 'flex', marginTop: 22, fontSize: 30, color: '#dfe6f5' }, arte.sub) : null,
      ].filter(Boolean)),
      el('div', { display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 26, letterSpacing: 3, color: '#9fb6e6', textTransform: 'uppercase' }, [
        el('div', { width: 36, height: 3, backgroundColor: '#3f68b9' }), 'keeptrack.com.br',
      ]),
    ]),
  ].filter(Boolean));

  const svg = await satori(arvore as never, { width: W, height: H, fonts: fontes });
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
