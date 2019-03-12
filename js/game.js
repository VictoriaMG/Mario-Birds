// Declaraciones de Box2D
let b2Vec2 = Box2D.Common.Math.b2Vec2;
let b2BodyDef = Box2D.Dynamics.b2BodyDef;
let b2Body = Box2D.Dynamics.b2Body;
let b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
// Comentado por no uso
// let b2Fixture = Box2D.Dynamics.b2Fixture;
let b2World = Box2D.Dynamics.b2World;
let b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
let b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
let b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Preparamos requestAnimationFrame y cancelAnimationFrame para usarlos
(function () {
    let lastTime = 0;
    const vendors = ["ms", "moz", "webkit", "o"];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
        window.cancelAnimationFrame =
            window[vendors[x] + "CancelAnimationFrame"] ||
            window[vendors[x] + "CancelRequestAnimationFrame"];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            // El parametro element no se usa
            const currTime = new Date().getTime();
            let timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
})();

// Iniciar el juego tras cargar la pagina
$(window).load(function () {
    game.init();
});
// Objeto del juego
let game = {
    // Inicializa los objetos y precarga otros elementos y la pantalla de inicio
    init: function () {
        // Inicializar otros handlers (niveles, cargador de assets, control de raton)
        levels.init();
        loader.init();
        mouse.init();

        // Cargar musica y efectos de sonido
        // Musica PlayAMiniGame
        game.backgroundMusic = loader.loadSound("audio/PlayAMiniGame");
        $("#volumeSlider").slider({
            value: 0.75,
            step: 0.01,
            range: 'min',
            min: 0,
            max: 1,
            slide: function () {
                const value = $("#volumeSlider").slider("value");
                console.debug("Volume", value);
                game.backgroundMusic.volume = (value);
            },
            change: function () {
                const value = $("#volumeSlider").slider("value");
                console.debug("Volume", value);
                game.backgroundMusic.volume = (value);
            }
        });

        game.slingshotReleasedSound = loader.loadSound("audio/released");
        game.bounceSound = loader.loadSound("audio/bounce");
        game.breakSound = {
            pipeVerde: loader.loadSound("audio/pipeVerdebreak"),
            wood: loader.loadSound("audio/woodbreak")
        };
        game.scoreSound = loader.loadSound("audio/coin");

        // Ocultar todas las capas y mostrar la pantalla de inicio
        $(".gamelayer").hide();
        $("#gamestartscreen").show();

        // Obtener el canvas y el contexto para poder dibujar en el
        game.canvas = document.getElementById("gamecanvas");
        game.context = game.canvas.getContext("2d");
    },
    settingsOpen: false,
    toggleSettingsScreen: function () {
        if (game.settingsOpen) {
            $("#settingsscreen").hide();
            game.settingsOpen = false;
        } else {
            $("#settingsscreen").show();
            game.settingsOpen = true;
        }
    },
    startBackgroundMusic: function () {
        game.backgroundMusic.loop = true;
        game.backgroundMusic.play();
    },
    stopBackgroundMusic: function () {
        game.backgroundMusic.pause();
        game.backgroundMusic.currentTime = 0; // Resetear la cancion al segundo 0
    },
    showLevelSelectScreen: function () {
        // Codigo extra para limpiar el nivel anterior
        console.debug("Going back to level select");
        loader.reset();
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        game.currentLevel = undefined;
        game.currentHero = undefined;
        game.score = 0;
        game.mode = "intro";
        game.offsetLeft = 0;
        game.stopBackgroundMusic();
        // Fin codigo extra
        $(".gamelayer").hide();
        $("#levelselectscreen").show("slow");
    },
    restartLevel: function () {
        loader.reset();
        game.stopBackgroundMusic();
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number);
    },
    backMain: function () {
        game.ended = true;
        game.showLevelSelectScreen();
    },
    startNextLevel: function () {
        loader.reset();
        game.stopBackgroundMusic();
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number + 1);
    },
    // Modo de juego
    mode: "intro",
    // Coordenadas de la honda
    slingshotX: 140,
    slingshotY: 280,
    start: function () {
        $(".gamelayer").hide();
        // Mostrar las capas del juego y la puntuacion
        $("#gamecanvas").show();
        $("#scorescreen").show();

        game.startBackgroundMusic();

        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(
            game.animate,
            game.canvas
        );
    },

    // Velocidad maxima de panoramizacion por fotograma (en pixeles)
    maxSpeed: 3,
    // Minimo y maximo del desplazamiento panoramico
    minOffset: 0,
    maxOffset: 300,
    // Desplazamiento panoramico actual
    offsetLeft: 0,
    // Puntuacion del juego
    score: 0,

    // Mover la pantalla hasta newCenter
    panTo: function (newCenter) {
        if (
            Math.abs(newCenter - game.offsetLeft - game.canvas.width / 4) > 0 &&
            game.offsetLeft <= game.maxOffset &&
            game.offsetLeft >= game.minOffset
        ) {
            let deltaX = Math.round(
                (newCenter - game.offsetLeft - game.canvas.width / 4) / 2
            );
            if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
                deltaX = (game.maxSpeed * Math.abs(deltaX)) / deltaX;
            }
            game.offsetLeft += deltaX;
        } else {
            return true;
        }
        if (game.offsetLeft < game.minOffset) {
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset) {
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },
    // Contar heroes y villanos restantes
    countHeroesAndVillains: function () {
        game.heroes = [];
        game.villains = [];
        for (let body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            const entity = body.GetUserData();
            if (entity) {
                if (entity.type === "hero") {
                    game.heroes.push(body);
                } else if (entity.type === "villain") {
                    game.villains.push(body);
                }
            }
        }
    },
    mouseOnCurrentHero: function () {
        if (!game.currentHero) {
            return false;
        }
        const position = game.currentHero.GetPosition();
        const distanceSquared =
            Math.pow(position.x * box2d.scale - mouse.x - game.offsetLeft, 2) +
            Math.pow(position.y * box2d.scale - mouse.y, 2);
        const radiusSquared = Math.pow(game.currentHero.GetUserData().radius, 2);
        return distanceSquared <= radiusSquared;
    },
    handlePanning: function () {
        // Tras la intro cargamos el siguiente heroe
        if (game.mode === "intro") {
            if (game.panTo(700)) {
                game.mode = "load-next-hero";
            }
        }
        // Modo de espera al disparo
        if (game.mode === "wait-for-firing") {
            if (mouse.dragging) {
                if (game.mouseOnCurrentHero()) {
                    game.mode = "firing";
                } else {
                    game.panTo(mouse.x + game.offsetLeft);
                }
            } else {
                game.panTo(game.slingshotX);
            }
        }
        // Modo disparo. La camara sigue al disparo
        if (game.mode === "firing") {
            if (mouse.down) {
                game.panTo(game.slingshotX);
                game.currentHero.SetPosition({
                    x: (mouse.x + game.offsetLeft) / box2d.scale,
                    y: mouse.y / box2d.scale
                });
            } else {
                game.mode = "fired";
                game.slingshotReleasedSound.play();
                const impulseScaleFactor = 0.75;

                // Coordenadas del centro de la honda (donde la banda esta atada)
                const slingshotCenterX = game.slingshotX + 35;
                const slingshotCenterY = game.slingshotY + 25;
                const impulse = new b2Vec2(
                    (slingshotCenterX - mouse.x - game.offsetLeft) * impulseScaleFactor,
                    (slingshotCenterY - mouse.y) * impulseScaleFactor
                );
                game.currentHero.ApplyImpulse(
                    impulse,
                    game.currentHero.GetWorldCenter()
                );
            }
        }

        if (game.mode === "fired") {
            // Mover la vista donde se encuentra el heroe
            const heroX = game.currentHero.GetPosition().x * box2d.scale;
            game.panTo(heroX);

            // Y esperar hasta que termine de moverse o salga de los limites
            if (
                !game.currentHero.IsAwake() ||
                heroX < 0 ||
                heroX > game.currentLevel.foregroundImage.width
            ) {
                // Borrar al heroe disparado
                box2d.world.DestroyBody(game.currentHero);
                game.currentHero = undefined;
                // Y carga el siguiente
                game.mode = "load-next-hero";
            }
        }

        if (game.mode === "load-next-hero") {
            game.countHeroesAndVillains();

            // Comprobar los enemigos restantes
            if (game.villains.length === 0) {
                game.mode = "level-success";
                return;
            }

            // Comprobar los heroes restantes
            if (game.heroes.length === 0) {
                game.mode = "level-failure";
                return;
            }

            // Cargar el siguiente heroe y pasar al modo de espera al disparo
            if (!game.currentHero) {
                game.currentHero = game.heroes[game.heroes.length - 1];
                game.currentHero.SetPosition({
                    x: 180 / box2d.scale,
                    y: 200 / box2d.scale
                });
                game.currentHero.SetLinearVelocity({
                    x: 0,
                    y: 0
                });
                game.currentHero.SetAngularVelocity(0);
                game.currentHero.SetAwake(true);
            } else {
                // Esperar a que el heroe termine de moverse y se duerma.
                // Luego entrar en modo espera al siguiente disparo
                game.panTo(game.slingshotX);
                if (!game.currentHero.IsAwake()) {
                    game.mode = "wait-for-firing";
                }
            }
        }
        if (game.mode === "level-success" || game.mode === "level-failure") {
            if (game.panTo(0)) {
                game.ended = true;
                game.showEndingScreen();
            }
        }
    },
    showEndingScreen: function () {
        game.stopBackgroundMusic();
        if (game.mode === "level-success") {
            if (game.currentLevel.number < levels.data.length - 1) {
                $("#endingmessage").html("Level Complete. Well Done!!!");
                $("#playnextlevel").show();
            } else {
                $("#endingmessage").html("All Levels Complete. Well Done!!!");
                $("#playnextlevel").hide();
            }
        } else if (game.mode === "level-failure") {
            $("#endingmessage").html("Failed. Play Again?");
            $("#playnextlevel").hide();
        }

        $("#endingscreen").show();
    },

    animate: function () {
        // Animar el fondo
        game.handlePanning();

        // Animar el mundo
        const currentTime = new Date().getTime();
        let timeStep;
        if (game.lastUpdateTime) {
            timeStep = (currentTime - game.lastUpdateTime) / 1000;
            if (timeStep > 2 / 60) {
                timeStep = 2 / 60;
            }
            box2d.step(timeStep);
        }
        game.lastUpdateTime = currentTime;

        //  Dibujar el fondo con el paralaje
        game.context.drawImage(
            game.currentLevel.backgroundImage,
            game.offsetLeft / 4,
            0,
            640,
            480,
            0,
            0,
            640,
            480
        );
        game.context.drawImage(
            game.currentLevel.foregroundImage,
            game.offsetLeft,
            0,
            640,
            480,
            0,
            0,
            640,
            480
        );

        // Dibujar la honda
        game.context.drawImage(
            game.slingshotImage,
            game.slingshotX - game.offsetLeft,
            game.slingshotY
        );

        // Dibujar todos los cuerpos
        game.drawAllBodies();

        // Dibujar la banda de la honda cuando estamos disparando un heroe
        if (game.mode === "wait-for-firing" || game.mode === "firing") {
            game.drawSlingshotBand();
        }

        // Dibujar el frontal de la honda
        game.context.drawImage(
            game.slingshotFrontImage,
            game.slingshotX - game.offsetLeft,
            game.slingshotY
        );

        if (!game.ended) {
            game.animationFrame = window.requestAnimationFrame(
                game.animate,
                game.canvas
            );
        }
    },
    drawAllBodies: function () {
        box2d.world.DrawDebugData();

        // Dibujar todos los cuerpos en el lienzo (canvas)
        for (let body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            const entity = body.GetUserData();

            if (entity) {
                const entityX = body.GetPosition().x * box2d.scale;
                if (
                    entityX < 0 ||
                    entityX > game.currentLevel.foregroundImage.width ||
                    (entity.health && entity.health < 0)
                ) {
                    box2d.world.DestroyBody(body);
                    if (entity.type === "villain") {
                        game.score += entity.calories;
                        game.scoreSound.play();
                        $("#score").html(game.score);
                    }
                    if (entity.breakSound) {
                        entity.breakSound.play();
                    }
                } else {
                    entities.draw(entity, body.GetPosition(), body.GetAngle());
                }
            }
        }
    },
    drawSlingshotBand: function () {
        game.context.strokeStyle = "rgb(68,31,11)"; // Color marron oscuro
        game.context.lineWidth = 6; // Lo dibujamos como una linea gruesa

        // Calculamos el centro del heroe a partir del angulo y el radio
        const radius = game.currentHero.GetUserData().radius;
        const heroX = game.currentHero.GetPosition().x * box2d.scale;
        const heroY = game.currentHero.GetPosition().y * box2d.scale;
        const angle = Math.atan2(
            game.slingshotY + 25 - heroY,
            game.slingshotX + 50 - heroX
        );

        const heroFarEdgeX = heroX - radius * Math.cos(angle);
        const heroFarEdgeY = heroY - radius * Math.sin(angle);

        game.context.beginPath();
        // Iniciar la banda desde la parte superior trasera de la honda
        game.context.moveTo(
            game.slingshotX + 50 - game.offsetLeft,
            game.slingshotY + 25
        );

        // Hasta el centro del heroe
        game.context.lineTo(heroX - game.offsetLeft, heroY);
        game.context.stroke();

        // Dibujar al heroe en la banda posterior
        entities.draw(
            game.currentHero.GetUserData(),
            game.currentHero.GetPosition(),
            game.currentHero.GetAngle()
        );

        game.context.beginPath();
        // Mover al borde del heroe mas alejado de la parte superior de la honda
        game.context.moveTo(heroFarEdgeX - game.offsetLeft, heroFarEdgeY);

        // Dibujar la linea de regreso de la honda al lado frontal
        game.context.lineTo(
            game.slingshotX - game.offsetLeft + 10,
            game.slingshotY + 30
        );
        game.context.stroke();
    }
};

let levels = {
    // Datos de nivel
    data: [
        {
            // Primer nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                {
                    type: "block",
                    name: "wood",
                    x: 520,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 520,
                    y: 280,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                //Villanos
                {
                    type: "villain",
                    name: "Spiked_Goomba",
                    x: 520,
                    y: 205,
                    calories: 100
                },
                {
                    type: "villain",
                    name: "pirana",
                    x: 490,
                    y: 325,
                    calories: 100
                },
                {
                    type: "villain",
                    name: "goomba",
                    x: 570,
                    y: 325,
                    calories: 100
                },

                {
                    type: "block",
                    name: "wood",
                    x: 620,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 620,
                    y: 280,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "villain",
                    name: "Spiked_Goomba",
                    x: 620,
                    y: 205,
                    calories: 200
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shell",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Segundo nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },

                {
                    type: "block",
                    name: "wood",
                    x: 820,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "wood",
                    x: 720,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "wood",
                    x: 620,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 670,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 770,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 670,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 770,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "wood",
                    x: 720,
                    y: 192.5,
                    width: 100,
                    height: 25
                },
                //Villanos
                {
                    type: "villain",
                    name: "goomba",
                    x: 715,
                    y: 155,
                    calories: 590
                },
                {
                    type: "villain",
                    name: "blooper",
                    x: 670,
                    y: 405,
                    calories: 420
                },
                {
                    type: "villain",
                    name: "pirana",
                    x: 765,
                    y: 400,
                    calories: 150
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 30,
                    y: 415
                },
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shell",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Tercer nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    // Suelo
                    type: "ground",
                    name: "dirt",
                    x: 300,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    // Tirachinas
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 400,
                    y: 350,
                    angle: 135,
                    width: 90,
                    height: 20
                },
                //Segundo bloque
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 500,
                    y: 380,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 440,
                    y: 380,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 470,
                    y: 320,
                    width: 85,
                    height: 20
                },
                // Tercer Bloque
                //Segundo bloque
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 600,
                    y: 380,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 540,
                    y: 380,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 570,
                    y: 320,
                    width: 85,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 640,
                    y: 350,
                    angle: 45,
                    width: 90,
                    height: 20
                },
                // Enemigos
                {
                    type: "villain",
                    name: "florAzul",
                    x: 570,
                    y: 300,
                    calories: 150
                },
                {
                    type: "villain",
                    name: "florAzul",
                    x: 470,
                    y: 300,
                    calories: 150
                },
                //Abajo
                {
                    type: "villain",
                    name: "florDorada",
                    x: 570,
                    y: 390,
                    calories: 500
                },
                {
                    type: "villain",
                    name: "florDorada",
                    x: 470,
                    y: 390,
                    calories: 500
                },

                //Bolas
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 30,
                    y: 415
                },
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shell",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Cuarto nivel
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    // Suelo
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    // Tirachinas
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 400,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 340,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 370,
                    y: 340,
                    width: 80,
                    height: 20
                },
                //Sgunda altura
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 400,
                    y: 280,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 340,
                    y: 280,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 370,
                    y: 220,
                    width: 80,
                    height: 20
                },
                //Segundo bloque
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 500,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 440,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 470,
                    y: 340,
                    width: 80,
                    height: 20
                },
                // Tercer Bloque
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 600,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 540,
                    y: 400,
                    angle: 90,
                    width: 90,
                    height: 20
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 570,
                    y: 340,
                    width: 80,
                    height: 20
                },
                // Enemigos
                {
                    type: "villain",
                    name: "florAzul",
                    x: 370,
                    y: 200,
                    calories: 150
                },
                {
                    type: "villain",
                    name: "florAzul",
                    x: 570,
                    y: 300,
                    calories: 150
                },
                {
                    type: "villain",
                    name: "bone",
                    x: 470,
                    y: 300,
                    calories: 300
                },

                //Heroes
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 30,
                    y: 415
                },
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shell",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Quinto nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 400,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 475,
                    y: 300,
                    width: 185,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 550,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                // Segunda altura
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 480,
                    y: 413,
                    angle: 90,
                    width: 40,
                    height: 35
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 550,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 400,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                // Villanos
                {
                    type: "villain",
                    name: "pirana",
                    x: 435,
                    y: 400,
                    //Altura para que no salte el objeto!!
                    // y: 345,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "tortugavillana",
                    x: 490,
                    //Altura para que no salte el objeto!!
                    y: 400,
                    calories: 200
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Sexto nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 500,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 540,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 650,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 700,
                    y: 400,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 600,
                    y: 300,
                    width: 250,
                    height: 25
                },
                // Villanos
                {
                    type: "villain",
                    name: "blooper",
                    x: 650,
                    y: 400,
                    calories: 500
                },
                {
                    type: "villain",
                    name: "Fuzzy",
                    x: 600,
                    y: 400,
                    calories: 1000
                },

                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Septimo nivel
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 500,
                    y: 350,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 550,
                    y: 350,
                    angle: 90,
                    width: 130,
                    height: 60
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 600,
                    y: 350,
                    angle: 90,
                    width: 130,
                    height: 35
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 550,
                    y: 400,
                    width: 200,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 550,
                    y: 300,
                    width: 200,
                    height: 25
                },
                // Villanos
                {
                    type: "villain",
                    name: "florDorada",
                    x: 550,
                    y: 250,
                    calories: 200
                },

                {
                    type: "villain",
                    name: "florBasica",
                    x: 625,
                    y: 380,
                    calories: 200
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Octavo nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 400,
                    width: 30,
                    height: 80,
                    isStatic: true
                },
                // Estructuras
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 550,
                    y: 400,
                    angle: 90,
                    width: 100,
                    height: 50
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 550,
                    y: 375,
                    angle: 0,
                    width: 200,
                    height: 20
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 430,
                    y: 400,
                    angle: 90,
                    width: 200,
                    height: 30
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 670,
                    y: 400,
                    angle: 90,
                    width: 200,
                    height: 30
                },
                // Villanos
                {
                    type: "villain",
                    name: "florDorada",
                    x: 550,
                    y: 325,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "florBasica",
                    x: 500,
                    y: 400,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "florBasica",
                    x: 600,
                    y: 400,
                    calories: 200
                },
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Noveno nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },


                //Estructuras
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 320,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 370,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 470,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 570,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 470,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 570,
                    y: 254,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 520,
                    y: 192.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 620,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 520,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 420,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },

                // Villanos
                {
                    type: "villain",
                    name: "Fuzzy",
                    x: 510,
                    //Altura para que no salte el objeto!!
                    y: 270,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "Fuzzy",
                    x: 570,
                    //Altura para que no salte el objeto!!
                    y: 400,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "Fuzzy",
                    x: 460,
                    //Altura para que no salte el objeto!!
                    y: 400,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "pirana",
                    x: 340,
                    //Altura para que no salte el objeto!!
                    y: 400,
                    calories: 200
                },
                {
                    type: "villain",
                    name: "blooper",
                    x: 360,
                    y: 270,
                    calories: 200
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Decimo nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },

                //Estructuras
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 820,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 720,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 620,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 620,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 520,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 420,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 920,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 420,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 320,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",

                    x: 820,
                    y: 380,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 670,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 770,
                    y: 254,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 720,
                    y: 192.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 470,
                    y: 255,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 570,
                    y: 254,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 520,
                    y: 192.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 670,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 770,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 470,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 570,
                    y: 317.5,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 870,
                    y: 317.5,
                    width: 100,
                    height: 25
                },

                {
                    type: "block",
                    name: "ladrillos",
                    x: 370,
                    y: 317.5,
                    width: 100,
                    height: 25
                },

                // Villanos
                {
                    type: "villain",
                    name: "chainchop",
                    x: 880,
                    y: 300,
                    calories: 690
                },
                {
                    type: "villain",
                    name: "chainchop",
                    x: 380,
                    y: 300,
                    calories: 690
                },
                {
                    type: "villain",
                    name: "dryBone",
                    x: 720,
                    y: 280,
                    calories: 590
                },
                {
                    type: "villain",
                    name: "dryBone",
                    x: 520,
                    y: 280,
                    calories: 590
                },
                {
                    type: "villain",
                    name: "bala",
                    x: 620,
                    y: 300,
                    calories: 690
                },
                {
                    type: "villain",
                    name: "pinkBirdo",
                    x: 720,
                    y: 175,
                    calories: 690
                },
                {
                    type: "villain",
                    name: "pinkBirdo",
                    x: 520,
                    y: 175,
                    calories: 690
                },
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Undecimo nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 400,
                    width: 20,
                    height: 80,
                    isStatic: true
                },

                //Estructuras
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 800,
                    y: 400,
                    angle: 90,
                    width: 100,
                    height: 40
                },
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 700,
                    y: 400,
                    angle: 90,
                    width: 100,
                    height: 60
                },
                {
                    type: "block",
                    name: "pipeAzul",
                    x: 600,
                    y: 400,
                    angle: 90,
                    width: 100,
                    height: 40
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 500,
                    y: 325,
                    angle: 90,
                    width: 300,
                    height: 50
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 900,
                    y: 325,
                    angle: 90,
                    width: 300,
                    height: 50
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 650,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 750,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 700,
                    y: 200,
                    width: 150,
                    height: 25
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 650,
                    y: 320,
                    width: 100,
                    height: 20
                },
                {
                    type: "block",
                    name: "ladrillos",
                    x: 750,
                    y: 320,
                    width: 100,
                    height: 20
                },
                // Villanos
                {
                    type: "villain",
                    name: "dryBone",
                    x: 700,
                    y: 260,
                    calories: 590
                },
                {
                    type: "villain",
                    name: "Spiked_Goomba",
                    x: 700,
                    y: 175,
                    calories: 690
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        },
        {
            // Duodecimo nivel -- Acabado
            foreground: "desert-foreground",
            background: "clouds-background",
            entities: [
                {
                    type: "ground",
                    name: "dirt",
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true
                },
                {
                    type: "ground",
                    name: "wood",
                    x: 185,
                    y: 390,
                    width: 30,
                    height: 80,
                    isStatic: true
                },

                //Estructuras
                {
                    type: "block",
                    name: "pipeVerde",
                    x: 500,
                    y: 350,
                    angle: 90,
                    width: 100,
                    height: 60
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 650,
                    y: 200,
                    angle: 90,
                    width: 400,
                    height: 50
                },
                {
                    type: "block",
                    name: "soloLadrillos",
                    x: 700,
                    y: 200,
                    angle: 90,
                    width: 400,
                    height: 50
                },
                // Villanos
                {
                    type: "villain",
                    name: "boss",
                    x: 500,
                    y: 300,
                    calories: 150000
                },
                //Heroes
                {
                    type: "hero",
                    name: "shellGreen",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellAzul",
                    x: 80,
                    y: 405
                },
                {
                    type: "hero",
                    name: "shellOro",
                    x: 140,
                    y: 405
                }
            ]
        }
    ],
    // Inicializar la pantalla de seleccion de nivel
    init: function () {
        let html = "";
        for (let i = 0; i < levels.data.length; i++) {
            // Sig linea no se usa
            // const level = levels.data[i];
            html += '<input type="button" value="' + (i + 1) + '">';
        }
        $("#levelselectscreen").html(html);

        // Preparar el boton para que cargue el nivel
        $("#levelselectscreen input").click(function () {
            levels.load(this.value - 1);
            $("#levelselectscreen").hide();
        });
    },
    // Cargar datos e imagenes de un nivel en especifico
    load: function (number) {
        // Inicializar box2d
        box2d.init();

        // Preparar el nuevo nivel
        game.currentLevel = {
            number: number,
            hero: []
        };
        game.score = 0;
        $("#score").html(game.score);
        game.currentHero = undefined;
        const level = levels.data[number];

        // Cargar las imagenes de fondo, primer plano y honda
        game.currentLevel.backgroundImage = loader.loadImage(
            "img/backgrounds/" + level.background + ".png"
        );
        game.currentLevel.foregroundImage = loader.loadImage(
            "img/backgrounds/" + level.foreground + ".png"
        );
        game.slingshotImage = loader.loadImage("img/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("img/slingshot-front.png");

        // Cargar todas las entidades
        for (let i = level.entities.length - 1; i >= 0; i--) {
            const entity = level.entities[i];
            entities.create(entity);
        }
        // Iniciar el juego cuando los assets se hayan cargado
        if (loader.loaded) {
            game.start();
        } else {
            loader.onload = game.start;
        }
    }
};

let entities = {
    definitions: {
        //TODO: Revisar valor de vida
        pipeVerde: {
            fullHealth: 100,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15
        },
        superpipeVerde: {
            fullHealth: 100000,
            density: 100000,
            friction: 0.01,
            restitution: 0.01
        },
        pipeAzul: {
            fullHealth: 200,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15
        },
        wood: {
            fullHealth: 500,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4
        },
        ladrillos: {
            fullHealth: 700,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4
        },
        soloLadrillos: {
            fullHealth: 600,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4
        },
        dirt: {
            density: 30.0,
            friction: 10,
            restitution: 0.4
        },
        goomba: {
            shape: "circle",
            fullHealth: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4
        },
        Spiked_Goomba: {
            shape: "rectangle",
            fullHealth: 50,
            width: 50,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.6
        },
        spiny: {
            shape: "circle",
            fullHealth: 45,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4
        },
        Fuzzy: {
            shape: "circle",
            fullHealth: 50,
            radius: 30,
            density: 1,
            friction: 0.5,
            restitution: 0.4
        },
        pirana: {
            shape: "rectangle",
            fullHealth: 80,
            width: 40,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.7
        },
        blooper: {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6
        },

        florDorada: {
            shape: "rectangle",
            fullHealth: 70,
            width: 30,
            height: 40,
            density: 1,
            friction: 0.5,
            restitution: 0.6
        },
        florAzul: {
            shape: "rectangle",
            fullHealth: 35,
            width: 30,
            height: 40,
            density: 1,
            friction: 0.9,
            restitution: 0
        },
        florBasica: {
            shape: "rectangle",
            fullHealth: 35,
            width: 30,
            height: 40,
            density: 1,
            friction: 0.9,
            restitution: 0
        },
        bone: {
            shape: "rectangle",
            fullHealth: 65,
            width: 30,
            height: 40,
            density: 1,
            friction: 0.9,
            restitution: 0.4
        },
        tortugavillana: {
            shape: "rectangle",
            fullHealth: 465,
            width: 75,
            height: 75,
            density: 1,
            friction: 0.9,
            restitution: 0.4
        },
        "chainchop": {
            shape: "rectangle",
            fullHealth: 50,
            width: 50,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        "dryBone": {
            shape: "rectangle",
            fullHealth: 80,
            width: 70,
            height: 90,
            density: 1,
            friction: 0.5,
            restitution: 0.7,
        },
        "boss": {
            shape: "rectangle",
            fullHealth: 1500,
            width: 200,
            height: 150,
            density: 1,
            friction: 0.2,
            restitution: 0.2,
        },
        "bala": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        "pinkBirdo": {
            shape: "rectangle",
            fullHealth: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        shell: {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4
        },
        shellGreen: {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4
        },
        shellAzul: {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4
        },
        shellOro: {
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 5,
            restitution: 0
        }
    },
    // Crear una entidad a partir de su correspondiente cuerpo box2d, y annadirlo al mundo
    create: function (entity) {
        const definition = entities.definitions[entity.name];
        if (!definition) {
            console.log("Undefined entity name", entity.name);
            return;
        }
        switch (entity.type) {
            case "block": // Rectangulos
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.shape = "rectangle";
                entity.sprite = loader.loadImage(
                    "img/entities/" + entity.name + ".png"
                );
                entity.breakSound = game.breakSound[entity.name];
                box2d.createRectangle(entity, definition);
                break;
            case "ground": // Rectangulos
                // No necesita salud porque es indestructible
                entity.shape = "rectangle";
                // No necesita sprites porque no se dibujan
                box2d.createRectangle(entity, definition);
                break;
            case "hero": // Circulos simples
            case "villain": // Pueden ser circulos o rectangulos
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                let sprite = loader.loadImage(
                    "img/entities/" + entity.name + ".png"
                );
                if (sprite.src)
                    entity.sprite = sprite;
                entity.shape = definition.shape;
                entity.bounceSound = game.bounceSound;
                if (definition.shape === "circle") {
                    entity.radius = definition.radius;
                    box2d.createCircle(entity, definition);
                } else if (definition.shape === "rectangle") {
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

    // Dibujar una entidad dada su posicion y angulo
    draw: function (entity, position, angle) {
        game.context.translate(
            position.x * box2d.scale - game.offsetLeft,
            position.y * box2d.scale
        );
        game.context.rotate(angle);
        switch (entity.type) {
            case "block":
                game.context.drawImage(
                    entity.sprite,
                    0,
                    0,
                    entity.sprite.width,
                    entity.sprite.height,
                    -entity.width / 2 - 1,
                    -entity.height / 2 - 1,
                    entity.width + 2,
                    entity.height + 2
                );
                break;
            case "villain":
            case "hero":
                if (entity.shape === "circle") {
                    game.context.drawImage(
                        entity.sprite,
                        0,
                        0,
                        entity.sprite.width,
                        entity.sprite.height,
                        -entity.radius - 1,
                        -entity.radius - 1,
                        entity.radius * 2 + 2,
                        entity.radius * 2 + 2
                    );
                } else if (entity.shape === "rectangle") {
                    game.context.drawImage(
                        entity.sprite,
                        0,
                        0,
                        entity.sprite.width,
                        entity.sprite.height,
                        -entity.width / 2 - 1,
                        -entity.height / 2 - 1,
                        entity.width + 2,
                        entity.height + 2
                    );
                }
                break;
            case "ground":
                break;
        }

        game.context.rotate(-angle);
        game.context.translate(
            -position.x * box2d.scale + game.offsetLeft,
            -position.y * box2d.scale
        );
    }
};

let box2d = {
    scale: 30,
    init: function () {
        // Preparar el mundo
        const gravity = new b2Vec2(0, 9.8); // Declarar la gravedad
        const allowSleep = true; // Permitir que los objetos en reposo se duerman para aumentar la velocidad de la simulacion
        box2d.world = new b2World(gravity, allowSleep);

        // Configurar dibujos de depuracion
        const debugContext = document
            .getElementById("debugcanvas")
            .getContext("2d");
        const debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(debugContext);
        debugDraw.SetDrawScale(box2d.scale);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        box2d.world.SetDebugDraw(debugDraw);

        const listener = new Box2D.Dynamics.b2ContactListener();
        listener.PostSolve = function (contact, impulse) {
            const body1 = contact.GetFixtureA().GetBody();
            const body2 = contact.GetFixtureB().GetBody();
            const entity1 = body1.GetUserData();
            const entity2 = body2.GetUserData();

            const impulseAlongNormal = Math.abs(impulse.normalImpulses[0]);
            // Este listener es llamado con mucha frecuencia...
            // Filtra los impulsos muy pequeños. 5 es un valor apropiado para este filtro
            if (impulseAlongNormal > 5) {
                // Si el objeto tiene salud, debe reducirse por el valor del impulso
                if (entity1.health) {
                    entity1.health -= impulseAlongNormal;
                }

                if (entity2.health) {
                    entity2.health -= impulseAlongNormal;
                }

                // Si los objetos tienen un sonido, reproducirlos
                if (entity1.bounceSound) {
                    entity1.bounceSound.play();
                }

                if (entity2.bounceSound) {
                    entity2.bounceSound.play();
                }
            }
            if (entity1.type === "hero")
            //console.debug("Body1 Vel x", body1.GetLinearVelocity());
                if (entity2.type === "hero")
                //console.debug("Body2 Vel x", body2.GetLinearVelocity());

                    if (entity1.type === "hero" && Math.abs(body1.GetAngularVelocity().x) < 1) body1.SetLinearVelocity({
                        x: (body1.GetAngularVelocity().x * 0.8),
                        y: body1.GetLinearVelocity().y
                    });
            if (entity2.type === "hero" && Math.abs(body2.GetLinearVelocity().x) < 1) body2.SetLinearVelocity({
                x: (body2.GetLinearVelocity().x * 0.8),
                y: body2.GetLinearVelocity().y
            });
            if (Math.abs(body1.GetAngularVelocity().x) < 0.2) body1.SetLinearVelocity({
                x: (body1.GetAngularVelocity().x * 0.8),
                y: body1.GetLinearVelocity().y
            });
            if (Math.abs(body2.GetLinearVelocity().x) < 0.2) body2.SetLinearVelocity({
                x: (body2.GetLinearVelocity().x * 0.8),
                y: body2.GetLinearVelocity().y
            });
        };
        box2d.world.SetContactListener(listener);
    },
    step: function (timeStep) {
        // Iteraciones de la velocidad = 8
        // Iteraciones de posicion = 3
        box2d.world.Step(timeStep, 8, 3);
    },
    createRectangle: function (entity, definition) {
        const bodyDef = new b2BodyDef();
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;
        if (entity.angle) {
            bodyDef.angle = (Math.PI * entity.angle) / 180;
        }

        const fixtureDef = new b2FixtureDef();
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2PolygonShape();
        fixtureDef.shape.SetAsBox(
            entity.width / 2 / box2d.scale,
            entity.height / 2 / box2d.scale
        );

        const body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        // No se usa
        // const fixture = body.CreateFixture(fixtureDef);
        body.CreateFixture(fixtureDef);
        return body;
    },
    createCircle: function (entity, definition) {
        const bodyDef = new b2BodyDef();
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;

        if (entity.angle) {
            bodyDef.angle = (Math.PI * entity.angle) / 180;
        }
        const fixtureDef = new b2FixtureDef();
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2CircleShape(entity.radius / box2d.scale);

        const body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        // No se usa
        // const fixture = body.CreateFixture(fixtureDef);
        body.CreateFixture(fixtureDef);
        return body;
    }
};

let loader = {
    loaded: true,
    loadedCount: 0, // Assets cargados
    totalCount: 0, // Total de assets a cargar

    init: function () {
        // Comprobar soporte de sonido
        let mp3Support, oggSupport;
        const audio = document.createElement("audio");
        if (audio.canPlayType) {
            // canPlayType() devuelve: "", "maybe" o "probably"
            mp3Support = "" !== audio.canPlayType("audio/mpeg");
            oggSupport = "" !== audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            // Audio no soportado
            mp3Support = false;
            oggSupport = false;
        }

        // Comprobar primero .ogg, luego .mp3 y sino, fijar a undefined
        loader.soundFileExtn = oggSupport
            ? ".ogg"
            : mp3Support
                ? ".mp3"
                : undefined;
    },
    loadImage: function (url) {
        this.totalCount++;
        this.loaded = false;
        $("#loadingscreen").show();
        const image = new Image();
        image.src = url;
        console.debug("Trying to get image for url " + url, image);
        image.onload = loader.itemLoaded;
        image.onerror = function () {
            console.error("Error loading Image with src: " + url);
        };
        return image;
    },
    soundFileExtn: ".ogg",
    loadSound: function (url) {
        this.totalCount++;
        this.loaded = false;
        $("#loadingscreen").show();
        const audio = new Audio();
        audio.src = url + loader.soundFileExtn;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;
    },
    itemLoaded: function (e) {
        // El parametro e no se usa
        loader.loadedCount++;
        $("#loadingmessage").html(
            "Loading " + loader.loadedCount + " of " + loader.totalCount + "..."
        );
        if (loader.loadedCount === loader.totalCount) {
            loader.loaded = true;
            loader.loadedCount = 0;
            loader.totalCount = 0;
            $("#loadingscreen").hide();
            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    },
    //Para reiniciar el cargador de assets
    reset: function () {
        loader.loadedCount = 0; // Assets cargados
        loader.totalCount = 0; // Total de assets a cargar
        console.debug(loader);
    }
};
let mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function () {
        const gamecanvas = $("#gamecanvas");
        gamecanvas.mousemove(mouse.mousemovehandler);
        gamecanvas.mousedown(mouse.mousedownhandler);
        gamecanvas.mouseup(mouse.mouseuphandler);
        gamecanvas.mouseout(mouse.mouseuphandler);
    },
    mousemovehandler: function (ev) {
        var offset = $("#gamecanvas").offset();

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }
    },
    mousedownhandler: function (ev) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();
    },
    mouseuphandler: function (ev) {
        // El parametro ev no se usa
        mouse.down = false;
        mouse.dragging = false;
    }
};
