class VinculaApp {
    constructor() {
        this.avatarActual = 'Eco';
        this.generoAvatar = { Eco: 'o', Serena: 'a', Leo: 'o' };
        this.perfilesVoz = {
            Eco:    { genero: 'neutra', pitch: 0.95, rate: 0.9 },
            Serena: { genero: 'mujer',  pitch: 1.05, rate: 1.05 },
            Leo:    { genero: 'hombre', pitch: 0.65,  rate: 0.85 }
        };
        this.vocesCache = {};
        this.avatarSeleccionado = this.avatarActual;
        this.origenPrivacidad = 'vista-bienvenida';
        this.origenAyuda = 'vista-inicio';
        this.vistaAnterior = 'vista-inicio';
        this.vistaActual = 'vista-bienvenida';
        this.mediaRecorder = null;
        this.recognition = null;
        this.vozEscuchando = false;
        this.vozTexto = '';
        this.vozEditado = false;
        this.vozSilencio = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.vadSilenceTimeout = null;
        this.efimero = true;

        // Elementos del DOM
        this.chatMensajes = document.getElementById('chat-mensajes');
        this.quickRepliesContainer = document.getElementById('quick-replies-container');
        this.textInputContainer = document.getElementById('text-input-container');
        this.textoInput = document.getElementById('texto-input');

        this.ajustes = this.cargarAjustes();

        this.init();
    }

    init() {
        this.actualizarAvatarUI();
        this.aplicarAjustes();

        // Navegación con data-ir="id-de-la-vista"
        document.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-ir]');
            if (!boton) return;
            e.preventDefault();
            this.cambiarVista(boton.dataset.ir);
        });

        // Teclado
        document.getElementById('btn-escribir')
            ?.addEventListener('click', () => this.mostrarTeclado());
        document.getElementById('btn-enviar')
            ?.addEventListener('click', () => this.enviarTexto());
        this.textoInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.enviarTexto();
            }
        });

        document.querySelectorAll('#vista-seleccion .opcion').forEach((op) => {
            op.addEventListener('click', () => this.seleccionarAvatar(op.dataset.avatar));
        });
        document.getElementById('btn-confirmar-cambio')
            ?.addEventListener('click', () => this.confirmarCambioAvatar());
        const cancelar = () => this.cambiarVista(this.vistaAnterior);
        document.getElementById('btn-cancelar-cambio')?.addEventListener('click', cancelar);
        document.getElementById('btn-sel-volver')?.addEventListener('click', cancelar);

        document.getElementById('btn-ocultar')
            ?.addEventListener('click', () => this.toggleVistaCompanero());

        document.getElementById('btn-efimero')
            ?.addEventListener('click', () => this.toggleEfimero());

        // Entrada de voz
        document.getElementById('btn-hablar')?.addEventListener('click', () => this.iniciarGrabacion());
        document.getElementById('btn-voz-detener')?.addEventListener('click', () => this.detenerGrabacion());
        document.getElementById('btn-voz-regrabar')?.addEventListener('click', () => this.iniciarGrabacion());
        document.getElementById('btn-voz-cancelar')?.addEventListener('click', () => this.cancelarGrabacion());
        document.getElementById('btn-voz-volver')?.addEventListener('click', () => this.cancelarGrabacion());
        document.getElementById('btn-voz-enviar')?.addEventListener('click', () => this.confirmarEnvioVoz());
        document.getElementById('voz-borrador-input')?.addEventListener('input', () => {
            this.vozEditado = true;
            this.actualizarEnvioVoz();
        });
        if (window.speechSynthesis) {
            speechSynthesis.addEventListener?.('voiceschanged', () => { this.vocesCache = {}; });
        }

        // Cambio confirmado
        document.getElementById('btn-conf-continuar')
            ?.addEventListener('click', () => this.volverAlChatTrasCambio());
        document.getElementById('btn-conf-volver')
            ?.addEventListener('click', () => this.cambiarVista('vista-chat'));

        // Políticas de privacidad
        const volverPriv = () => this.cambiarVista(this.origenPrivacidad);
        document.getElementById('btn-priv-volver')?.addEventListener('click', volverPriv);
        document.getElementById('btn-priv-entendido')?.addEventListener('click', volverPriv);

        // Pantalla de ayuda y ajustes
        document.addEventListener('click', (e) => {
            const t = e.target;

            if (t.closest('.ayuda')) return this.abrirAyuda();
            if (t.closest('#btn-ayuda-volver, #btn-ayuda-listo'))
                return this.cambiarVista(this.origenAyuda);

            const esc = t.closest('[data-escala]');
            if (esc) return this.cambiarAjuste('escala', Number(esc.dataset.escala));

            const vel = t.closest('[data-velocidad]');
            if (vel) return this.cambiarAjuste('velocidad', Number(vel.dataset.velocidad));

            if (t.closest('#ay-contraste'))
                return this.cambiarAjuste('contraste', !this.ajustes.contraste);
            if (t.closest('#ay-voz'))
                return this.cambiarAjuste('voz', !this.ajustes.voz);
            if (t.closest('#ay-probar-voz'))
                return this.reproducirTTS(`Hola, soy ${this.avatarActual}. Así sonará mi voz.`, null, true);
        });
    }

    // --- NAVEGACIÓN ---
    cambiarVista(idVista) {
        const destino = document.getElementById(idVista);
        if (!destino) {
            console.warn(`No existe la vista "${idVista}" todavía.`);
            return;
        }
        if (idVista === 'vista-seleccion') {
            const origen = this.vistaActual;
            if (origen === 'vista-inicio' || origen === 'vista-chat') {
                this.vistaAnterior = origen;
            } else if (!this.vistaAnterior || this.vistaAnterior === 'vista-ayuda') {
                this.vistaAnterior = 'vista-inicio';
            }
            this.avatarSeleccionado = this.avatarActual;
            this.actualizarSeleccionUI();
        }
        if (idVista === 'vista-privacidad' && this.vistaActual !== 'vista-privacidad') {
            this.origenPrivacidad = this.vistaActual;
        }

        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        destino.classList.add('activa');
        destino.scrollTop = 0;
        this.vistaActual = idVista;

    }

    iniciarApp() {
        this.cambiarVista('vista-inicio');
    }

    iniciarChat(mensajeInicial = null) {
        if (this.chatMensajes) this.chatMensajes.innerHTML = '';
        if (this.quickRepliesContainer) this.quickRepliesContainer.innerHTML = '';
        this.cambiarVista('vista-chat');

        if (mensajeInicial) {
            this.agregarMensaje('user', mensajeInicial);
            this.enviarAlServidor(mensajeInicial);
        } else {
            this.agregarMensaje('bot', 'Hola. ¿De qué te gustaría hablar hoy?');
        }
    }

    volverAlChatTrasCambio() {
        const hayMensajes = this.chatMensajes && this.chatMensajes.children.length > 0;
        if (!hayMensajes) return this.iniciarChat();

        this.cambiarVista('vista-chat');
        this.agregarMensaje('bot', `Hola, soy ${this.avatarActual}. Seguimos conversando.`);
    }

    // --- AVATARES ---
    seleccionarAvatar(nombre) {
        this.avatarSeleccionado = nombre;
        this.actualizarSeleccionUI();

    }

    actualizarSeleccionUI() {
        const sel = this.avatarSeleccionado;

        document.querySelectorAll('#vista-seleccion .opcion').forEach((op) => {
            const elegido = op.dataset.avatar === sel;
            op.classList.toggle('opcion--elegida', elegido);
            op.setAttribute('aria-pressed', String(elegido));
            const texto = op.querySelector('.opcion-estado-texto');
            if (texto) texto.textContent = elegido ? 'Elegido' : 'Elegir';
        });

        const hayCambio = sel !== this.avatarActual;

        const pendiente = document.getElementById('sel-eleccion-pendiente');
        if (pendiente) {
            pendiente.textContent = hayCambio
                ? `Nueva elección: ${sel}`
                : 'Elige otro compañero para cambiar';
        }

        const confirmar = document.getElementById('btn-confirmar-cambio');
        if (confirmar) confirmar.disabled = !hayCambio;

        const textoCancelar = document.getElementById('sel-cancelar-texto');
        if (textoCancelar) {
            textoCancelar.textContent = this.vistaAnterior === 'vista-chat'
                ? 'Cancelar y volver al chat'
                : 'Cancelar y volver al inicio';
        }

    }

    confirmarCambioAvatar() {
        if (this.avatarSeleccionado === this.avatarActual) return;

        this.avatarActual = this.avatarSeleccionado;
        this.actualizarAvatarUI();
        this.actualizarConfirmacionUI();

        this.cambiarVista('vista-confirmacion');
    }

    actualizarAvatarUI() {
        const nombre = this.avatarActual;
        const ruta = `assets/${nombre.toLowerCase()}.png`;
        const fijarSrc = (id, src) => { const el = document.getElementById(id); if (el) el.src = src; };
        const fijarTexto = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        //Inicio
        fijarSrc('inicio-avatar-header', ruta);
        fijarTexto('inicio-nombre-activo', nombre);
        fijarSrc('inicio-avatar-img', ruta);
        fijarTexto('inicio-avatar-nombre', nombre);

        //Chat
        fijarSrc('chat-avatar-img', ruta);
        fijarSrc('chat-avatar-retrato', ruta);
        fijarTexto('chat-avatar-nombre', nombre);
        fijarTexto('chat-avatar-nombre-pie', nombre);

        //Cambio de compañero
        fijarSrc('sel-avatar-header', ruta);
        fijarTexto('sel-nombre-activo', nombre);
        fijarSrc('sel-actual-img', ruta);
        fijarTexto('sel-actual-nombre', nombre);

        //Voz
        fijarSrc('voz-avatar-header', ruta);
        fijarTexto('voz-nombre-activo', nombre);

        // Confirmación
        fijarSrc('confirm-avatar-header', ruta);
        fijarTexto('confirm-nombre-activo', nombre);

        const retrato = document.getElementById('chat-avatar-retrato');
        if (retrato) retrato.alt = `${nombre}, tu compañero virtual`;
        const chat = document.getElementById('vista-chat');
        if (chat) chat.setAttribute('aria-label', `Conversación con ${nombre}`);

    }

    actualizarConfirmacionUI() {
        const nombre = this.avatarActual;
        const g = this.generoAvatar[nombre] || 'o';          // 'a' o 'o'
        const companero = `compañer${g}`;
        const fijarTexto = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        const img = document.getElementById('confirm-avatar-img');
        if (img) img.src = `assets/${nombre.toLowerCase()}.png`;

        fijarTexto('confirm-avatar-nombre', nombre);
        fijarTexto('confirm-etiqueta', `Nuev${g} ${companero}`);
        fijarTexto('confirm-descripcion',
            `Ahora ${nombre} es tu ${companero}. Su avatar ya está visible en esta pantalla.`);
        fijarTexto('confirm-nota',
            `Volverás al chat con ${nombre} como ${companero} actual.`);
    }

    // --- CHAT Y MENSAJES ---
    agregarMensaje(remitente, texto) {
        const esUsuario = remitente === 'user';

        const articulo = document.createElement('article');
        articulo.className = `burbuja ${esUsuario ? 'burbuja--usuario' : 'burbuja--eco'}`;
        articulo.setAttribute('aria-label',
            esUsuario ? 'Tu mensaje, enviado' : `Mensaje de ${this.avatarActual}`);

        const quien = document.createElement('h2');
        quien.className = 'interlocutor';
        quien.textContent = esUsuario ? 'Tú' : this.avatarActual;

        const parrafo = document.createElement('p');
        parrafo.className = 'mensaje-texto';
        parrafo.textContent = texto;

        articulo.append(quien, parrafo);

        if (esUsuario) {
            const estado = document.createElement('p');
            estado.className = 'estado';
            estado.textContent = 'Enviado';
            articulo.appendChild(estado);
        }

        this.chatMensajes.appendChild(articulo);
        this.scrollToBottom();
    }

    scrollToBottom() {
        setTimeout(() => {
            const zona = document.querySelector('#vista-chat .contenido');
            if (zona) zona.scrollTo({ top: zona.scrollHeight, behavior: 'smooth' });
        }, 100);
    }

    mostrarTeclado() {
        this.textInputContainer.style.display = 'flex';
        this.scrollToBottom();
        this.textoInput.focus();
    }

    toggleVistaCompanero() {
        const vista = document.getElementById('vista-chat');
        const btn = document.getElementById('btn-ocultar');
        const texto = document.getElementById('btn-ocultar-texto');
        if (!vista || !btn) return;

        const oculto = vista.classList.toggle('sin-vista');
        if (texto) texto.textContent = oculto ? 'Mostrar' : 'Ocultar';
        btn.setAttribute('aria-pressed', String(oculto));
        btn.setAttribute('aria-label',
            oculto ? 'Mostrar la vista del compañero' : 'Ocultar la vista del compañero');

        this.scrollToBottom();
    }

    enviarTexto() {
        const texto = this.textoInput.value.trim();
        if (!texto) return;

        this.textoInput.value = '';
        this.agregarMensaje('user', texto);
        this.enviarAlServidor(texto);
    }

    // --- ADICIONAL EFÍMERO---
    toggleEfimero() {
        this.efimero = !this.efimero;
        const estado = this.efimero ? 'ON' : 'OFF';

        const btn = document.getElementById('btn-efimero');
        if (btn) {
            btn.setAttribute('aria-checked', String(this.efimero));
            const texto = btn.querySelector('.interruptor-texto');
            if (texto) texto.textContent = estado;
        }

        const aviso = document.getElementById('aviso-efimero-texto');
        if (aviso) {
            aviso.textContent = this.efimero
                ? 'Con el Modo Efímero ON, la charla no aparece en el historial de la app.'
                : 'Con el Modo Efímero OFF, la charla se guardará en el historial de la app.';
        }

        const tituloSel = document.getElementById('sel-efimero-titulo');
        if (tituloSel) tituloSel.textContent = `Modo Efímero · ${estado}`;
    }

    // --- CONEXIÓN CON EL SERVIDOR ---
    async enviarAlServidor(texto) {
        this.mostrarEscribiendo();
        if (this.quickRepliesContainer) this.quickRepliesContainer.innerHTML = '';

        try {
            const response = await fetch(`${window.VINCULA_CONFIG.API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: window.VINCULA_CONFIG.USER_ID,
                    texto: texto,
                    avatar: this.avatarActual
                })
            });

            if (!response.ok) throw new Error(`Error en el servidor (${response.status})`);

            const data = await response.json();
            this.quitarEscribiendo();

            this.agregarMensaje('bot', data.respuesta_texto);

            if (data.quick_replies && data.quick_replies.length > 0) {
                const tonos = ['primera', 'segunda', 'tercera'];
                data.quick_replies.forEach((reply, i) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `respuesta respuesta--${tonos[Math.min(i, 2)]}`;
                    btn.innerHTML =
                        '<span></span><svg class="icono" aria-hidden="true"><use href="#chevron"></use></svg>';
                    btn.querySelector('span').textContent = reply;
                    btn.onclick = () => {
                        this.agregarMensaje('user', reply);
                        this.enviarAlServidor(reply);
                    };
                    this.quickRepliesContainer.appendChild(btn);
                });
            }

            this.reproducirTTS(data.respuesta_texto, data.vui_config?.tts_speed);

        } catch (error) {
            console.error(error);
            this.quitarEscribiendo();
            this.agregarMensaje('bot', 'Lo siento, tuve un problema de conexión. ¿Podemos intentarlo de nuevo?');
        }
    }

    mostrarEscribiendo() {
        const articulo = document.createElement('article');
        articulo.className = 'burbuja burbuja--eco escribiendo';
        articulo.id = 'indicador-escribiendo';
        articulo.innerHTML =
            '<h2 class="interlocutor"></h2><div class="puntos"><span></span><span></span><span></span></div>';
        articulo.querySelector('h2').textContent = this.avatarActual;
        this.chatMensajes.appendChild(articulo);
        this.scrollToBottom();
    }

    quitarEscribiendo() {
        document.getElementById('indicador-escribiendo')?.remove();
    }

    // --- SÍNTESIS DE VOZ (TTS) ---
    reproducirTTS(texto, _velocidadServidor, forzar = false) {
        if (!window.speechSynthesis) return;
        if (!this.ajustes.voz && !forzar) return;

        const synth = window.speechSynthesis;
        synth.cancel();

        const perfil = this.perfilesVoz[this.avatarActual] || this.perfilesVoz.Eco;
        const voz = this.elegirVoz(perfil.genero);

        const crudas = texto.match(/[^.!?\n]+[.!?]*/g) || [texto];
        const frases = [];
        crudas.map((f) => f.trim()).filter(Boolean).forEach((f) => {
            const ultima = frases[frases.length - 1];
            if (ultima && ultima.length < 60) frases[frases.length - 1] = `${ultima} ${f}`;
            else frases.push(f);
        });

        const token = (this.ttsToken = (this.ttsToken || 0) + 1);

        const leer = (i) => {
            if (i >= frases.length || token !== this.ttsToken) return;
            const u = new SpeechSynthesisUtterance(frases[i]);
            u.lang = voz?.lang || 'es-ES';
            u.rate = this.ajustes.velocidad * perfil.rate;
            u.pitch = perfil.pitch;
            if (voz) u.voice = voz;
            u.onend = () => leer(i + 1);
            u.onerror = () => leer(i + 1);
            synth.speak(u);
        };

        setTimeout(() => leer(0), 80);
    }

    elegirVoz(genero) {
        if (this.vocesCache[genero] !== undefined) return this.vocesCache[genero];

        const orden = ['es-co', 'es-mx', 'es-us', 'es-419', 'es-es'];
        const voces = (window.speechSynthesis?.getVoices() || [])
            .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('es'))
            .sort((a, b) => {
                const rank = (v) => {
                    const i = orden.indexOf(v.lang.toLowerCase().replace('_', '-'));
                    return i === -1 ? 99 : i;
                };
                return rank(a) - rank(b);
            });

        const HOMBRE = /(pablo|raul|raúl|jorge|alvaro|álvaro|diego|juan|carlos|enrique|miguel|male|hombre)/i;
        const MUJER  = /(helena|sabina|elvira|dalia|monica|mónica|paulina|laura|marisol|lucia|lucía|female|mujer)/i;

        let voz = null;
        if (genero === 'hombre') voz = voces.find((v) => HOMBRE.test(v.name));
        else if (genero === 'mujer') voz = voces.find((v) => MUJER.test(v.name));
        else voz = voces.find((v) => !HOMBRE.test(v.name) && !MUJER.test(v.name));

        voz = voz || voces[0] || null;          // respaldo: cualquier voz en español
        if (voces.length) this.vocesCache[genero] = voz;
        return voz;
    }

    // --- ENTRADA DE VOZ (pantalla 4) ---

    setEstadoVoz(estado) {
        const vista = document.getElementById('vista-voz');
        if (vista) vista.dataset.estado = estado;

        const fijar = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        if (estado === 'escuchando') {
            fijar('voz-estado-titulo', 'Escuchando…');
            fijar('voz-estado-sub', 'Sin prisa. Tú decides cuándo parar.');
            fijar('voz-guia-edicion', 'Al detener, podrás corregir este texto.');
        } else {
            fijar('voz-estado-titulo', 'Grabación detenida');
            fijar('voz-estado-sub', 'Revisa tu texto antes de enviarlo.');
            fijar('voz-guia-edicion', 'Puedes corregir este texto antes de enviarlo.');
        }
        this.actualizarEnvioVoz();
    }

    mostrarBorradorVoz(texto) {
        const p = document.getElementById('voz-borrador-texto');
        if (!p) return;
        p.textContent = texto || 'Tus palabras aparecerán aquí…';
        p.classList.toggle('vacio', !texto);
    }

    actualizarEnvioVoz() {
        const vista = document.getElementById('vista-voz');
        const btn = document.getElementById('btn-voz-enviar');
        const estado = document.getElementById('voz-estado-envio');
        const input = document.getElementById('voz-borrador-input');
        if (!vista || !btn) return;

        const revisando = vista.dataset.estado === 'revisando';
        const hayTexto = !!input?.value.trim();
        btn.disabled = !(revisando && hayTexto);

        if (estado) {
            estado.textContent = !revisando
                ? 'Envío no disponible mientras escucho.'
                : hayTexto
                    ? 'Listo. Revisa el texto y confirma.'
                    : 'No se escuchó nada. Escribe o graba de nuevo.';
        }
    }

    reiniciarSilencioVoz(ms) {
        clearTimeout(this.vozSilencio);
        this.vozSilencio = setTimeout(() => this.detenerGrabacion(), ms);
    }

    iniciarGrabacion() {
        // Silencia la voz del compañero para que no se cuele en la grabación
        window.speechSynthesis?.cancel();

        this.cambiarVista('vista-voz');
        this.vozTexto = '';
        this.vozEditado = false;
        const input = document.getElementById('voz-borrador-input');
        if (input) input.value = '';
        this.mostrarBorradorVoz('');

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            // Navegador sin dictado: se puede escribir el texto en el borrador
            this.vozEscuchando = false;
            this.setEstadoVoz('revisando');
            const sub = document.getElementById('voz-estado-sub');
            if (sub) sub.textContent = 'Tu navegador no permite dictado. Escribe tu mensaje abajo.';
            input?.focus();
            return;
        }

        // Cerrar cualquier sesión anterior
        if (this.recognition) {
            this.recognition.onend = null;
            this.recognition.abort();
        }

        const rec = new SR();
        rec.lang = 'es-CO';
        rec.continuous = true;
        rec.interimResults = false;

        rec.onresult = (e) => {
            const ultimo = e.results[e.results.length - 1];
            const texto = ultimo[0].transcript.trim();

            // Si ya había texto de una frase anterior, lo conservamos y añadimos la nueva
            const base = this.vozBase || '';
            this.vozTexto = (base + ' ' + texto).trim();

            if (this.vozEscuchando) {
                this.mostrarBorradorVoz(this.vozTexto);
                this.reiniciarSilencioVoz(3500);
            } else if (!this.vozEditado && input) {
                input.value = this.vozTexto;
                this.actualizarEnvioVoz();
            }
        };

        rec.onerror = (e) => {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                alert('No se pudo acceder al micrófono. Revisa los permisos de tu navegador.');
                this.cancelarGrabacion();
            } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
                console.error('Error de dictado:', e.error);
            }
        };

        rec.onend = () => {
            if (this.vozEscuchando) this.detenerGrabacion();
        };

        this.recognition = rec;
        this.vozEscuchando = true;
        this.setEstadoVoz('escuchando');

        try {
            rec.start();
            this.reiniciarSilencioVoz(10000);      // margen para empezar a hablar
        } catch (err) {
            console.error(err);
        }
    }

    detenerGrabacion() {
        clearTimeout(this.vozSilencio);
        if (!this.vozEscuchando) return;
        this.vozEscuchando = false;

        try { this.recognition?.stop(); } catch (_) { }

        const input = document.getElementById('voz-borrador-input');
        if (input && !this.vozEditado) input.value = this.vozTexto;

        this.setEstadoVoz('revisando');
        input?.focus();
    }

    cancelarGrabacion() {
        clearTimeout(this.vozSilencio);
        this.vozEscuchando = false;
        if (this.recognition) {
            this.recognition.onend = null;
            try { this.recognition.abort(); } catch (_) { }
            this.recognition = null;
        }
        this.cambiarVista('vista-chat');
    }

    confirmarEnvioVoz() {
        const input = document.getElementById('voz-borrador-input');
        const texto = input?.value.trim();
        if (!texto) return;

        this.cancelarGrabacion();      // limpia el dictado y vuelve al chat
        this.agregarMensaje('user', texto);
        this.enviarAlServidor(texto);
    }
    // --- AJUSTES Y AYUDA ---
    cargarAjustes() {
        const base = { escala: 1, contraste: false, voz: true, velocidad: 0.8 };
        try {
            return { ...base, ...JSON.parse(localStorage.getItem('vincula_ajustes') || '{}') };
        } catch (_) {
            return base;
        }
    }

    guardarAjustes() {
        try { localStorage.setItem('vincula_ajustes', JSON.stringify(this.ajustes)); } catch (_) { }
    }

    cambiarAjuste(clave, valor) {
        this.ajustes[clave] = valor;
        if (clave === 'voz' && !valor) window.speechSynthesis?.cancel();
        this.guardarAjustes();
        this.aplicarAjustes();
    }

    aplicarAjustes() {
        const a = this.ajustes;
        const app = document.getElementById('app');
        if (app) {
            app.style.setProperty('--escala', a.escala);
            app.classList.toggle('alto-contraste', a.contraste);
        }

        document.querySelectorAll('[data-escala]').forEach((b) =>
            b.setAttribute('aria-pressed', String(Number(b.dataset.escala) === a.escala)));
        document.querySelectorAll('[data-velocidad]').forEach((b) =>
            b.setAttribute('aria-pressed', String(Number(b.dataset.velocidad) === a.velocidad)));

        document.getElementById('ay-contraste')?.setAttribute('aria-checked', String(a.contraste));
        document.getElementById('ay-voz')?.setAttribute('aria-checked', String(a.voz));
        document.getElementById('ay-velocidad')?.classList.toggle('desactivado', !a.voz);
    }

    abrirAyuda() {
        if (this.vistaActual !== 'vista-ayuda') this.origenAyuda = this.vistaActual;
        this.cambiarVista('vista-ayuda');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new VinculaApp();
});