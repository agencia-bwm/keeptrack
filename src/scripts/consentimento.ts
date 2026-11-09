/**
 * LGPD: banner (vanilla-cookieconsent v3) + Consent Mode v2 + GTM com atraso.
 * O "consent default = denied" fica inline no <head> (BaseLayout), antes de qualquer tag.
 * Este arquivo é carregado sob demanda, depois que a página fica ociosa.
 */
// CSS do banner carregado só quando o banner é carregado (não bloqueia a primeira pintura)
import cssBanner from 'vanilla-cookieconsent/dist/cookieconsent.css?url';
const linkCss = document.createElement('link');
linkCss.rel = 'stylesheet';
linkCss.href = cssBanner;
document.head.appendChild(linkCss);
import * as CookieConsent from 'vanilla-cookieconsent';

declare global {
  interface Window { dataLayer: unknown[]; gtag: (...args: unknown[]) => void; __KT_GTM?: string }
}

let gtmCarregado = false;
function carregarGTM() {
  const id = window.__KT_GTM;
  if (gtmCarregado || !id || id.includes('XXXX')) return; // ID de teste: não carrega
  gtmCarregado = true;
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.appendChild(s);
}

function atualizarConsentimento() {
  const analise = CookieConsent.acceptedCategory('analise');
  const marketing = CookieConsent.acceptedCategory('marketing');
  window.gtag('consent', 'update', {
    analytics_storage: analise ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });
  window.dataLayer.push({ event: 'consentimento_atualizado', analise, marketing });
  carregarGTM();
}

// GTM também carrega na primeira interação (com tudo negado, só pings sem cookie)
['pointerdown', 'keydown', 'scroll'].forEach((ev) =>
  window.addEventListener(ev, carregarGTM, { once: true, passive: true }),
);

CookieConsent.run({
  categories: {
    necessarios: { enabled: true, readOnly: true },
    analise: {},
    marketing: {},
  },
  onConsent: atualizarConsentimento,
  onChange: atualizarConsentimento,
  guiOptions: {
    consentModal: { layout: 'box inline', position: 'bottom left', equalWeightButtons: true },
    preferencesModal: { layout: 'box', equalWeightButtons: true },
  },
  language: {
    default: 'pt',
    translations: {
      pt: {
        consentModal: {
          title: 'Cookies neste site',
          description:
            'Usamos cookies necessários para o site funcionar e, com a sua permissão, cookies de análise e de marketing para entender as visitas e medir anúncios. <a href="/politica-de-privacidade/">Política de privacidade</a>',
          acceptAllBtn: 'Aceitar',
          acceptNecessaryBtn: 'Recusar',
          showPreferencesBtn: 'Preferências',
        },
        preferencesModal: {
          title: 'Preferências de cookies',
          acceptAllBtn: 'Aceitar todos',
          acceptNecessaryBtn: 'Recusar todos',
          savePreferencesBtn: 'Salvar preferências',
          closeIconLabel: 'Fechar',
          sections: [
            { description: 'Escolha quais categorias de cookies você permite. Você pode mudar isso a qualquer momento pelo link no rodapé.' },
            { title: 'Necessários', description: 'Essenciais para o site funcionar e para lembrar a sua escolha de cookies.', linkedCategory: 'necessarios' },
            { title: 'Análise', description: 'Google Analytics 4: medem visitas e páginas mais acessadas, de forma agregada.', linkedCategory: 'analise' },
            { title: 'Marketing', description: 'Meta Pixel e Google Ads: medem o resultado de anúncios e permitem anúncios mais relevantes.', linkedCategory: 'marketing' },
            { title: 'Mais informações', description: 'Dúvidas? Leia a <a href="/politica-de-privacidade/">Política de Privacidade e Cookies</a>.' },
          ],
        },
      },
    },
  },
});
