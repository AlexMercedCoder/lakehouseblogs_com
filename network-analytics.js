// Alex Merced Network GA4, including existing network consent choices.

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500, region: ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"] });
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });


gtag('js', new Date());
// Report only from the site's own domain: never localhost, Netlify previews, or alias domains.
if (/^(www\.)?lakehouseblogs\.com$/.test(location.hostname)) {
  gtag('config', 'G-4F1DTQJNDM');
}
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('[data-network-event]') : null;
  if (a) gtag('event', a.getAttribute('data-network-event'), { link_url: a.href, link_text: (a.textContent || '').trim(), site: location.hostname });
});
(function () {
  var KEY = 'am-consent';
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var regional = /^Europe\//.test(tz) || /^Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe)$/.test(tz);
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function apply(v) { gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' }); }
  var prior = stored();
  if (prior) apply(prior);
  function show() {
    if (document.getElementById('am-consent')) return;
    var box = document.createElement('div');
    box.id = 'am-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Cookie choices');
    box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:2147483000;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:12px;padding:16px 18px;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
    box.innerHTML = '<p style="margin:0 0 12px">This site uses Google Analytics cookies to count visits and see which pages help. No advertising cookies. Is that OK?</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-v="granted" style="background:#38bdf8;color:#0f172a;border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer">Accept analytics</button>' +
      '<button type="button" data-v="denied" style="background:transparent;color:#f8fafc;border:1px solid #64748b;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer">Decline</button></div>';
    box.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
      if (!v) return;
      save(v); apply(v); box.remove();
    });
    document.body.appendChild(box);
  }
  function open(e) { if (e) e.preventDefault(); show(); }
  function ready() {
    if (regional && !prior) show();
    if (location.hash === '#cookie-settings') show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  window.addEventListener('hashchange', function () { if (location.hash === '#cookie-settings') show(); });
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href$="#cookie-settings"]') : null;
    if (a) open(e);
  });
})();

if (/^(www\.)?lakehouseblogs\.com$/.test(location.hostname)) {
 var gaScript = document.createElement("script"); gaScript.async = true; gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-4F1DTQJNDM"; document.head.appendChild(gaScript);
}
