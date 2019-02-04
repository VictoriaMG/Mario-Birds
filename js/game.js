$(window).load(function onload() {
    const startScreen = document.getElementById("start-screen");
    const levelSelector = document.getElementById("level-select-screen");
    const loadingScreen = document.getElementById("loading-screen");
    const loadingMessage = document.getElementById("loading-msg");
    const endingScreen = document.getElementById("ending-screen");
    const allLayers = document.getElementsByClassName("game-layer");

    class Game {

        constructor() {
            this.currentLevel = undefined;
            this.levels = new Levels();
            this.loader = new ResourcesLoader();
            //mouse.init();

            startScreen.style.display = "block"

            this.canvas = document.getElementById("game-canvas");
            this.context = this.canvas.getContext("2d");
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
            console.log("Starting game...")
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
            }
            game.updateScore(0);
            const currentLevel = this.data[num];
            game.currentLevel.backgroundImage = game.loader.loadImage("./../img/backgrounds/" + currentLevel.background + ".png");
            game.currentLevel.foregroundImage = game.loader.loadImage("./../img/backgrounds/" + currentLevel.foreground + ".png");
            game.slingshotImage = game.loader.loadImage("./../img/slingshot.png");
            game.slingshotFrontImage = game.loader.loadImage("./../img/slingshot-front.png");
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
            console.debug(this.loadedCount);
            console.debug(this.totalCount);
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

    window.game = new Game();

})