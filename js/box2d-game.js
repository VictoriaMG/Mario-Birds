let b2Vec2 = Box2D.Common.Math.b2Vec2;
let b2BodyDef = Box2D.Dynamics.b2BodyDef;
let b2Body = Box2D.Dynamics.b2Body;
let b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
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
    var fixtureDef= new b2FixtureDef();
    fixtureDef.density =1.0;
    fixtureDef.friction = 0.5;
    fixtureDef.restitution =0.7;
    fixtureDef.shape = new b2CircleShape(20 / scale);
    body.CreateFixture(fixtureDef);
    // Crear segundo accesorio, con forma Poligonal
    fixtureDef.shape = new b2PolygonShape();
    var points =[
        new b2Vec2(0, 20/scale),
        new b2Vec2(40/scale, 50/scale),
        new b2Vec2(50/scale, 100/scale),
        new b2Vec2(-50/ scale,100/ scale),
        new b2Vec2(-40/scale,50/scale)
    ]
    fixtureDef.shape.SetAsArray(points, points.length);
    body.CreateFixture(fixtureDef);
}