/* ============================================================
   Horario del Restaurante Acrópolis (fuente: Google Maps, oct. 2026)
   Minutos desde las 00:00. Índice = día JS: 0 domingo … 6 sábado.
   1440 = medianoche (cierre a las 24:00).
   ============================================================ */
const H = (h, m = 0) => h * 60 + m;

const MEDIODIA = [H(12), H(17, 30)];
const NOCHE = [H(20, 30), H(24)];

export const SCHEDULE = {
  0: [MEDIODIA, NOCHE], // domingo
  1: [],                // lunes: cerrado
  2: [MEDIODIA],        // martes: solo mediodía
  3: [MEDIODIA, NOCHE], // miércoles
  4: [MEDIODIA, NOCHE], // jueves
  5: [MEDIODIA, NOCHE], // viernes
  6: [MEDIODIA, NOCHE], // sábado
};

// Días de cierre extraordinario (AAAA-MM-DD, hora de Toledo).
export const CLOSED_DATES = [];

export const SOON = 30; // minutos antes del cierre para avisar
export const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const fmt = (min) => {
  if (min === 1440) return '24:00';
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const dur = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Hora actual en Toledo, sea cual sea la zona del visitante. */
export function madridNow(date = new Date()) {
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  const y = +p.year, mo = +p.month, d = +p.day;
  const day = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return { y, mo, d, day, min: (+p.hour % 24) * 60 + +p.minute };
}

/** Fecha AAAA-MM-DD y día de la semana a `offset` días de `now`. */
function dayAt(now, offset) {
  const dt = new Date(Date.UTC(now.y, now.mo - 1, now.d + offset));
  return { iso: dt.toISOString().slice(0, 10), day: dt.getUTCDay() };
}

export function slotsFor(now, offset = 0) {
  const { iso, day } = dayAt(now, offset);
  return CLOSED_DATES.includes(iso) ? [] : SCHEDULE[day];
}

/**
 * Estado actual:
 *  - open / soon: { closeAt, left }
 *  - closed:      { openAt, offset, inMin } (offset = días hasta la próxima apertura)
 */
export function getStatus(now) {
  for (const [o, c] of slotsFor(now, 0)) {
    if (now.min >= o && now.min < c) {
      const left = c - now.min;
      return { state: left <= SOON ? 'soon' : 'open', closeAt: c, left };
    }
  }
  for (let offset = 0; offset <= 14; offset++) {
    for (const [o] of slotsFor(now, offset)) {
      if (offset === 0 && o <= now.min) continue;
      return { state: 'closed', openAt: o, offset, inMin: offset * 1440 + o - now.min };
    }
  }
  return { state: 'closed', openAt: null };
}

export function whenText(now, st) {
  if (st.offset === 0) return 'hoy';
  if (st.offset === 1) return 'mañana';
  return `el ${DAYS[dayAt(now, st.offset).day]}`;
}

/** Texto corto para el banner superior. */
export function bannerText(now, st) {
  if (st.state === 'open') {
    return `<strong>Abierto ahora</strong> · hasta las ${fmt(st.closeAt)}`;
  }
  if (st.state === 'soon') {
    return `<strong>Cierra pronto</strong> · a las ${fmt(st.closeAt)}<span class="status__extra"> (quedan ${dur(st.left)})</span>`;
  }
  if (st.openAt == null) return '<strong>Cerrado</strong> · llama para consultar';
  const extra = st.inMin < 180 ? `<span class="status__extra"> (en ${dur(st.inMin)})</span>` : '';
  return `<strong>Cerrado ahora</strong> · abrimos ${whenText(now, st)} a las ${fmt(st.openAt)}${extra}`;
}

export function slotsText(slots) {
  return slots.length ? slots.map(([o, c]) => `${fmt(o)}–${fmt(c)}`).join(' y ') : 'Cerrado';
}
