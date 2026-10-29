# Víncula · Frontend

**Conversaciones que nos conectan.** Víncula es un espacio web para platicar, compartir cómo te sientes y encontrar compañía, a tu ritmo. Está pensado principalmente para **personas adultas mayores**, y por eso prioriza la sencillez, la legibilidad y el control sobre cada acción. Tus compañeros (Eco, Serena y Leo) son inteligencia artificial, no personas.

🔗 **Demo:** https://vincula-app.netlify.app/

> ⚠️ Víncula es un espacio de compañía y escucha. No reemplaza la atención de un médico, psicólogo o servicio de emergencia.

## Pensado para personas adultas mayores

El diseño parte de las necesidades de este público:

- **Letra grande y legible:** textos de 18 a 22 px como base, con tres niveles de tamaño ajustables.
- **Botones amplios** y con etiqueta de texto, no solo íconos, para facilitar el toque.
- **Alto contraste** opcional.
- **Sin prisas:** el dictado no se corta de golpe y nada se envía sin que la persona revise y confirme.
- **Lenguaje claro y cercano**, sin tecnicismos.
- **Una acción por pantalla**, con navegación predecible y siempre un botón para volver.
- **Honestidad sobre la IA:** en todo momento se aclara que el compañero es una IA y no una persona.
- **Ayuda a la mano:** líneas de apoyo emocional accesibles desde cualquier pantalla.
- **Sin registro:** no hay que crear cuenta, recordar contraseñas ni dar datos personales.
  
## Tecnologías

- HTML, CSS y JavaScript puro (sin frameworks ni dependencias)
- Web Speech API (dictado y síntesis de voz del navegador)
- Tipografía [Inter](https://fonts.google.com/specimen/Inter)
- Desplegado en Netlify
- Backend independiente: [https://github.com/AnaVelez11/compania-bot]

## Estructura

```
vincula/
├── index.html
├── styles.css
├── app.js
└── assets/
    ├── logo.png
    ├── eco.png
    ├── serena.png
    └── leo.png
```
## Privacidad

- No se piden nombre, correo ni teléfono.
- El identificador de sesión es temporal y cambia en cada visita.
- Tus mensajes se envían al servidor y al proveedor de IA para generar las respuestas.
- En Chrome, el dictado por voz lo procesa el proveedor del navegador.

Consulta la pantalla de *Políticas de privacidad* dentro de la app para el detalle completo.

## Compatibilidad

| Función | Chrome / Edge | Safari | Firefox |
|---|---|---|---|
| Chat por texto | ✅ | ✅ | ✅ |
| Dictado por voz | ✅ | ⚠️ Limitado | ❌ (se escribe en el borrador) |
| Respuestas en voz alta | ✅ | ✅ | ✅ |
