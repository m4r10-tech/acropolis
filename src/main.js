import './style.css';
import {
  DAYS, WEEK_ORDER, SCHEDULE,
  madridNow, getStatus, bannerText, slotsFor, slotsText, fmt, dur, whenText,
} from './horario.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* La barra de navegación se pega justo debajo del banner de estado */
const statusBar = $('#status');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--sh', `${statusBar.offsetHeight}px`);
}).observe(statusBar);

/* ---------- Abierto / cerrado ---------- */
const T_START = 12 * 60; // la línea de tiempo va de 12:00 a 24:00
const T_SPAN = 12 * 60;
const pct = (min) => `${Math.min(100, Math.max(0, ((min - T_START) / T_SPAN) * 100))}%`;

function renderWeek(now) {
  const tbody = $('#week tbody');
  tbody.innerHTML = WEEK_ORDER.map((d) => {
    const isToday = d === now.day;
    const text = isToday ? slotsText(slotsFor(now, 0)) : slotsText(SCHEDULE[d]);
    return `<tr class="${isToday ? 'is-today' : ''}${text === 'Cerrado' ? ' is-closed' : ''}">
      <th scope="row">${DAYS[d]}${isToday ? ' <span class="pill">hoy</span>' : ''}</th>
      <td>${text}</td>
    </tr>`;
  }).join('');
}

function renderToday(now, st) {
  const slots = slotsFor(now, 0);
  $('#today').dataset.state = st.state;
  $('#today-label').textContent = `Hoy, ${DAYS[now.day]} · ${slotsText(slots)}`;

  $('#timeline-track').innerHTML = slots
    .map(([o, c]) => `<span class="timeline__slot" style="left:${pct(o)};right:calc(100% - ${pct(c)})"></span>`)
    .join('');
  const marker = $('#timeline-now');
  const inRange = now.min >= T_START;
  marker.hidden = !inRange;
  if (inRange) marker.style.left = pct(now.min);

  let msg;
  if (st.state === 'open') msg = `Abierto. Cerramos a las ${fmt(st.closeAt)}, dentro de ${dur(st.left)}.`;
  else if (st.state === 'soon') msg = `Últimos minutos: cerramos a las ${fmt(st.closeAt)}.`;
  else if (st.openAt == null) msg = 'Cerrado. Llama para consultar.';
  else msg = `Cerrado. Volvemos a abrir ${whenText(now, st)} a las ${fmt(st.openAt)}.`;
  $('#today-msg').textContent = msg;
}

function tick() {
  const now = madridNow();
  const st = getStatus(now);
  statusBar.dataset.state = st.state;
  $('#status-text').innerHTML = bannerText(now, st);
  renderToday(now, st);
  renderWeek(now);
}

tick();
// Se recalcula al empezar cada minuto y al volver a la pestaña.
setTimeout(() => { tick(); setInterval(tick, 60_000); }, (60 - new Date().getSeconds()) * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

/* ---------- Menú móvil ---------- */
const toggle = $('#nav-toggle');
const menu = $('#nav-menu');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  $('.sr-only', toggle).textContent = open ? 'Cerrar menú' : 'Abrir menú';
  document.body.classList.toggle('menu-open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
matchMedia('(min-width: 861px)').addEventListener('change', () => setMenu(false));

/* Sombra de la barra al hacer scroll */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Filtro de platos ---------- */
const chips = $$('.chip');
chips.forEach((chip) => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  chips.forEach((c) => {
    const on = c === chip;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  $$('#dishes .dish').forEach((d) => {
    d.hidden = f !== 'todos' && d.dataset.cat !== f;
  });
}));

/* ---------- Galería con visor ---------- */
const lb = $('#lightbox');
const lbImg = $('#lightbox-img');
const lbCap = $('#lightbox-cap');
const items = $$('#gallery .gallery__item');
let current = 0;

function show(i) {
  current = (i + items.length) % items.length;
  const item = items[current];
  const alt = $('img', item).alt;
  lbImg.src = item.dataset.full;
  lbImg.alt = alt;
  lbCap.textContent = `${alt} · ${current + 1}/${items.length}`;
}

items.forEach((item, i) => item.addEventListener('click', () => {
  show(i);
  lb.showModal();
  document.body.classList.add('no-scroll');
}));
lb.addEventListener('close', () => {
  document.body.classList.remove('no-scroll');
  items[current]?.focus();
});
lb.addEventListener('click', (e) => {
  const action = e.target.closest('[data-lb]')?.dataset.lb;
  if (action === 'close' || e.target === lb) lb.close();
  else if (action === 'prev') show(current - 1);
  else if (action === 'next') show(current + 1);
});
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});
let touchX = null;
lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* ---------- Aparición suave al hacer scroll ---------- */
const reveals = $$('.reveal');
if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px 15% 0px', threshold: 0 });
  reveals.forEach((el) => io.observe(el));
}

$('#year').textContent = String(new Date().getFullYear());
