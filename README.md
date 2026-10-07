# Restaurante Acrópolis · Toledo

Web de **Restaurante Acrópolis** (Calle de Dublín, 6 · 45003 Toledo · 925 22 62 38),
restaurante de cocina española.

Hecha con Vite y JavaScript sin frameworks.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/ para subir a cualquier hosting estático
npm run preview   # sirve dist/ en local
```

## Estructura
- `index.html`: contenido de la página y datos estructurados (JSON-LD).
- `src/horario.js`: horario y cálculo de abierto / cierra pronto / cerrado.
- `src/main.js`: banner de estado, horario del día, menú móvil, filtro de platos, galería y animaciones.
- `src/style.css`: estilos.
- `public/fotos/`: fotos en WebP, en tamaño grande y en versión `-sm` para móvil.

## Horario (Google Maps, octubre de 2026)

| Día | Mediodía | Noche |
|---|---|---|
| Lunes | Cerrado | Cerrado |
| Martes | 12:00–17:30 | Cerrado |
| Miércoles a domingo | 12:00–17:30 | 20:30–24:00 |

El banner superior usa siempre la hora de Toledo (`Europe/Madrid`), aunque el visitante esté en otra zona horaria.
Avisa con «Cierra pronto» 30 minutos antes del cierre.

- Si cambia el horario, edita `SCHEDULE` en `src/horario.js` y el bloque JSON-LD de `index.html`.
- Para cierres puntuales (vacaciones, festivos), añade la fecha a `CLOSED_DATES`, por ejemplo `'2026-12-25'`.

## Datos y fotos
- Dirección, teléfono, horario, valoración (4,4 con 810 reseñas) y precio medio (20–30 €): ficha de Google Maps.
- Fotos: publicadas por clientes en Google Maps, redimensionadas y convertidas a WebP.
- Platos: los que aparecen en las fotos y los que se mencionan en las reseñas (pulpo a la brasa, setas empanadas, perdiz a la toledana, menú diario…).
- Opiniones: fragmentos breves de reseñas públicas de Google.

## Pendiente de confirmar con el restaurante
- Precios y carta completa (ahora la web no muestra precios).
- Precio y días del menú diario.
- Nombre exacto del plato `pescado-gratinado` (en la foto parece bacalao gratinado con alioli).
- Si tienen WhatsApp, Instagram o reservas online, para añadir los enlaces.
- Dominio propio. Cuando lo haya, poner la URL absoluta en `og:image`.
