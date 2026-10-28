# Víncula - Frontend

Interfaz web de Víncula, un espacio de compañía y conversación para adultos mayores. Conecta con el servidor de IA en Render para ofrecer respuestas empáticas basadas en un protocolo afectivo.

## 🚀 Demo

[**vincula-app.netlify.app**](https://vincula-app.netlify.app/)

## 🛠️ Stack

- **HTML5** semántico
- **CSS3** (variables, responsive, alto contraste)
- **JavaScript (Vanilla)** — Sin frameworks ni build tools
- **Web Speech API** (TTS y dictado por voz)
- **Netlify** (hosting estático)

## 📁 Estructura
vincula-frontend/
├── index.html # 8 pantallas (bienvenida, inicio, chat, voz, selección, confirmación, privacidad, ayuda)
├── styles.css # Paleta, tipografía, componentes y animaciones
├── app.js # Lógica de navegación, fetch al backend, TTS y dictado
├── config.js # URL del backend y generación de user_id
└── assets/ # Imágenes (logo, Eco, Serena, Leo)
