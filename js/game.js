$(window).load(function onload() {
    const startScreen = document.getElementById("start-screen");
    const levelSelector = document.getElementById("level-select-screen");
    const loadingScreen = document.getElementById("loading-screen");
    const loadingMessage = document.getElementById("loading-msg");
    const endingScreen = document.getElementById("ending-screen");
    const scoreScreen = document.getElementById("score-screen");
    const allLayers = document.getElementsByClassName("game-layer");

    const GameState = Object.freeze({
        INTRO: {}, // – intro: El juego se desplazará alrededor del nivel para mostrarle al
        //                  usuario todo lo que hay en él.

        NEXT_HERO: {}, // – load-next-hero: El juego comprueba si hay otro héroe que cargar
        //                      en la honda. El juego termina cuando ya no hay héroes o los villanos
        //                      han sido destruidos.

        WAITING: {}, // – wait-for-firing: El juego se desplaza hacia el área donde está la
        //                  honda, en espera de que el usuario dispare al héroe.

        AIMING: {}, // – firing: Tiene lugar cuando el usuario pulsa el héroe, pero antes de
        //                  que libere el botón del ratón. Se prepara el ángulo de tiro y la altura
        //                  a la que se lanzará el héroe.

        FIRED: {} // – fired: Sucede después de que el usuario libera el botón del ratón,
        //              entonces se habrá lanzado al héroe y el motor de la física actuará
        //              sobre todo, mientras el usuario sigue la trayectoria del héroe.
    })

    class Game {

        constructor() {

            this.canvas = document.getElementById("game-canvas");
            this.context = this.canvas.getContext("2d");

            this.currentLevel = null;
            this.levels = new Levels();
            this.loader = new ResourcesLoader();
            this.mouse = new Mouse(this); // El mouse pinta en la pantalla por lo que que necesita recibir la referencia          

            this.mode = GameState.INTRO;
            this.slingshotX = 140;
            this.slingshotY = 280;
            // Animaciones
            this.offsetLeft = 0;
            this.minOffset = 0;
            this.maxOffset = 0;
            this.maxSpeed = 3;
            // Variables para el juego
            this.ended = false;
            this.animationFrame = null;
            this.slingshotImage = null;
            this.slingshotFrontImage = null;
            // Mostrar la pantalla de inicio
            startScreen.style.display = "block"
        }

        handlePanning() {
            switch (this.mode) {
                case GameState.INTRO:
                    if (this.panTo(700)) {
                        this.mode = GameState.NEXT_HERO;
                    }
                    break;
                case GameState.WAITING:
                    if (this.mouse.dragging) {
                        panTo(this.mouse.x + this.offsetLeft);
                    } else {
                        this.panTo(this.slingshotX);
                    }
                    break;
                case GameState.NEXT_HERO:
                    this.mode = GameState.WAITING;
                    break;
                case GameState.AIMING:
                    this.panTo(this.slingshotX);
                    break;
                case GameState.FIRED:
                    break;
            }
        }


        panTo(pos) {
            if (Math.abs(pos - this.offsetLeft - this.canvas.width / 4) > 0 &&
                this.offsetLeft <= this.maxOffset &&
                this.offsetLeft >= this.minOffset) {
                let deltaX = Math.round((pos - this.offsetLeft - this.canvas.width / 4) / 2);
                if (deltaX && Math.abs(deltaX) > this.maxSpeed) {
                    deltaX = this.maxSpeed * Math.abs(deltaX) / deltaX;
                }
                this.offsetLeft += deltaX;
            } else {
                return true;
            }
            if (this.offsetLeft < this.minOffset) {
                this.offsetLeft = this.minOffset;
                return true;
            } else if (this.offsetLeft > this.maxOffset) {
                this.offsetLeft = this.maxOffset;
                return true;
            }
            return false;
        }

        // Paint method.
        // Se llama desde la ventana cada frame,
        // por lo que hay que usar la variable game, creada en window
        update() {
            // Background
            game.handlePanning();

            // Personajes


            //  Parallax scrolling
            game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft / 4, 0, 640, 480, 0, 0, 640, 480);
            game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft, 0, 640, 480, 0, 0, 640, 480);

            // Tirachinas
            game.context.drawImage(game.slingshotImage, game.slingshotX - game.offsetLeft, game.slingshotY);
            game.context.drawImage(game.slingshotFrontImage, game.slingshotX - game.offsetLeft, game.slingshotY)

            if (!game.ended) {
                game.animationFrame = window.requestAnimationFrame(game.update, game.canvas);
            }
        }

        showLevelScreen() {
            console.log("Show Level Screen")
            this.hideAll()
            $(levelSelector).show("slow")
        }

        hideAll() {
            [...allLayers].forEach(element => {
                element.style.display = "none"
            });
        }

        updateScore(value) {
            document.getElementById("score-value").innerText = value
        }

        start() {
            console.log("Starting game...");
            this.hideAll();
            this.canvas.style.display = "block";
            scoreScreen.style.display = "block";
            this.mode = "intro";
            this.animationFrame = window.requestAnimationFrame(this.update, this.canvas)
        }
    }

    class Mouse {
        constructor(game) {
            this.x = 0;
            this.y = 0;
            this.down = false;
            this.downX = 0;
            this.downY = 0;
            this.dragging = false;
            $(game.canvas).mousemove(this.mouseMoved)
            $(game.canvas).mousedown(this.mouseDown)
            $(game.canvas).mouseup(this.mouseUp)
            $(game.canvas).mouseout(this.mouseUp)
        }

        mouseMoved(event) {
            let offset = $(game.canvas).offset();
            this.x = event.pageX - offset.left;
            this.y = event.pageY - offset.top;
            if (this.down)
                this.dragging = true;
        }

        mouseDown(event) {
            this.down = true;
            this.downX = this.x;
            this.downY = this.y;
            event.originalEvent.preventDefault();
        }

        mouseUp(event) {
            this.down = false;
            this.dragging = false;
        }
    }

    class Levels {

        constructor() {
            this.data = [
                new LevelData('desert-foreground', 'clouds-background'),
                new LevelData('desert-foreground', 'clouds-background')
            ];
            let html = ""
            for (let i = 0; i < this.data.length; i++) {
                const level = this.data[i];
                html += '<input type="button" value="' + (i + 1) + '">'
            }
            levelSelector.innerHTML = html;
            [...levelSelector.children].forEach((levelButton) => {
                levelButton.onclick = () => {
                    console.log("Loading level", levelButton.value)
                    this.loadLevel(levelButton.value - 1)
                    levelSelector.style.display = 'none'
                }
            })
        }

        loadLevel(num) {
            game.currentLevel = {
                num: num,
                hero: []
            };
            game.updateScore(0);
            const currentLevel = this.data[num];
            game.currentLevel.backgroundImage = game.loader.loadImage("img/backgrounds/" + currentLevel.background + ".png");
            game.currentLevel.foregroundImage = game.loader.loadImage("img/backgrounds/" + currentLevel.foreground + ".png");
            game.slingshotImage = game.loader.loadImage("img/slingshot.png");
            game.slingshotFrontImage = game.loader.loadImage("img/slingshot-front.png");
            if (game.loader.loaded) {
                game.start()
            } else {
                game.loader.onload = game.start()
            }
        }
    }

    class LevelData {
        constructor(_foreground, _background, _entities = []) {
            this.foreground = _foreground;
            this.background = _background;
            this.entities = _entities;
        }
    }

    class ResourcesLoader {

        constructor() {

            this.loaded = false;
            this.loadedCount = 0;
            this.totalCount = 0;

            const audio = document.createElement("audio");
            this.mp3Support = false;
            this.oggSupport = false;

            if (audio.canPlayType) {
                this.mp3Support = ("" != audio.canPlayType("audio/mpeg"));
                this.oggSupport = ("" != audio.canPlayType('audio/ogg; codecs="vorbis"'));
            }
            this.soundFileExt = this.oggSupport ? ".ogg" :
                this.mp3Support ? ".mp3" :
                    undefined
        }

        loadImage(url) {
            this.totalCount++;
            this.loaded = false;
            loadingScreen.style.display = "block";
            const img = new Image();
            img.src = url
            img.onload = this.itemLoaded();
            return img;
        }

        loadSound(url) {
            this.totalCount++;
            this.loaded = false;
            loadingScreen.style.display = "block";
            const audio = new Audio();
            audio.src = url + this.soundFileExt;
            audio.addEventListener("canplaythrough", this.itemLoaded(), false)
            return audio;
        }

        itemLoaded() {
            console.debug("Item loaded");
            console.debug("Loaded Count", this.loadedCount);
            console.debug("Total Count", this.totalCount);
            this.loadedCount++;
            loadingMessage.innerHTML = "Loaded " + this.loadedCount + " of " + this.totalCount;
            if (this.loadedCount === this.totalCount) {
                this.loaded = true;
                loadingScreen.style.display = "none";
                //$(loadingScreen).hide()
                if (this.onload) {
                    this.onload();
                    this.onload = undefined;
                }
            }
        }

    }

    // Game 
    window.game = null;
    window.game = new Game();

});

// Preparar requestAnimationFrame y cancelAnimationFrame 
(function () {
    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            let currTime = new Date().getTime();
            let timeToCall = Math.max(0, 16 - (currTime - lastTime));
            let id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
//Definimos las entidades
var entities = {
    definitions: {
        "glass": {
            fullHealth: 200,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15,
        },
        "wood": {
            fullHealth: 900,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4,
        },
        "dirt": {
            density: 3.0,
            friction: 1.5,
            restitution: 0.2,
        },
        "burger": {
            shape: "circle",
            fullHealth: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4,
        },
        "sodacan": {
            shape: "rectangle",
            fullHealth: 80,
            width: 40,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.7,
        },
        "fries": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        "apple": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "orange": {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "strawberry": {
            shape: "circle",
            radius: 15,
            density: 2.0,
            friction: 0.5,
            restitution: 0.4,
        }
    },
    //TODO: Añadir aqui nuevas entidades
    // Tomar la entidad crear un cuerpo Box2D y añadirlo al mundo
    create: function (entity) {
          //TODO: completar
    },
    // Coge la posicion y la entidad y la dibuja
    draw: function (entity, position, angle) {
    //TODO: completar
    }