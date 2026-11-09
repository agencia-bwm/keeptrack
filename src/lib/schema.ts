/* JSON-LD (schema.org) gerado a partir dos campos do painel */
import type { CollectionEntry } from 'astro:content';
import { formatarTelefone } from './utils';

type Site = CollectionEntry<'config'>['data'];
const abs = (path: string, base: URL) => (/^https?:/.test(path) ? path : new URL(path, base).href);

export const idOrg = (base: URL) => new URL('/#organizacao', base).href;

export function schemaOrganizacao(site: Site, base: URL) {
  return {
    '@type': ['Organization', 'LocalBusiness', 'SportsActivityLocation', 'TravelAgency'],
    '@id': idOrg(base),
    name: site.nome,
    url: base.href,
    logo: new URL('/logo-keeptrack-512.png', base).href,
    image: new URL('/logo-keeptrack-512.png', base).href,
    email: site.email,
    telephone: `+${site.whatsappPrincipal}`,
    description:
      'Treinamentos de técnicas de condução 4x4 em Brotas-SP e expedições off-road guiadas pelo Brasil e pela América do Sul.',
    address: { '@type': 'PostalAddress', addressLocality: site.cidade, addressRegion: site.uf, addressCountry: 'BR' },
    geo: { '@type': 'GeoCoordinates', latitude: site.local.lat, longitude: site.local.lng },
    areaServed: ['BR', 'South America'],
    sameAs: [site.instagram, site.facebook],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${site.whatsappPrincipal}`,
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
      description: `WhatsApp ${formatarTelefone(site.whatsappPrincipal)}`,
    },
  };
}

export function schemaWebSite(base: URL) {
  return {
    '@type': 'WebSite',
    '@id': new URL('/#site', base).href,
    url: base.href,
    name: 'KeepTrack 4x4',
    inLanguage: 'pt-BR',
    publisher: { '@id': idOrg(base) },
  };
}

export function schemaBreadcrumb(itens: { nome: string; url: string }[], base: URL) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.nome,
      item: abs(i.url, base),
    })),
  };
}

export function schemaFaq(faq: { pergunta: string; resposta: string }[]) {
  if (!faq.length) return [];
  return [
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.pergunta,
        acceptedAnswer: { '@type': 'Answer', text: f.resposta },
      })),
    },
  ];
}

const isoDia = (d: Date) => d.toISOString().slice(0, 10);

export function schemaViagem(v: CollectionEntry<'viagens'>, status: string, url: string, imagem: string, base: URL) {
  const d = v.data;
  const disponibilidade =
    status === 'proxima' ? 'https://schema.org/InStock' : status === 'esgotada' ? 'https://schema.org/SoldOut' : 'https://schema.org/Discontinued';
  return {
    '@type': 'TouristTrip',
    '@id': `${url}#viagem`,
    name: d.titulo,
    description: d.resposta,
    url,
    image: abs(imagem, base),
    touristType: 'Viajantes off-road com veículo 4x4',
    provider: { '@id': idOrg(base) },
    startDate: isoDia(d.inicio),
    endDate: isoDia(d.fim),
    itinerary: d.roteiro.length
      ? {
          '@type': 'ItemList',
          itemListElement: d.roteiro.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'TouristAttraction', name: `Dia ${r.dia}: ${r.titulo}`, description: r.descricao },
          })),
        }
      : { '@type': 'ItemList', itemListElement: d.destinos.map((n, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Place', name: n } })) },
    offers: {
      '@type': 'Offer',
      availability: disponibilidade,
      priceCurrency: 'BRL',
      ...(d.preco?.valor ? { price: d.preco.valor } : {}),
      url,
      seller: { '@id': idOrg(base) },
    },
  };
}

export function schemaCurso(
  t: CollectionEntry<'treinamentos'>,
  turmas: { data: Date; local?: string }[],
  url: string,
  base: URL,
  instrutores: { nome: string }[],
) {
  const d = t.data;
  return {
    '@type': 'Course',
    '@id': `${url}#curso`,
    name: d.titulo,
    description: d.resposta,
    url,
    inLanguage: 'pt-BR',
    provider: { '@id': idOrg(base) },
    educationalLevel: d.nivel,
    timeRequired: d.cargaHoraria,
    teaches: d.conteudo,
    coursePrerequisites: d.requisitos,
    ...(d.preco?.valor
      ? { offers: { '@type': 'Offer', price: d.preco.valor, priceCurrency: 'BRL', category: 'Paid' } }
      : { offers: { '@type': 'Offer', category: 'Paid', priceCurrency: 'BRL', url } }),
    hasCourseInstance: turmas.map((tu) => ({
      '@type': 'CourseInstance',
      courseMode: 'Onsite',
      startDate: isoDia(tu.data),
      endDate: isoDia(tu.data),
      location: { '@type': 'Place', name: tu.local ?? d.local, address: { '@type': 'PostalAddress', addressLocality: 'Brotas', addressRegion: 'SP', addressCountry: 'BR' } },
      ...(instrutores.length ? { instructor: instrutores.map((i) => ({ '@type': 'Person', name: i.nome })) } : {}),
    })),
  };
}

export function schemaPost(p: CollectionEntry<'blog'>, autor: CollectionEntry<'equipe'>['data'], url: string, imagem: string, base: URL) {
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: p.data.titulo,
    description: p.data.resumo,
    image: abs(imagem, base),
    datePublished: p.data.publicado.toISOString(),
    dateModified: (p.data.atualizado ?? p.data.publicado).toISOString(),
    inLanguage: 'pt-BR',
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: autor.nome, jobTitle: autor.cargo, url: new URL('/a-keeptrack/#equipe', base).href },
    publisher: { '@id': idOrg(base) },
  };
}

export function schemaPessoa(e: CollectionEntry<'equipe'>['data'], imagem: string, base: URL) {
  return {
    '@type': 'Person',
    name: e.nome,
    jobTitle: e.cargo,
    description: e.bio,
    image: abs(imagem, base),
    knowsAbout: e.credenciais,
    worksFor: { '@id': idOrg(base) },
  };
}
