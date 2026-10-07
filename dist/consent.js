'use strict';

(() => {
  const CONSENT_KEY = 'valg2027-analytics-consent';
  const MEASUREMENT_ID = 'G-JQYJJ96F80';

  function loadAnalytics() {
    if (window.__valg2027AnalyticsLoaded) return;
    window.__valg2027AnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  function saveConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
    document.querySelector('.cookie-consent')?.remove();
    if (value === 'accepted') loadAnalytics();
  }

  function addSettingsLink() {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.cookie-settings')) return;
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'cookie-settings';
    link.textContent = 'Endre cookievalg';
    link.addEventListener('click', () => {
      localStorage.removeItem(CONSENT_KEY);
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      showBanner();
    });
    footer.appendChild(link);
  }

  function showBanner() {
    const banner = document.createElement('section');
    banner.className = 'cookie-consent';
    banner.setAttribute('aria-label', 'Samtykke til analyse');
    banner.innerHTML = '<div class="cookie-consent-copy"><strong>Vi bruker Google Analytics</strong><span>for å se hvor mange som besøker siden.</span></div><div class="cookie-consent-actions"><button type="button" class="cookie-consent-reject">Avslå</button><button type="button" class="cookie-consent-accept">Godta analyse</button></div>';
    banner.querySelector('.cookie-consent-reject').addEventListener('click', () => saveConsent('rejected'));
    banner.querySelector('.cookie-consent-accept').addEventListener('click', () => saveConsent('accepted'));
    document.body.appendChild(banner);
  }

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') loadAnalytics();
  else if (!consent) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner, { once: true });
    else showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSettingsLink, { once: true });
  else addSettingsLink();
})();
