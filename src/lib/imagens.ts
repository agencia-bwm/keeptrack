import type { ImageMetadata } from 'astro';

/**
 * O painel (Pages CMS) grava caminhos como "/src/assets/uploads/foto.jpg".
 * Aqui transformamos esse texto na imagem importada, para o Astro otimizar
 * (AVIF/WebP + tamanhos responsivos). URLs https (fotos provisórias do site
 * antigo) passam direto, sem otimização.
 */
const locais = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

export function resolverImagem(src: string): ImageMetadata | string {
  if (/^https?:\/\//.test(src)) {
    // Se a foto antiga já foi baixada pelo script `npm run imagens`, usa a versão local
    const nome = src.split('/wp-content/uploads/')[1];
    if (nome) {
      const local =
        locais[`/src/assets/uploads/legado/${nome}`] ??
        locais[`/src/assets/uploads/legado/${nome.replace(/\.(jpe?g|png)$/i, '.webp')}`];
      if (local) return local.default;
    }
    return src;
  }
  const chave = src.startsWith('/') ? src : `/${src}`;
  const achou = locais[chave];
  if (!achou) throw new Error(`Imagem não encontrada: ${src}`);
  return achou.default;
}
