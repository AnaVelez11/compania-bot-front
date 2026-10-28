window.VINCULA_CONFIG = {
    API_URL: "https://compania-bot.onrender.com",
    // ID temporal: nuevo en cada visita, no se guarda en el navegador
    USER_ID: "sesion-" + (window.crypto?.randomUUID
        ? crypto.randomUUID().slice(0, 12)
        : Math.random().toString(36).slice(2, 12))
};