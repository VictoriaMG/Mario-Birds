// Declarar objetos utilizados como variables
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

var world;
var scale = 30; // 30 pixeles en el canvas equivalen a 1 metro en el mundo Box2d
function init() {
    // Configuracion del mundo Box2d que realizará la mayor parte del cálculo de la física

    // Declara la gravedar como 9.8.
    var gravity = new b2Vec2(0, 9.8);
    // Permite a los objetos que esten en reposo se queden dormidos y se excluyan de los calculos
    var allowSleep = true;

    world = new b2World(gravity, allowSleep);
}