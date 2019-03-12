let b2Vec2 = Box2D.Common.Math.b2Vec2;
let b2BodyDef = Box2D.Dynamics.b2BodyDef;
let b2Body = Box2D.Dynamics.b2Body;
let b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
// Comentado por no uso
let b2Fixture = Box2D.Dynamics.b2Fixture;
let b2World = Box2D.Dynamics.b2World;
let b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
let b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
let b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
let b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

let world;
const scale = 30;
let context;
const timeStep = 1 / 60; // 60 fps
const velIterations = 8;
const posIterations = 3;

function init() {
    const gravity = new b2Vec2(0, 9.8); // Gravedad hacia abajo
    const allowSleep = true; // Para optimizacion
    world = new b2World(gravity, allowSleep);

    createFloor();
    createRectangularBody();
    createCircularBody();
    createSimplePolygonBody();
    createComplexBody();
    //Unir dos cuerpos mediante una articulacion(revolute join)
    createRevoluteJoint();
    //Crear un cuerpo con datos especiales del usuario
    createSpecialBody();
    //Crear contact listeners y registrar los eventos
    listenForContact();

    setupDebugDraw();
    animate();
}

function createFloor() {
    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.x = 640 / 2 / scale;
    bodyDef.position.y = 450 / scale;

    let fixtureDef = new b2FixtureDef();
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.1;
    fixtureDef.restitution = 0.1;
    fixtureDef.shape = new b2PolygonShape();
    fixtureDef.shape.SetAsBox(320 / scale, 10 / scale);

    let body = world.CreateBody(bodyDef);
    let fixture = body.CreateFixture(fixtureDef)
}

function setupDebugDraw() {
    context = document.getElementById("canvas").getContext("2d");
    let debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(scale);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

    world.SetDebugDraw(debugDraw);
}

function animate() {
    world.Step(timeStep, velIterations, posIterations);
    world.ClearForces();
    world.DrawDebugData();

    //Dibujo personalizado

    if(specialBody){
        drawSpecialBody();
    }

    //Matar Special body si muere

    if (specialBody && specialBody.GetUserData().life <= 0) {
        world.DestroyBody(specialBody);
        specialBody = undefined;
        console.log("The special body was destroyed");
    }

    //El punto donde destruimos el cuerpo es el lugar perfecto para añadir sonidos efectos y
    //actualizacion de puntuacion

    setTimeout(animate, timeStep);
}

function createRectangularBody() {
    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 40 / scale;
    bodyDef.position.y = 100 / scale;

    let fixtureDef = new b2FixtureDef();
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.3;
    fixtureDef.restitution = 0.4;
    fixtureDef.shape = new b2PolygonShape();
    fixtureDef.shape.SetAsBox(30 / scale, 50 / scale);

    let body = world.CreateBody(bodyDef);
    let fixture = body.CreateFixture(fixtureDef)
}

function createCircularBody() {
    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 130 / scale;
    bodyDef.position.y = 100 / scale;

    let fixtureDef = new b2FixtureDef();
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.6;
    fixtureDef.restitution = 0.7;
    fixtureDef.shape = new b2CircleShape(30 / scale);

    let body = world.CreateBody(bodyDef);
    let fixture = body.CreateFixture(fixtureDef)
}

function createSimplePolygonBody() {
    let bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 230 / scale;
    bodyDef.position.y = 50 / scale;

    let fixtureDef = new b2FixtureDef();
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.2;
    fixtureDef.shape = new b2PolygonShape();
    const points = [
        new b2Vec2(0, 0),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale)
    ]
    fixtureDef.shape.SetAsArray(points, points.length);

    let body = world.CreateBody(bodyDef);
    let fixture = body.CreateFixture(fixtureDef)
}

function createComplexBody() {
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 350 / scale;
    bodyDef.position.y = 50 / scale;
    var body = world.CreateBody(bodyDef);

    // Crear primer accesorio, con forma circular

    var fixtureDef = new b2FixtureDef();
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.7;
    fixtureDef.shape = new b2CircleShape(20 / scale);
    body.CreateFixture(fixtureDef);

    // Crear segundo accesorio, con forma Poligonal

    fixtureDef.shape = new b2PolygonShape();
    var points = [
        new b2Vec2(0, 20 / scale),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale)
    ]
    fixtureDef.shape.SetAsArray(points, points.length);
    body.CreateFixture(fixtureDef);
}

function createRevoluteJoint() {

    //Definir el primer cuerpo

    var bodyDef1 = new b2BodyDef;
    bodyDef1.type = b2Body.b2_dynamicBody;
    bodyDef1.position.x = 480 / scale;
    bodyDef1.position.y = 60 / scale;
    var body1 = world.CreateBody(bodyDef1);

    //Crear el primer accesorio y añadir la forma rectangular al cuerpo

    var fixtureDef1 = new b2FixtureDef;
    fixtureDef1.density = 1.0;
    fixtureDef1.friction = 0.5;
    fixtureDef1.restitution = 0.5;
    fixtureDef1.shape = new b2PolygonShape;
    fixtureDef1.shape.SetAsBox(50 / scale, 10 / scale);

    body1.CreateFixture(fixtureDef1);

    //Definir el segundo cuerpo

    var bodyDef2 = new b2BodyDef;
    bodyDef2.type = b2Body.b2_dynamicBody;
    bodyDef2.position.x = 470 / scale;
    bodyDef2.position.y = 50 / scale;
    var body2 = world.CreateBody(bodyDef2);

    //Crear el segundo accesorio y añadir la forma rectangular al cuerpo

    var fixtureDef2 = new b2FixtureDef;
    fixtureDef2.density = 1.0;
    fixtureDef2.friction = 0.5;
    fixtureDef2.restitution = 0.5;
    fixtureDef2.shape = new b2PolygonShape;
    var points = [
        new b2Vec2(0, 0),
        new b2Vec2(40 / scale, 50 / scale),
        new b2Vec2(50 / scale, 100 / scale),
        new b2Vec2(-50 / scale, 100 / scale),
        new b2Vec2(-40 / scale, 50 / scale),
    ];

    fixtureDef2.shape.SetAsArray(points, points.length);
    body2.CreateFixture(fixtureDef2);

    //Crear una articulacion entre el body1 y el body2

    var jointDef = new b2RevoluteJointDef;
    var jointCenter = new b2Vec2(470 / scale, 50 / scale);

    jointDef.Initialize(body1, body2, jointCenter);
    world.CreateJoint(jointDef);
}

// Se salva una referencia a Body en una variable llamada specialBody fuera de la funcion

var specialBody;

function createSpecialBody() {
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 450 / scale;
    bodyDef.position.y = 0 / scale;

    specialBody = world.CreateBody(bodyDef);
    specialBody.SetUserData({name: "special", life: 250})

    //Crear un accesorio para unir una forma circular al  cuerpo

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution = 0.5;

    fixtureDef.shape = new b2CircleShape(30 / scale);

    var fixture = specialBody.CreateFixture(fixtureDef);
}

function listenForContact() {
    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.PostSolve = function (contact, impulse) {
        var body1 = contact.GetFixtureA().GetBody();
        var body2 = contact.GetFixtureB().GetBody();

        //Si cualquiera de los cuerpos es specialBody, reduzca su vida

        if (body1 == specialBody || body2 == specialBody) {
            var impulseAlongNormal = impulse.normalImpulses[0];
            specialBody.GetUserData().life -= impulseAlongNormal;
            console.log("The special body was in a collision with impulse", impulseAlongNormal, "and its life has now become ", specialBody.GetUserData().life);

        }
    };
    world.SetContactListener(listener);
}

function drawSpecialBody() {
    //Obtener la posicion y el angulo del cuerpo
    var position = specialBody.GetPosition();
    var angle = specialBody.GetAngle();

    //Transladar y girar el eje a la posicion y el angulo del cuerpo
    context.translate(position.x * scale, position.y * scale);
    context.rotate(angle);

    //Dibuja una cara circular llena
    context.fillStyle = "rgb(200,150,250);";
    context.beginPath();
    context.arc(0, 0, 30, 0, 2 * Math.PI, false);
    context.fill();

    //Dibujar dos ojos rectangulares
    context.fillStyle = "rgb(255,255,255);";
    context.fillRect(-15, -15, 10, 5);
    context.fillRect(5, -15, 10, 5);

    //Dibujar un arco hacia arriba o hacia abajo para una sonrisa dependendiendo de la vida
    context.strokeStyle = "rgb(255,255,255);";
    context.beginPath();
    if (specialBody.GetUserData().life > 100) {
        context.arc(0, 0, 10, Math.PI, 2 * Math.PI, true);
    } else {
        context.arc(0, 10, 10, Math.PI, 2 * Math.PI, false);
    }
    context.stroke();

    //Transladar y girar el eje de nuevo a la posicion original y el angulo
    context.rotate(-angle);
    context.translate(-position.x * scale, -position.y * scale);
}

