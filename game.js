// ==========================================
// PUZZLE DE LA SINTONÍA OCULTA (8 PIEZAS PNG) - game.js
// ==========================================

// Configuración de Código Premium
const CODIGO_CORRECTO = "ALAV-2026";
let esModoPremium = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151515);

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

document.body.appendChild(renderer.domElement);

// ==========================================
// CONFIGURACIÓN RESPONSIVE / MOBILE
// ==========================================
const esDispositivoMobile = window.innerWidth <= 768;

// ------------------------------------------
// 1. CARGA DE FONDO
// ------------------------------------------
const textureLoader = new THREE.TextureLoader();
let backgroundMesh;
let rutaFondoSeleccionada = esDispositivoMobile ? 'imagenes/fondocelu.png' : 'imagenes/upa.png';

textureLoader.load(rutaFondoSeleccionada, function(texture) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });
    backgroundMesh = new THREE.Mesh(geometry, material);
    
    backgroundMesh.position.z = -15;
    scene.add(backgroundMesh);

    function resizeBackground() {
        const imageAspect = texture.image.width / texture.image.height;
        const screenAspect = window.innerWidth / window.innerHeight;

        backgroundMesh.scale.x = screenAspect > imageAspect ? screenAspect * 30 : imageAspect * 30;
        backgroundMesh.scale.y = screenAspect > imageAspect ? 30 : (30 / imageAspect) * screenAspect;
    }

    resizeBackground();
    window.addEventListener('resize', resizeBackground);
}, undefined, function(error) {
    console.error('Error al cargar la imagen de fondo:', error);
});

// ------------------------------------------
// LUCES
// ------------------------------------------
const luzAmbiente = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(luzAmbiente);

const luzDireccional = new THREE.DirectionalLight(0xffffff, 3);
luzDireccional.position.set(5, 5, 10);
scene.add(luzDireccional);

// ------------------------------------------
// AUDIO Y EFECTOS DE SONIDO
// ------------------------------------------
const listener = new THREE.AudioListener();
camera.add(listener);

const sonidoEncaje = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('imagenes/sonido.mp3', function(buffer) {
    sonidoEncaje.setBuffer(buffer);
    sonidoEncaje.setVolume(0.5);
}, undefined, function(err) {
    console.warn('No se pudo cargar el archivo de audio:', err);
});

// ------------------------------------------
// PALETAS DE COLOR POR GRUPO (8 PIEZAS / 2 ZONAS CENTRALES)
// ------------------------------------------
const coloresZonas = [
    { base: new THREE.Color(0x00d2ff), secundaria: new THREE.Color(0x0055ff) }, // Grupo 1 (Piezas 1,2,3,4)
    { base: new THREE.Color(0xe024ff), secundaria: new THREE.Color(0x7a00ff) }  // Grupo 2 (Piezas 5,6,7,8)
];

// ------------------------------------------
// RESPLANDOR NEÓN (GLOW HALO)
// ------------------------------------------
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

// ------------------------------------------
// POSICIONES Y ZONAS
// ------------------------------------------
let posicionesIniciales = [];
let zonasDrop = [];
let escalaPiezas = esDispositivoMobile ? 0.75 : 1.0;

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

if (esDispositivoMobile) {
    posicionesIniciales = [
        [-1.4, 3.4], [1.4, 3.4],
        [-1.4, 2.3], [1.4, 2.3],
        [-1.4, -2.3], [1.4, -2.3],
        [-1.4, -3.4], [1.4, -3.4]
    ];
} else {
    posicionesIniciales = [
        [-4.5, 2.5],  // Izq 1 (pieza1)
        [-6, 0.8],    // Izq 2 (pieza2)
        [-4.5, -0.9], // Izq 3 (pieza3)
        [-7.5, -2.6], // Izq 4 (pieza4)
        [3.5, 2.5],   // Der 1 (pieza5)
        [6, 0.8],     // Der 2 (pieza6)
        [4.5, -0.9],  // Der 3 (pieza7)
        [7.5, -2.6]   // Der 4 (pieza8)
    ];
}

// Modifica estas coordenadas x e y si quieres mover la posición central a mano
zonasDrop = [
    { id: "zona-grupo-1", x: -1.3, y: 0, grupo: 1 },
    { id: "zona-grupo-2", x: 1.3, y: 0, grupo: 2 }
];

const piezas = [];
const aurasZonasCentrales = [];

zonasDrop.forEach((zona, index) => {
    const radioAura = esDispositivoMobile ? 1.2 : 1.8;
    const colorAura = coloresZonas[index];
    const auraContenedor = crearAuraPieza(colorAura, radioAura);
    auraContenedor.position.set(zona.x, zona.y, -0.2);
    scene.add(auraContenedor);
    aurasZonasCentrales.push(auraContenedor);
});

// ------------------------------------------
// CARGAR PIEZAS PNG (RESPETANDO PROPORCIONES)
// ------------------------------------------
rutasPnsPiezas.forEach((ruta, i) => {
    textureLoader.load(ruta, function(texture) {
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

        piezaGroup.position.set(posicionesIniciales[i][0], posicionesIniciales[i][1], 0);
        piezaGroup.scale.set(escalaPiezas, escalaPiezas, escalaPiezas);

        const grupoAsignado = i < 4 ? 1 : 2;
        const zonaDestino = zonasDrop.find(z => z.grupo === grupoAsignado);
        const paletaAura = grupoAsignado === 1 ? coloresZonas[0] : coloresZonas[1];
        const aura = crearAuraPieza(paletaAura, 1.2);
        piezaGroup.add(aura);

        piezaGroup.userData = {
            numero: i,
            grupo: grupoAsignado,
            inicial: [posicionesIniciales[i][0], posicionesIniciales[i][1]],
            destino: [zonaDestino.x, zonaDestino.y],
            zonaId: zonaDestino.id,
            colocada: false,
            aura: aura,
            escalaBase: escalaPiezas,
            tiempoFlotacion: Math.random() * 100
        };

        scene.add(piezaGroup);
        piezas.push(piezaGroup);
    }, undefined, function(err) {
        console.error('Error al cargar la imagen PNG: ' + ruta, err);
    });
});

// ------------------------------------------
// AMULETOS COMPLETADOS
// ------------------------------------------
const rutasAmuletosCompletados = {
    1: 'imagenes/FragCompleto.png',
    2: 'imagenes/Fragmentado.png'
};

const amuletosCompletadosMesh = {};

Object.keys(rutasAmuletosCompletados).forEach(grupoId => {
    const grupoNum = parseInt(grupoId);
    const ruta = rutasAmuletosCompletados[grupoNum];
    const zonaDestino = zonasDrop.find(z => z.grupo === grupoNum);

    textureLoader.load(ruta, function(texture) {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const aspect = texture.image.width / texture.image.height;
        const altoBase = esDispositivoMobile ? 2.2 : 2.8;
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

// ------------------------------------------
// INTERACCIONES Y RAYCASTER
// ------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let piezaSeleccionada = null;
const planoInterseccion = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function actualizarMouse(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    // Soporta tanto eventos del mouse como eventos de toque/pointer en mobile
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener("pointerdown", function(event) {
    actualizarMouse(event);
    raycaster.setFromCamera(mouse, camera);

    const intersecciones = raycaster.intersectObjects(piezas, true);
    if (intersecciones.length === 0) return;

    let obj = intersecciones[0].object;
    while (obj.parent && !piezas.includes(obj)) {
        obj = obj.parent;
    }

    if (!obj || obj.userData.colocada) return;

    piezaSeleccionada = obj;
    const esc = piezaSeleccionada.userData.escalaBase * 1.15;
    piezaSeleccionada.scale.set(esc, esc, esc);
    
    // Bloquea el puntero al canvas para no perderlo al arrastrar rápido en Android
    if (renderer.domElement.setPointerCapture) {
        renderer.domElement.setPointerCapture(event.pointerId);
    }
});

renderer.domElement.addEventListener("pointermove", function(event) {
    if (piezaSeleccionada === null) return;

    // Evita que Android interprete el arrastre como scroll o pull-to-refresh
    event.preventDefault();

    actualizarMouse(event);
    raycaster.setFromCamera(mouse, camera);

    const punto = new THREE.Vector3();
    raycaster.ray.intersectPlane(planoInterseccion, punto);

    if (punto) {
        piezaSeleccionada.position.x = punto.x;
        piezaSeleccionada.position.y = punto.y;
    }
}, { passive: false }); // { passive: false } es VITAL para que preventDefault funcione en Android

function soltarPieza(event) {
    if (piezaSeleccionada === null) return;

    const pieza = piezaSeleccionada;
    const esc = pieza.userData.escalaBase;
    pieza.scale.set(esc, esc, esc);
    comprobarPieza(pieza);

    if (event && renderer.domElement.releasePointerCapture && event.pointerId !== undefined) {
        try {
            renderer.domElement.releasePointerCapture(event.pointerId);
        } catch (e) {
            // Ignorar si ya se había liberado automáticamente
        }
    }

    piezaSeleccionada = null;
}

renderer.domElement.addEventListener("pointerup", soltarPieza);
renderer.domElement.addEventListener("pointercancel", soltarPieza); // Android usa pointercancel si una notificación o gesto interrumpe el toque

// ------------------------------------------
// FUNCIONES DEL MODAL DE CÓDIGO PREMIUM
// ------------------------------------------
function validarCodigo() {
    const inputElem = document.getElementById("input-codigo");
    const mensajeError = document.getElementById("mensaje-error");

    if (!inputElem) return;

    // Extraemos el texto real del input
    const codigoIngresado = inputElem.value.trim().toUpperCase();

    if (codigoIngresado === CODIGO_CORRECTO) {
        esModoPremium = true;
        cerrarModalInicio();
    } else if (mensajeError) {
        mensajeError.style.display = "block";
    }
}

function iniciarJuegoNormal() {
    esModoPremium = false;
    cerrarModalInicio();
}

function cerrarModalInicio() {
    const modal = document.getElementById("modal-inicio");
    if (modal) modal.style.display = "none";
}

// ------------------------------------------
// CONTADOR Y REINICIO POR GRUPO
// ------------------------------------------
function actualizarContador() {
    const grupo1Completado = piezas.filter(p => p.userData.grupo === 1).every(p => p.userData.colocada);
    const grupo2Completado = piezas.filter(p => p.userData.grupo === 2).every(p => p.userData.colocada);

    let amuletosArmados = 0;
    if (grupo1Completado) amuletosArmados++;
    if (grupo2Completado) amuletosArmados++;

    const contadorElem = document.getElementById("contador-amuletos");
    if (contadorElem) contadorElem.textContent = amuletosArmados;
}
function reiniciarGrupo(numGrupo) {
    const piezasDelGrupo = piezas.filter(p => p.userData.grupo === numGrupo);
    piezasDelGrupo.forEach(pieza => {
        pieza.visible = true;
        pieza.position.x = pieza.userData.inicial[0];
        pieza.position.y = pieza.userData.inicial[1];
        pieza.userData.colocada = false;
        if (pieza.userData.aura) pieza.userData.aura.visible = true;
        const esc = pieza.userData.escalaBase;
        pieza.scale.set(esc, esc, esc);
    });

    if (amuletosCompletadosMesh[numGrupo]) {
        amuletosCompletadosMesh[numGrupo].visible = false;
    }

    actualizarContador();
}

// ------------------------------------------
// LÓGICA DE COMPROBACIÓN Y VICTORIA
// ------------------------------------------
function comprobarPieza(pieza) {
    const destino = pieza.userData.destino;
    const distancia = Math.sqrt(
        Math.pow(pieza.position.x - destino[0], 2) +
        Math.pow(pieza.position.y - destino[1], 2)
    );

    if (distancia < 1.2) {
        pieza.position.x = destino[0] + (Math.random() - 0.5) * 0.4;
        pieza.position.y = destino[1] + (Math.random() - 0.5) * 0.4;
        pieza.userData.colocada = true;

        if (pieza.userData.aura) {
            pieza.userData.aura.visible = false;
        }

        if (sonidoEncaje.buffer) {
            if (sonidoEncaje.isPlaying) sonidoEncaje.stop();
            sonidoEncaje.play();
        }

        // Al completarse las 4 piezas, ocultar piezas y mostrar amuleto completo al instante
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
    } else {
        pieza.position.x = pieza.userData.inicial[0];
        pieza.position.y = pieza.userData.inicial[1];
    }
}

function comprobarVictoria() {
    const todasColocadas = piezas.length === 8 && piezas.every(p => p.userData.colocada);
    
    if (todasColocadas) {
        
        setTimeout(() => {
            const pantallaElem = document.getElementById("pantalla-victoria");
            const imagenPista = document.getElementById("imagen-pista");
            const contenedorRecompensa = document.querySelector(".contenedor-recompensa");
            const textoVictoriaElem = document.getElementById("alav-texto-victoria");

            let codigoElem = document.getElementById("codigo-recompensa");
            if (!codigoElem && contenedorRecompensa) {
                codigoElem = document.createElement("div");
                codigoElem.id = "codigo-recompensa";
                codigoElem.style.cssText = "font-size: 2.8rem; font-weight: bold; color: #00d2ff; text-shadow: 0 0 12px rgba(0,210,255,0.6); padding: 10px 20px; border: 2px dashed #00d2ff; background: rgba(0,0,0,0.5); border-radius: 8px; letter-spacing: 4px; margin: 15px 0;";
                contenedorRecompensa.insertBefore(codigoElem, document.getElementById("reiniciar-final"));
            }

            if (esModoPremium) {
                // Modo Imagen / Pista (Premium)
                if (imagenPista) imagenPista.style.display = "block";
                if (codigoElem) codigoElem.style.display = "none";
                if (textoVictoriaElem) {
                    textoVictoriaElem.innerHTML = '¡Bien hecho! Has reunido todos los amuletos y la energía ha vuelto a fluir. Como recompensa por tu hazaña, te revelaré un secreto que solo los verdaderos <strong>Alaryums</strong> conocemos...';
                }
            } else {
                // Modo Código (Normal)
                if (imagenPista) imagenPista.style.display = "none";
                if (codigoElem) {
                    codigoElem.style.display = "block";
                    codigoElem.textContent = CODIGO_CORRECTO;
                }
                if (textoVictoriaElem) {
                    textoVictoriaElem.innerHTML = '¡Increíble esfuerzo! La sintonía ha vuelto a fluir. Como recompensa, te entrego este <strong>Código Premium</strong>. Compartí el juego con tus amigos e ingresen con él para revelar la pista oculta...';
                }
            }

            if (pantallaElem) {
                pantallaElem.classList.add("activa");
            }

            // REPRODUCIR SONIDO DE VICTORIA
            const audioVictoria = document.getElementById("audio-victoria");
            if (audioVictoria) {
                audioVictoria.currentTime = 0;
                audioVictoria.play().catch(error => {
                    console.log("No se pudo reproducir el sonido de victoria:", error);
                });
            }

        }, 2000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarContador();

    // Referencia al audio de victoria
    const audioVictoria = document.getElementById("audio-victoria");

    const btnIngresar = document.getElementById("btn-ingresar-codigo");
    if (btnIngresar) btnIngresar.addEventListener("click", validarCodigo);

    const btnJugarNormal = document.getElementById("btn-jugar-normal");
    if (btnJugarNormal) btnJugarNormal.addEventListener("click", iniciarJuegoNormal);

    const btnGrupo1 = document.getElementById("reiniciar-grupo-1");
    if (btnGrupo1) btnGrupo1.addEventListener("click", () => reiniciarGrupo(1));

    const btnGrupo2 = document.getElementById("reiniciar-grupo-2");
    if (btnGrupo2) btnGrupo2.addEventListener("click", () => reiniciarGrupo(2));

    const reiniciarJuego = () => {
        // Pausar y reiniciar el sonido de victoria si está sonando
        if (audioVictoria) {
            audioVictoria.pause();
            audioVictoria.currentTime = 0;
        }

        for (const pieza of piezas) {
            pieza.visible = true;
            pieza.position.x = pieza.userData.inicial[0];
            pieza.position.y = pieza.userData.inicial[1];
            pieza.userData.colocada = false;
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
    };

    const btnReiniciarFinal = document.getElementById("reiniciar-final");
    if (btnReiniciarFinal) btnReiniciarFinal.addEventListener("click", reiniciarJuego);

    const btnReiniciar = document.getElementById("reiniciar");
    if (btnReiniciar) btnReiniciar.addEventListener("click", reiniciarJuego);
});
// ------------------------------------------
// BUCLE DE ANIMACIÓN
// ------------------------------------------
const clock = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const tiempo = clock.getElapsedTime();

    aurasZonasCentrales.forEach(aura => {
        const escala = 1 + Math.sin(tiempo * 2) * 0.08;
        aura.scale.set(escala, escala, 1);
    });

    piezas.forEach(pieza => {
        if (pieza.userData.aura) {
            const pulsoAura = 1 + Math.sin(tiempo * 3 + pieza.userData.numero) * 0.12;
            pieza.userData.aura.scale.set(pulsoAura, pulsoAura, 1);
        }

        if (!pieza.userData.colocada && pieza !== piezaSeleccionada) {
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

// Iniciar animación
animar();

// ------------------------------------------
// EVENTOS Y LÓGICA DE INTERFAZ (MOBILE)
// ------------------------------------------
const tutorialBox = document.getElementById('tutorial-box');
const audioMenu = document.getElementById('audio-menu');

tutorialBox.addEventListener('click', () => {
  // 1. Conmuta la clase colapsado
  tutorialBox.classList.toggle('colapsado');

  // 2. Reproduce el sonido
  if (audioMenu) {
    audioMenu.currentTime = 0; // Reinicia el audio para que suene aunque des clics rápidos
    audioMenu.play().catch(error => {
      // Maneja posibles restricciones de reproducción automática del navegador
      console.log("No se pudo reproducir el audio:", error);
    });
  }
});