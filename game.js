// ==========================================
// CONFIGURACIÓN INICIAL DE THREE.JS (ESCENA, CÁMARA Y RENDERER)
// ==========================================
// Inicializa el entorno gráfico 3D, la cámara en perspectiva y el motor de renderizado con soporte transparente
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

document.body.appendChild(renderer.domElement);

// ==========================================
// CONFIGURACIÓN RESPONSIVE Y EVENTO RESIZE
// ==========================================
// Detecta si es un dispositivo móvil y actualiza las proporciones de la cámara y el tamaño al cambiar la ventana
const esDispositivoMobile = window.innerWidth <= 768;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// ILUMINACIÓN DE LA ESCENA
// ==========================================
// Añade luz ambiental y luz direccional para iluminar las piezas 3D
const luzAmbiente = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(luzAmbiente);

const luzDireccional = new THREE.DirectionalLight(0xffffff, 3);
luzDireccional.position.set(5, 5, 10);
scene.add(luzDireccional);

// ==========================================
// GESTIÓN DE AUDIO Y EFECTOS SONOROS
// ==========================================
// Configura el listener de audio, la carga del sonido de encaje y la reactivación por políticas del navegador
const listener = new THREE.AudioListener();
camera.add(listener);

const sonidoEncaje = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('imagenes/sonido.mp3', function (buffer) {
    sonidoEncaje.setBuffer(buffer);
    sonidoEncaje.setVolume(0.5);
}, undefined, function (err) {
    console.warn('No se pudo cargar el archivo de audio:', err);
});

function reanudarAudio() {
    if (listener.context && listener.context.state === 'suspended') {
        listener.context.resume();
    }
}

// ==========================================
// PALETAS DE COLOR POR GRUPO
// ==========================================
// Define los colores base y secundario para las auras de los grupos 1 (ámbar) y 2 (blanco)
const coloresZonas = [
    { base: new THREE.Color(0xffd700), secundaria: new THREE.Color(0xff8c00) }, // Grupo 1 (Amarillo / Ámbar)
    { base: new THREE.Color(0xffffff), secundaria: new THREE.Color(0xcccccc) }  // Grupo 2 (Blanco puro / Suave)
];

// ==========================================
// GENERADOR DE RESPLANDOR NEÓN (GLOW HALO)
// ==========================================
// Crea texturas canvas con gradientes radiales para generar las auras brillantes alrededor de las piezas y zonas
function crearAuraPieza(paletaColor, radioSpread = 1.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const hexColor = '#' + paletaColor.base.getHexString();

    gradient.addColorStop(0, hexColor);
    gradient.addColorStop(0.4, hexColor + '88');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(radioSpread * 1.8, radioSpread * 1.8);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const glowMesh = new THREE.Mesh(geometry, material);
    glowMesh.position.z = -0.05;
    return glowMesh;
}

// ==========================================
// FUNCIONES DE UTILIDAD Y SEMILLAS ALEATORIAS
// ==========================================
// Algoritmo PRNG (Mulberry32) y barajado para sincronizar posiciones aleatorias idénticas en multijugador
function mulberry32(semilla) {
    let a = semilla >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function mezclarArreglo(array, rng = Math.random) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function nuevaSemilla() {
    return Math.floor(Math.random() * 2147483647);
}

// ==========================================
// POSICIONES Y ZONAS (ADAPTADAS PARA MÓVIL Y PC)
// ==========================================
// Configura escalas, factores de proporción para laptops/PCs y coordenadas iniciales de las piezas y drop zones
let zonasDrop = [];
let escalaPiezas = esDispositivoMobile ? 0.55 : 1.0;

const anchoVentana = window.innerWidth;
const factorEscalaPC = Math.min(Math.max(anchoVentana / 1440, 0.7), 1.1);

const textureLoader = new THREE.TextureLoader();

const rutasPnsPiezas = [
    'imagenes/pieza1.png',
    'imagenes/pieza2.png',
    'imagenes/pieza3.png',
    'imagenes/pieza4.png',
    'imagenes/pieza5.png',
    'imagenes/pieza6.png',
    'imagenes/pieza7.png',
    'imagenes/pieza8.png'
];

const posicionesBase = esDispositivoMobile
    ? [
        [-1.1, 3.2], [1.1, 3.2],
        [-1.1, 2.2], [1.1, 2.2],
        [-1.1, -2.2], [1.1, -2.2],
        [-1.1, -3.2], [1.1, -3.2]
    ]
    : [
        [-4.5 * factorEscalaPC, 2.5],
        [-6.0 * factorEscalaPC, 0.8],
        [-4.5 * factorEscalaPC, -0.9],
        [-7.5 * factorEscalaPC, -2.6],
        [3.5 * factorEscalaPC, 2.5],
        [6.0 * factorEscalaPC, 0.8],
        [4.5 * factorEscalaPC, -0.9],
        [7.5 * factorEscalaPC, -2.6]
    ];

let posicionesActuales = [];

function generarPosiciones(semilla) {
    const rng = (semilla === null || semilla === undefined) ? Math.random : mulberry32(semilla);
    posicionesActuales = mezclarArreglo(posicionesBase.map(p => [...p]), rng);
}

generarPosiciones(null);

zonasDrop = esDispositivoMobile
    ? [
        { id: "zona-grupo-1", x: 0, y: 0.9, grupo: 1 },
        { id: "zona-grupo-2", x: 0, y: -0.9, grupo: 2 }
      ]
    : [
        { id: "zona-grupo-1", x: -1.3, y: 0, grupo: 1 },
        { id: "zona-grupo-2", x: 1.3, y: 0, grupo: 2 }
      ];

const piezas = [];
const aurasZonasCentrales = [];

zonasDrop.forEach((zona, index) => {
    const radioAura = esDispositivoMobile ? 1.0 : 1.8;
    const colorAura = coloresZonas[index];
    const auraContenedor = crearAuraPieza(colorAura, radioAura);
    auraContenedor.position.set(zona.x, zona.y, -0.2);
    scene.add(auraContenedor);
    aurasZonasCentrales.push(auraContenedor);
});

// ==========================================
// ESTADO MULTIJUGADOR (PEERJS)
// ==========================================
// Variables y funciones para gestionar salas, roles de grupo, permisos de piezas y sincronización de red
const PREFIJO_SALA = "sintonia-oculta-";
const ALFABETO_SALA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

let miGrupo = null;
let peer = null;
let conexion = null;
let esAnfitrion = false;
let codigoSala = "";
let semillaSala = null;
let temporizadorUnion = null;
let ultimoEnvioMovimiento = 0;
let ultimoResetLocal = 0;

function esMia(pieza) {
    return miGrupo === null || pieza.userData.grupo === miGrupo;
}

function actualizarRolVisual() {
    piezas.forEach(p => {
        const malla = p.children[0];
        if (malla && malla.material) {
            malla.material.opacity = esMia(p) ? 1 : 0.5;
        }
    });
}

// ==========================================
// CARGA Y CREACIÓN DE LAS PIEZAS 3D
// ==========================================
// Carga las texturas PNG de cada pieza, genera sus planos 3D y configura sus metadatos
rutasPnsPiezas.forEach((ruta, i) => {
    textureLoader.load(ruta, function (texture) {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const aspect = texture.image.width / texture.image.height;
        const altoBase = 2;
        const anchoBase = altoBase * aspect;
        const planeGeoEspecifico = new THREE.PlaneGeometry(anchoBase, altoBase);

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        const piezaMesh = new THREE.Mesh(planeGeoEspecifico, material);
        const piezaGroup = new THREE.Group();
        piezaGroup.add(piezaMesh);

        piezaGroup.position.set(posicionesActuales[i][0], posicionesActuales[i][1], 0);
        piezaGroup.scale.set(escalaPiezas, escalaPiezas, escalaPiezas);

        const grupoAsignado = i < 4 ? 1 : 2;
        const zonaDestino = zonasDrop.find(z => z.grupo === grupoAsignado);
        const paletaAura = grupoAsignado === 1 ? coloresZonas[0] : coloresZonas[1];
        const aura = crearAuraPieza(paletaAura, 1.0);
        piezaGroup.add(aura);

        piezaGroup.userData = {
            numero: i,
            grupo: grupoAsignado,
            inicial: [posicionesActuales[i][0], posicionesActuales[i][1]],
            destino: [zonaDestino.x, zonaDestino.y],
            zonaId: zonaDestino.id,
            colocada: false,
            aura: aura,
            escalaBase: escalaPiezas,
            tiempoFlotacion: Math.random() * 100,
            arrastrando: false,
            objetivo: null
        };

        scene.add(piezaGroup);
        piezas.push(piezaGroup);
        actualizarRolVisual();
    }, undefined, function (err) {
        console.error('Error al cargar la imagen PNG: ' + ruta, err);
    });
});

function aplicarPosicionesAPiezas() {
    piezas.forEach(p => {
        p.userData.inicial = [...posicionesActuales[p.userData.numero]];
        if (!p.userData.colocada) {
            p.position.x = p.userData.inicial[0];
            p.position.y = p.userData.inicial[1];
        }
    });
}

// ==========================================
// AMULETOS COMPLETADOS (RECOMPENSAS DE ZONA)
// ==========================================
// Carga y prepara las imágenes que se muestran al completar cada grupo de piezas
const rutasAmuletosCompletados = {
    1: 'imagenes/FragCompleto.png',
    2: 'imagenes/Fragmentado.png'
};

const amuletosCompletadosMesh = {};

Object.keys(rutasAmuletosCompletados).forEach(grupoId => {
    const grupoNum = parseInt(grupoId);
    const ruta = rutasAmuletosCompletados[grupoNum];
    const zonaDestino = zonasDrop.find(z => z.grupo === grupoNum);

    textureLoader.load(ruta, function (texture) {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const aspect = texture.image.width / texture.image.height;
        const altoBase = esDispositivoMobile ? 1.5 : 2.8;
        const anchoBase = altoBase * aspect;

        const geometry = new THREE.PlaneGeometry(anchoBase, altoBase);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(zonaDestino.x, zonaDestino.y, 0.1);
        mesh.visible = false;

        mesh.userData = {
            grupo: grupoNum,
            tiempoFlotacion: Math.random() * 100,
            posicionBaseY: zonaDestino.y
        };

        scene.add(mesh);
        amuletosCompletadosMesh[grupoNum] = mesh;
    });
});

// ==========================================
// INTERACCIONES Y RAYCASTER (CLIC Y ARRASTRE)
// ==========================================
// Controla el evento de puntero (mousedown/touchstart, move y up) para seleccionar, mover y soltar piezas 3D
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let piezaSeleccionada = null;
const planoInterseccion = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function actualizarMouse(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener("pointerdown", function (event) {
    reanudarAudio();

    actualizarMouse(event);
    raycaster.setFromCamera(mouse, camera);

    const intersecciones = raycaster.intersectObjects(piezas, true);
    if (intersecciones.length === 0) return;

    let obj = null;
    for (const hit of intersecciones) {
        let candidato = hit.object;
        while (candidato.parent && !piezas.includes(candidato)) {
            candidato = candidato.parent;
        }
        if (piezas.includes(candidato) && !candidato.userData.colocada && esMia(candidato)) {
            obj = candidato;
            break;
        }
    }

    if (!obj) return;

    piezaSeleccionada = obj;
    const esc = piezaSeleccionada.userData.escalaBase * 1.15;
    piezaSeleccionada.scale.set(esc, esc, esc);
    piezaSeleccionada.position.z = 0.5;

    enviar({ t: 'grab', n: piezaSeleccionada.userData.numero });

    if (renderer.domElement.setPointerCapture) {
        renderer.domElement.setPointerCapture(event.pointerId);
    }
});

renderer.domElement.addEventListener("pointermove", function (event) {
    if (piezaSeleccionada === null) return;

    event.preventDefault();

    actualizarMouse(event);
    raycaster.setFromCamera(mouse, camera);

    const punto = new THREE.Vector3();
    const interseccion = raycaster.ray.intersectPlane(planoInterseccion, punto);

    if (interseccion) {
        piezaSeleccionada.position.x = punto.x;
        piezaSeleccionada.position.y = punto.y;
        enviarMovimiento(piezaSeleccionada);
    }
}, { passive: false });

function soltarPieza(event) {
    if (piezaSeleccionada === null) return;

    const pieza = piezaSeleccionada;
    const esc = pieza.userData.escalaBase;
    pieza.scale.set(esc, esc, esc);
    pieza.position.z = 0;
    comprobarPieza(pieza);

    if (event && renderer.domElement.releasePointerCapture && event.pointerId !== undefined) {
        try {
            renderer.domElement.releasePointerCapture(event.pointerId);
        } catch (e) { }
    }

    piezaSeleccionada = null;
}

renderer.domElement.addEventListener("pointerup", soltarPieza);
renderer.domElement.addEventListener("pointercancel", soltarPieza);

// ==========================================
// CONTADOR, COMPROBACIÓN Y VICTORIA
// ==========================================
// Gestiona la lógica de encaje, conteo de amuletos armados, validación de victoria y pantalla final
function actualizarContador() {
    const grupo1Completado = piezas.filter(p => p.userData.grupo === 1).every(p => p.userData.colocada);
    const grupo2Completado = piezas.filter(p => p.userData.grupo === 2).every(p => p.userData.colocada);

    let amuletosArmados = 0;
    if (grupo1Completado) amuletosArmados++;
    if (grupo2Completado) amuletosArmados++;

    const contadorElem = document.getElementById("contador-amuletos");
    if (contadorElem) contadorElem.textContent = amuletosArmados;
}

let temporizadorVictoria = null;

function colocarPieza(pieza, x, y) {
    pieza.position.x = x;
    pieza.position.y = y;
    pieza.userData.colocada = true;

    if (pieza.userData.aura) {
        pieza.userData.aura.visible = false;
    }

    if (sonidoEncaje.buffer) {
        if (sonidoEncaje.isPlaying) sonidoEncaje.stop();
        sonidoEncaje.play();
    }

    const grupoActual = pieza.userData.grupo;
    const piezasDelGrupo = piezas.filter(p => p.userData.grupo === grupoActual);
    const grupoCompletado = piezasDelGrupo.every(p => p.userData.colocada);

    if (grupoCompletado) {
        piezasDelGrupo.forEach(p => { p.visible = false; });
        if (amuletosCompletadosMesh[grupoActual]) {
            amuletosCompletadosMesh[grupoActual].visible = true;
        }
    }

    actualizarContador();
    comprobarVictoria();
}

function comprobarPieza(pieza) {
    const destino = pieza.userData.destino;
    const distancia = Math.sqrt(
        Math.pow(pieza.position.x - destino[0], 2) +
        Math.pow(pieza.position.y - destino[1], 2)
    );

    if (distancia < 1.0) {
        const x = destino[0] + (Math.random() - 0.5) * 0.2;
        const y = destino[1] + (Math.random() - 0.5) * 0.2;
        colocarPieza(pieza, x, y);
        enviar({ t: 'drop', n: pieza.userData.numero, ok: true, x: x, y: y });
    } else {
        pieza.position.x = pieza.userData.inicial[0];
        pieza.position.y = pieza.userData.inicial[1];
        enviar({ t: 'drop', n: pieza.userData.numero, ok: false });
    }
}

function mostrarPantallaVictoria() {
    const pantallaElem = document.getElementById("pantalla-victoria");
    const textoVictoriaElem = document.getElementById("alav-texto-victoria");

    if (textoVictoriaElem) {
        textoVictoriaElem.innerHTML = 'Listo. Todo fluyó y quedó en su lugar. Gracias por compartir este rato, mirá lo que pudimos armar...';
    }

    if (pantallaElem) {
        pantallaElem.classList.add("activa");
    }

    const audioVictoria = document.getElementById("audio-victoria");
    if (audioVictoria) {
        audioVictoria.currentTime = 0;
        audioVictoria.play().catch(error => {
            console.log("No se pudo reproducir el sonido de victoria:", error);
        });
    }
}

function comprobarVictoria() {
    const todasColocadas = piezas.length === 8 && piezas.every(p => p.userData.colocada);

    if (todasColocadas) {
        if (temporizadorVictoria) clearTimeout(temporizadorVictoria);

        temporizadorVictoria = setTimeout(() => {
            temporizadorVictoria = null;
            if (piezas.every(p => p.userData.colocada)) {
                mostrarPantallaVictoria();
            }
        }, 1500);
    }
}



function reproducirIntroYComenzar(callbackContinuar) {
    const overlayIntro = document.getElementById("intro-video-overlay");
    const videoIntro = document.getElementById("video-intro");

    if (!overlayIntro || !videoIntro) {
        if (callbackContinuar) callbackContinuar();
        return;
    }

    // Mostramos la capa del video
    overlayIntro.style.display = "flex";
    setTimeout(() => overlayIntro.classList.add("activo"), 50);

    videoIntro.currentTime = 0;
    videoIntro.play().catch(err => {
        console.log("No se pudo reproducir el video de intro:", err);
        finalizarIntro();
    });

    function finalizarIntro() {
        overlayIntro.classList.remove("activo");
        setTimeout(() => {
            overlayIntro.style.display = "none";
            videoIntro.pause();
            if (callbackContinuar) callbackContinuar();
        }, 800); // Tiempo de desvanecimiento
    }

    // Cuando termina el video normal, arranca el juego
    videoIntro.onended = finalizarIntro;
}







function reiniciarJuego(semillaRemota) {
    const vieneDelCompanero = (typeof semillaRemota === "number");
    const semilla = vieneDelCompanero ? semillaRemota : nuevaSemilla();

    if (!vieneDelCompanero) ultimoResetLocal = performance.now();

    if (temporizadorVictoria) {
        clearTimeout(temporizadorVictoria);
        temporizadorVictoria = null;
    }

    const audioVictoria = document.getElementById("audio-victoria");
    if (audioVictoria) {
        audioVictoria.pause();
        audioVictoria.currentTime = 0;
    }

    piezaSeleccionada = null;

    generarPosiciones(semilla);

    for (const pieza of piezas) {
        pieza.visible = true;
        pieza.userData.inicial = [...posicionesActuales[pieza.userData.numero]];
        pieza.position.x = pieza.userData.inicial[0];
        pieza.position.y = pieza.userData.inicial[1];
        pieza.position.z = 0;
        pieza.userData.colocada = false;
        pieza.userData.arrastrando = false;
        pieza.userData.objetivo = null;
        if (pieza.userData.aura) pieza.userData.aura.visible = true;
        const esc = pieza.userData.escalaBase;
        pieza.scale.set(esc, esc, esc);
    }

    Object.values(amuletosCompletadosMesh).forEach(amuleto => {
        if (amuleto) amuleto.visible = false;
    });

    actualizarContador();

    const pantallaElem = document.getElementById("pantalla-victoria");
    if (pantallaElem) {
        pantallaElem.classList.remove("activa");
    }

    if (!vieneDelCompanero) {
        enviar({ t: 'reset', seed: semilla });
    }
}

// ==========================================
// COMUNICACIÓN COOPERATIVA (PEERJS Y MENSAJES)
// ==========================================
// Controla el envío de paquetes de red, mapeo de coordenadas relativas y eventos de conexión de los jugadores
function enviar(mensaje) {
    if (conexion && conexion.open) {
        conexion.send(mensaje);
    }
}

function enviarMovimiento(pieza) {
    if (!conexion || !conexion.open) return;
    const ahora = performance.now();
    if (ahora - ultimoEnvioMovimiento < 50) return;
    ultimoEnvioMovimiento = ahora;

    const rel = aCoordsRelativas(pieza, pieza.position.x, pieza.position.y);
    enviar({ t: 'move', n: pieza.userData.numero, a: rel[0], b: rel[1] });
}

function aCoordsRelativas(pieza, x, y) {
    const I = pieza.userData.inicial;
    const T = pieza.userData.destino;
    const dx = T[0] - I[0];
    const dy = T[1] - I[1];
    const len2 = (dx * dx + dy * dy) || 1;
    const px = x - I[0];
    const py = y - I[1];
    return [
        (px * dx + py * dy) / len2,
        (px * -dy + py * dx) / len2
    ];
}

function deCoordsRelativas(pieza, a, b) {
    const I = pieza.userData.inicial;
    const T = pieza.userData.destino;
    const dx = T[0] - I[0];
    const dy = T[1] - I[1];
    return [
        I[0] + a * dx - b * dy,
        I[1] + a * dy + b * dx
    ];
}

function piezaPorNumero(n) {
    return piezas.find(p => p.userData.numero === n);
}

function piezaRemota(n) {
    if (miGrupo === null) return null;
    if (!Number.isInteger(n) || n < 0 || n > 7) return null;
    const p = piezaPorNumero(n);
    if (!p || p.userData.grupo === miGrupo) return null;
    return p;
}

function marcarArrastradaPorCompanero(pieza) {
    if (pieza.userData.arrastrando) return;
    pieza.userData.arrastrando = true;
    const esc = pieza.userData.escalaBase * 1.15;
    pieza.scale.set(esc, esc, esc);
    pieza.position.z = 0.5;
}

function soltarPiezaDelCompanero(pieza) {
    pieza.userData.arrastrando = false;
    pieza.userData.objetivo = null;
    const esc = pieza.userData.escalaBase;
    pieza.scale.set(esc, esc, esc);
    pieza.position.z = 0;
}

function numeroValido(v) {
    return typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1000;
}

function procesarMensaje(msg) {
    if (!msg || typeof msg !== "object") return;

    switch (msg.t) {
        case 'init': {
            if (esAnfitrion || !Number.isInteger(msg.seed)) return;
            clearTimeout(temporizadorUnion);
            generarPosiciones(msg.seed);
            aplicarPosicionesAPiezas();
            miGrupo = 2;
            partidaCooperativaLista();
            break;
        }

        case 'grab': {
            const p = piezaRemota(msg.n);
            if (!p || p.userData.colocada) return;
            marcarArrastradaPorCompanero(p);
            p.userData.objetivo = [p.position.x, p.position.y];
            break;
        }

        case 'move': {
            const p = piezaRemota(msg.n);
            if (!p || p.userData.colocada) return;
            if (!numeroValido(msg.a) || !numeroValido(msg.b)) return;
            marcarArrastradaPorCompanero(p);
            p.userData.objetivo = deCoordsRelativas(p, msg.a, msg.b);
            break;
        }

        case 'drop': {
            const p = piezaRemota(msg.n);
            if (!p || p.userData.colocada) return;
            soltarPiezaDelCompanero(p);
            if (msg.ok === true && numeroValido(msg.x) && numeroValido(msg.y)) {
                colocarPieza(p, msg.x, msg.y);
            } else {
                p.position.x = p.userData.inicial[0];
                p.position.y = p.userData.inicial[1];
            }
            break;
        }

        case 'reset': {
            if (!Number.isInteger(msg.seed)) return;
            if (esAnfitrion && performance.now() - ultimoResetLocal < 1000) return;
            reiniciarJuego(msg.seed);
            break;
        }

        case 'lleno': {
            mostrarMensajeSala("Esa sala ya tiene dos jugadores.", true);
            limpiarConexion();
            break;
        }
    }
}

function mostrarMensajeSala(texto, esError) {
    const el = document.getElementById("mensaje-sala");
    if (!el) return;
    if (!texto) {
        el.style.display = "none";
        return;
    }
    el.textContent = texto;
    el.style.display = "block";
    el.classList.toggle("mensaje-ok", !esError);
}

function mostrarCodigoSala(codigo) {
    const bloqueCrear = document.getElementById("bloque-crear");
    const bloqueCodigo = document.getElementById("bloque-codigo-sala");
    const codigoElem = document.getElementById("codigo-sala-mostrado");
    if (bloqueCrear) bloqueCrear.style.display = codigo ? "none" : "block";
    if (bloqueCodigo) bloqueCodigo.style.display = codigo ? "block" : "none";
    if (codigoElem) codigoElem.textContent = codigo || "";
}

function actualizarEstadoSala(mensaje, esError) {
    const el = document.getElementById("estado-sala");
    if (!el) return;

    if (!codigoSala && !mensaje) {
        el.style.display = "none";
        return;
    }

    el.style.display = "block";
    el.classList.toggle("sala-error", !!esError);
    el.textContent = mensaje || ("Sala " + codigoSala + " · Jugador " + miGrupo + (miGrupo === 1 ? " (Grupo 1)" : " (Grupo 2)"));
}

function textoErrorPeer(err) {
    switch (err && err.type) {
        case 'peer-unavailable': return "No existe una sala con ese código.";
        case 'network':
        case 'server-error':
        case 'socket-error':
        case 'socket-closed': return "No se pudo conectar al servidor.";
        case 'browser-incompatible': return "Tu navegador no soporta este modo de juego.";
        default: return "Error de conexión.";
    }
}

function generarCodigoSala() {
    let codigo = "";
    for (let i = 0; i < 4; i++) {
        codigo += ALFABETO_SALA.charAt(Math.floor(Math.random() * ALFABETO_SALA.length));
    }
    return codigo;
}

function limpiarConexion() {
    clearTimeout(temporizadorUnion);
    const c = conexion;
    const p = peer;
    conexion = null;
    peer = null;

    if (c) { try { c.close(); } catch (e) { } }
    if (p) { try { p.destroy(); } catch (e) { } }

    miGrupo = null;
    codigoSala = "";
    semillaSala = null;
    esAnfitrion = false;
    actualizarRolVisual();
    actualizarEstadoSala();
}

function cancelarSala() {
    limpiarConexion();
    generarPosiciones(null);
    aplicarPosicionesAPiezas();
    mostrarCodigoSala("");
    mostrarMensajeSala("");
    
    // Al cancelar la sala y jugar en solitario, lanzamos la intro también:
    reproducirIntroYComenzar(() => {
        const modalSala = document.getElementById("modal-sala");
        if (modalSala) modalSala.style.display = "none";
    });
}

function configurarConexion(c) {
    c.on('data', (datos) => {
        if (c !== conexion) return;
        procesarMensaje(datos);
    });

    c.on('close', () => {
        if (c !== conexion) return;
        alDesconectarseElCompanero();
    });

    c.on('error', () => {
        if (c !== conexion) return;
        alDesconectarseElCompanero();
    });
}

function cuandoEsteAbierta(c, funcion) {
    if (c.open) funcion();
    else c.on('open', funcion);
}

function partidaCooperativaLista() {
    actualizarRolVisual();
    actualizarEstadoSala();
    mostrarMensajeSala("");
    const modalSala = document.getElementById("modal-sala");
    if (modalSala) modalSala.style.display = "none";
}

function alDesconectarseElCompanero() {
    piezas.forEach(p => {
        if (p.userData.arrastrando) {
            soltarPiezaDelCompanero(p);
            if (!p.userData.colocada) {
                p.position.x = p.userData.inicial[0];
                p.position.y = p.userData.inicial[1];
            }
        }
    });

    limpiarConexion();
    actualizarEstadoSala("Tu compañero se desconectó. Podés seguir solo.", true);
}

function crearSala() {
    limpiarConexion();
    reanudarAudio();
    mostrarMensajeSala("Creando sala...", false);
    intentarCrearSala(0);
}

function intentarCrearSala(intento) {
    const codigo = generarCodigoSala();
    const p = new Peer(PREFIJO_SALA + codigo);
    peer = p;
    esAnfitrion = true;

    p.on('open', () => {
        if (p !== peer) return;
        codigoSala = codigo;
        semillaSala = nuevaSemilla();
        generarPosiciones(semillaSala);
        aplicarPosicionesAPiezas();
        miGrupo = 1;
        actualizarRolVisual();
        mostrarCodigoSala(codigo);
        mostrarMensajeSala("");
    });

    p.on('connection', (c) => {
        if (p !== peer) return;

        if (conexion) {
            cuandoEsteAbierta(c, () => {
                c.send({ t: 'lleno' });
                setTimeout(() => { try { c.close(); } catch (e) { } }, 300);
            });
            return;
        }

        conexion = c;
        configurarConexion(c);
        cuandoEsteAbierta(c, () => {
            if (c !== conexion) return;
            c.send({ t: 'init', seed: semillaSala });
            partidaCooperativaLista();
        });
    });

    p.on('disconnected', () => {
        if (p === peer && !p.destroyed) p.reconnect();
    });

    p.on('error', (err) => {
        if (p !== peer) return;
        if (err.type === 'unavailable-id' && intento < 5) {
            peer = null;
            try { p.destroy(); } catch (e) { }
            intentarCrearSala(intento + 1);
            return;
        }
        mostrarMensajeSala(textoErrorPeer(err), true);
        limpiarConexion();
    });
}

function unirseSala(codigoIngresado) {
    const codigo = (codigoIngresado || "").trim().toUpperCase();
    if (codigo.length !== 4) {
        mostrarMensajeSala("El código de sala tiene 4 caracteres.", true);
        return;
    }

    limpiarConexion();
    reanudarAudio();
    mostrarMensajeSala("Conectando...", false);

    const p = new Peer();
    peer = p;
    esAnfitrion = false;
    codigoSala = codigo;

    p.on('open', () => {
        if (p !== peer) return;

        const c = p.connect(PREFIJO_SALA + codigo, { reliable: true, serialization: 'json' });
        conexion = c;
        configurarConexion(c);

        temporizadorUnion = setTimeout(() => {
            if (c !== conexion) return;
            mostrarMensajeSala("No se pudo conectar. Verificá el código o tu conexión.", true);
            limpiarConexion();
        }, 15000);
    });

    p.on('disconnected', () => {
        if (p === peer && !p.destroyed && !conexion) p.reconnect();
    });

    p.on('error', (err) => {
        if (p !== peer) return;
        mostrarMensajeSala(textoErrorPeer(err), true);
        limpiarConexion();
    });
}

function copiarEnlaceSala() {
    if (!codigoSala) return;
    const enlace = location.origin + location.pathname + "?sala=" + codigoSala;
    const boton = document.getElementById("btn-copiar-enlace");

    const avisar = (ok) => {
        if (!boton) return;
        const textoOriginal = "Copiar enlace";
        boton.textContent = ok ? "¡Enlace copiado!" : "No se pudo copiar";
        setTimeout(() => { boton.textContent = textoOriginal; }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(enlace).then(() => avisar(true), () => avisar(false));
    } else {
        avisar(false);
    }
}

// ==========================================
// EVENTOS DE LA INTERFAZ HTML
// ==========================================
// Conecta los botones y formularios del DOM con las funciones lógicas del juego
document.addEventListener("DOMContentLoaded", () => {
    actualizarContador();

    const modalSala = document.getElementById("modal-sala");

    const btnCrearSala = document.getElementById("btn-crear-sala");
    if (btnCrearSala) btnCrearSala.addEventListener("click", crearSala);

    const inputSala = document.getElementById("input-sala");
    const btnUnirse = document.getElementById("btn-unirse-sala");
    if (btnUnirse && inputSala) btnUnirse.addEventListener("click", () => unirseSala(inputSala.value));

    if (inputSala) {
        inputSala.addEventListener("keydown", (e) => {
            if (e.key === "Enter") unirseSala(inputSala.value);
        });
    }

    const btnCopiar = document.getElementById("btn-copiar-enlace");
    if (btnCopiar) btnCopiar.addEventListener("click", copiarEnlaceSala);

    const btnCancelarSala = document.getElementById("btn-cancelar-sala");
    if (btnCancelarSala) btnCancelarSala.addEventListener("click", cancelarSala);

    const codigoDelEnlace = new URLSearchParams(location.search).get("sala");
    if (codigoDelEnlace && inputSala && modalSala) {
        inputSala.value = codigoDelEnlace.trim().toUpperCase().slice(0, 4);
        modalSala.style.display = "flex";
    }

    const btnReiniciarFinal = document.getElementById("reiniciar-final");
    if (btnReiniciarFinal) btnReiniciarFinal.addEventListener("click", () => reiniciarJuego());

    const btnReiniciar = document.getElementById("reiniciar");
    if (btnReiniciar) btnReiniciar.addEventListener("click", () => reiniciarJuego());

    const imagenPista = document.getElementById("imagen-pista");
    const modalZoom = document.getElementById("modal-imagen-ampliada");

    if (imagenPista && modalZoom) {
        imagenPista.addEventListener("click", () => {
            modalZoom.style.display = "flex";
        });

        modalZoom.addEventListener("click", () => {
            modalZoom.style.display = "none";
        });
    }
});

// ==========================================
// BUCLE PRINCIPAL DE ANIMACIÓN (RENDER LOOP)
// ==========================================
// Ejecuta fotograma a fotograma las animaciones de las auras, la flotación de piezas y el renderizado 3D
const clock = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const tiempo = clock.getElapsedTime();

    const grupo1Arrastrando = piezas.some(p => p.userData.grupo === 1 && (p === piezaSeleccionada || p.userData.arrastrando));
    const grupo2Arrastrando = piezas.some(p => p.userData.grupo === 2 && (p === piezaSeleccionada || p.userData.arrastrando));

    aurasZonasCentrales.forEach((aura, index) => {
        const grupoNum = index + 1;
        const estaArrastrandoEsteGrupo = (grupoNum === 1 && grupo1Arrastrando) || (grupoNum === 2 && grupo2Arrastrando);

        if (estaArrastrandoEsteGrupo) {
            const escalaIntensa = 1.15 + Math.sin(tiempo * 6) * 0.18;
            aura.scale.set(escalaIntensa, escalaIntensa, 1);
            if (aura.material) aura.material.opacity = 0.95;
        } else {
            const escalaSuave = 1 + Math.sin(tiempo * 2) * 0.08;
            aura.scale.set(escalaSuave, escalaSuave, 1);
            if (aura.material) aura.material.opacity = 0.65;
        }
    });

    piezas.forEach(pieza => {
        if (pieza.userData.aura) {
            const pulsoAura = 1 + Math.sin(tiempo * 3 + pieza.userData.numero) * 0.12;
            pieza.userData.aura.scale.set(pulsoAura, pulsoAura, 1);
        }

        if (pieza.userData.arrastrando) {
            const o = pieza.userData.objetivo;
            if (o) {
                pieza.position.x += (o[0] - pieza.position.x) * 0.35;
                pieza.position.y += (o[1] - pieza.position.y) * 0.35;
            }
        } else if (!pieza.userData.colocada && pieza !== piezaSeleccionada) {
            pieza.userData.tiempoFlotacion += 0.03;
            const offsetFlotacion = Math.sin(pieza.userData.tiempoFlotacion) * 0.05;
            pieza.position.y = pieza.userData.inicial[1] + offsetFlotacion;
        }
    });

    Object.values(amuletosCompletadosMesh).forEach(amuleto => {
        if (amuleto && amuleto.visible) {
            amuleto.userData.tiempoFlotacion += 0.03;
            amuleto.position.y = amuleto.userData.posicionBaseY + Math.sin(amuleto.userData.tiempoFlotacion) * 0.08;
        }
    });

    renderer.render(scene, camera);
}

animar();

// ==========================================
// TUTORIAL INTERACTIVO DE ALAV
// ==========================================
// Controla la apertura y colapso del cuadro de diálogo de Alav al hacer clic
const tutorialBox = document.getElementById('tutorial-box');
const audioMenu = document.getElementById('audio-menu');

tutorialBox.addEventListener('click', () => {
    tutorialBox.classList.toggle('colapsado');

    if (audioMenu) {
        audioMenu.currentTime = 0;
        audioMenu.play().catch(error => {
            console.log("No se pudo reproducir el audio:", error);
        });
    }
});
