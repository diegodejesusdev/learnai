# Rediseño visual: vinotinto suizo

**Aprobado por Diego el 24 nov 2026** (maqueta con «Sí, aunque puedes jugar un poco más agresivo», color «rojo vinotinto» y navegador para revisar).

## Qué y por qué
Minimalista, con poco color, muy legible e intuitivo, pero con carácter. Solo frontend.

## Dirección
Base de la skill `ui-ux-pro-max`: estilo *Minimalism & Swiss*, una sola letra (Inter) y base monocroma. Se descartó su primera paleta (turquesa + naranja) y su estructura de página de ventas.

- **Regla de color:** negro = lo que puedes tocar y el marco de la app; vinotinto = lo de ahora y tu avance; gris = lo demás. El rojo anaranjado queda solo para errores y borrar, siempre con ícono y texto.
- **Un bloque vinotinto por pantalla** (`Hero`): lo que toca hacer, con la acción principal en blanco.
- **Letra grande:** títulos de 40 a 64 px, peso 800, números gigantes. Inter con tamaño óptico (misma dependencia).
- **Esquinas rectas, reglas gruesas, sin sombras.** Listas con líneas en vez de tarjetas.
- **Marco negro:** barra lateral, cabecera y barra inferior; lo activo, en un bloque vinotinto.
- **Estados:** vacío (pendiente), medio vinotinto (en curso), lleno negro con check (hecho). Siempre ícono + texto o nombre accesible.

## Límites
- No cambian base de datos, Edge Functions, consultas, claves de caché, ids, direcciones ni textos que den información.
- Sin dependencias nuevas. Colores solo por tokens. 44 px táctiles, 360 px sin desborde, contraste AA en los dos temas (con prueba automática).
- El correo del enlace mágico es de `supabase/` y no se toca.

## Alternativas
1. **Solo colores y letra:** rápida, pero quedan las mismas cajas y botones compitiendo.
2. **Estructura nueva (elegida).**
3. **Cambiar también la navegación:** innecesario; las cinco secciones funcionan.
