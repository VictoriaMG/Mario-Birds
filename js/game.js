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
var levels = {
    // Array de niveles
    data: [
        { // Primer nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                {type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true},
                {type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true},

                {type: "block", name: "wood", x: 520, y: 380, angle: 90, width: 100, height: 25},
                {type: "block", name: "glass", x: 520, y: 280, angle: 90, width: 100, height: 25},
                {type: "villain", name: "burger", x: 520, y: 205, calories: 590},

                {type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 25},
                {type: "block", name: "glass", x: 620, y: 280, angle: 90, width: 100, height: 25},
                {type: "villain", name: "fries", x: 620, y: 205, calories: 420},

                {type: "hero", name: "orange", x: 80, y: 405},
                {type: "hero", name: "apple", x: 140, y: 405},
            ]
        },
        {   // Segundo nivel
            foreground: 'Egip_BG',
            background: 'Egip_BG',
            entities: [
                {type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true},
                {type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true},

                {type: "block", name: "wood", x: 820, y: 380, angle: 90, width: 100, height: 25},
                {type: "block", name: "wood", x: 720, y: 380, angle: 90, width: 100, height: 25},
                {type: "block", name: "wood", x: 620, y: 380, angle: 90, width: 100, height: 25},
                {type: "block", name: "glass", x: 670, y: 317.5, width: 100, height: 25},
                {type: "block", name: "glass", x: 770, y: 317.5, width: 100, height: 25},

                {type: "block", name: "glass", x: 670, y: 255, angle: 90, width: 100, height: 25},
                {type: "block", name: "glass", x: 770, y: 255, angle: 90, width: 100, height: 25},
                {type: "block", name: "wood", x: 720, y: 192.5, width: 100, height: 25},

                {type: "villain", name: "burger", x: 715, y: 155, calories: 590},
                {type: "villain", name: "fries", x: 670, y: 405, calories: 420},
                {type: "villain", name: "sodacan", x: 765, y: 400, calories: 150},

                {type: "hero", name: "strawberry", x: 30, y: 415},
                {type: "hero", name: "orange", x: 80, y: 405},
                {type: "hero", name: "apple", x: 140, y: 405},
            ]
        }
        //TODO:Añadir mas niveles aqui - PONER COMA EN CIERRE ANTERIOR
    ],
    //TODO: Seleccion de niveles aqui

    // Carga todos los datos e imagenes para un nivel especifico
    load: function (number) {
        //Inicializar box2d world cuada vez que se carga un nivel
        box2d.init();

        // Declarar un nuevo objeto de nivel actual
        game.currentLevel = {number: number, hero: []};
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        game.currentHero = undefined;
        var level = levels.data[number];


        //Cargar el fondo, primer plano y honda
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        // Cargar todas las entidades
        for (var i = level.entities.length - 1; i >= 0; i--) {
            var entity = level.entities[i];
            entities.create(entity);
        };

        //Llamar a game.start() cuando todos los assets se han sido cargados
        if (loader.loaded) {
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
}
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
    // Tomar la entidad crear un cuerpo Box2D y añadirlo al mundo
    create: function (entity) {
        var definition = entities.definitions[entity.name];
        if (!definition) {
            console.log("Undefined entity name", entity.name);
            return;
        }
        switch (entity.type) {
            case "block": // Rectangulos
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.shape = "rectangle";
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                entity.breakSound = game.breakSound[entity.name];
                box2d.createRectangle(entity, definition);
                break;
            case "ground": // Rectangulos simples
                //No necesitan salud, son destructibles
                entity.shape = "rectangle";
                // No necesitan sprite
                box2d.createRectangle(entity, definition);
                break;
            case "hero":	// Circulo simples
            case "villain": // Pueden ser circulos o rectangulos
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                entity.shape = definition.shape;
                entity.bounceSound = game.bounceSound;
                if (definition.shape == "circle") {
                    entity.radius = definition.radius;
                    box2d.createCircle(entity, definition);
                } else if (definition.shape == "rectangle") {
                    entity.width = definition.width;
                    entity.height = definition.height;
                    box2d.createRectangle(entity, definition);
                }
                break;
            default:
                console.log("Undefined entity type", entity.type);
                break;
        }
    },
    // Coge la posicion y la entidad y la dibuja
    draw: function (entity, position, angle) {
        //TODO: completar
    }
}
var box2d = {
    scale: 30,
    init: function () {
        //  Configurar el mundo de box2d que hara la mayoria de los calculos de fisica
        var gravity = new b2Vec2(0, 9.8); //Gravedad = 9,8
        var allowSleep = true; // Objetos entran en reposo cuando quedan dormidos y se excluyen de calculos
        box2d.world = new b2World(gravity, allowSleep);
    },
    createRectangle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;
        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }

        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2PolygonShape;
        fixtureDef.shape.SetAsBox(entity.width / 2 / box2d.scale, entity.height / 2 / box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },
    createCircle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;

        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }
        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2CircleShape(entity.radius / box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },
}