/**
 * RANDOM MOVE SIMULATION
 * AUTHOR: KanKub
 */

//========= config simulation param here. =========
const BALL_RADIUS = 10;
const GRAV_ACCEL = 0;
const TIME_STEP = 0.1;
const N = 100;
//=================================================

//#region dont touch
const TWO_PI = Math.PI*2;
var cv = document.getElementById('myCanvas');
var ctx = cv.getContext('2d');
var ele_pressure = document.getElementById('pressure');
const BALL_RADIUS_SQUARE = BALL_RADIUS*BALL_RADIUS;
const TWO_BALL_RADIUS_SQUARE = 4*BALL_RADIUS_SQUARE;
var particles;
var t=0; 
//#endregion dont touch

class Particle{

    //========= config random params here. =========
    static OFFSET_X = BALL_RADIUS+1;
    static OFFSET_Y = BALL_RADIUS+1;
    static RANGE_X = cv.width-Particle.OFFSET_X*2;
    static RANGE_Y = cv.height-Particle.OFFSET_X*2;
    static RANGE_V = 0;
    static OFFSET_V = 20;
    //==============================================
    
    x; y; vx;vy;
    m; //kg 
    color = 'black';
    outOfBoundX = false;
    outOfBoundY = false;

    constructor(x,y,vx,vy,mass){
        this.x=x;
        this.y=y;
        this.vx=vx;
        this.vy=vy;
        this.m=mass;
    }

    random(){
        this.x = Math.random()*Particle.RANGE_X+Particle.OFFSET_X;
        this.y = Math.random()*Particle.RANGE_Y+Particle.OFFSET_Y;
        let v = Math.random()*Particle.RANGE_V+Particle.OFFSET_V;
        let theta = Math.random()*TWO_PI;
        this.vx = v*Math.cos(theta);
        this.vy = v*Math.sin(theta);
        this.color = randColor();
        return this;
    }

    tick(dt){
        this.x+=this.vx*dt;
        this.y+=this.vy*dt;
        this.vy+=GRAV_ACCEL*dt;
    }

    drawBall(){
        ctx.beginPath();
        ctx.arc(getCanvasX(this.x),getCanvasY(this.y),BALL_RADIUS-0.4,0,TWO_PI);
        ctx.fill();
        ctx.stroke();
    }
}

//#region UI
function run(){
    t=0;
    total_dp=0;
    particleInit();
}
//#endregion UI

//#region collision
function collide(p1,p2,disSq){
    //elastic collision
    let mt1 = (p1.m-p2.m)/(p1.m+p2.m);
    let mt2 = 2*p1.m/(p1.m+p2.m);
    let theta = Math.atan2(p2.y-p1.y,p2.x-p1.x)
    let cos_theta = Math.cos(theta);
    let sin_theta = Math.sin(theta);

    let vx_temp0 = p1.vx*cos_theta+p1.vy*sin_theta;
    let vx_temp1 = p2.vx*cos_theta+p2.vy*sin_theta;

    let vy_temp0 = p1.vy*cos_theta-p1.vx*sin_theta;
    let vy_temp1 = p2.vy*cos_theta-p2.vx*sin_theta;

    let new_vx0 = mt1*vx_temp0 + mt2*vx_temp1;
    let new_vx1 = mt2*vx_temp0 - mt1*vx_temp1;

    p1.vx = new_vx0*cos_theta - vy_temp0*sin_theta;
    p1.vy = new_vx0*sin_theta + vy_temp0*cos_theta;

    p2.vx = new_vx1*cos_theta - vy_temp1*sin_theta;
    p2.vy = new_vx1*sin_theta + vy_temp1*cos_theta;

    //pull balls out
    let half_diff= BALL_RADIUS-Math.sqrt(disSq)*0.5;
    let half_diff_cos_theta = Math.abs(half_diff*cos_theta);
    let half_diff_sin_theta = Math.abs(half_diff*sin_theta);

    let pt1=p2;
    let pt2=p1;
    if(p1.x>p2.x){
        pt1=p1;
        pt2=p2;
    }
    pt1.x+=half_diff_cos_theta;
    pt2.x-=half_diff_cos_theta;

    if(p1.y>p2.y){
        pt1=p1;
        pt2=p2;
    }else{
        pt1=p2;
        pt2=p1;
    }
    pt1.y+=half_diff_sin_theta;
    pt2.y-=half_diff_sin_theta;
    
}

function checkCollision(p1,p2){
    let disSq = distanceSq(p1.x,p1.y,p2.x,p2.y)
    if(disSq <= TWO_BALL_RADIUS_SQUARE){
        if(!p1.collided && !p2.collided)
            collide(p1,p2,disSq);
    }
}

const MAX_X_BB = cv.width-BALL_RADIUS;
const MAX_Y_BB = cv.height-BALL_RADIUS;
function checkWallCollision(p1){

    let outOfBoundX = false;
    if(p1.x <= BALL_RADIUS){
        p1.vx = Math.abs(p1.vx);
        outOfBoundX=true;
    }else if(p1.x >=MAX_X_BB){
        p1.vx = -Math.abs(p1.vx);
        outOfBoundX=true;
    }

    if(outOfBoundX){
        if(!p1.outOfBoundX){
            registerImpulse(p1.m,p1.vx);
            p1.outOfBoundX = true;
        }
    }else{
        p1.outOfBoundX = false;
    }


    let outOfBoundY = false;
    if(p1.y <= BALL_RADIUS){
        p1.vy = Math.abs(p1.vy);
        outOfBoundY=true;
    }else if(p1.y >=MAX_Y_BB){
        p1.vy = -Math.abs(p1.vy);
        outOfBoundY=true;
    }

    if(outOfBoundY){
        if(!p1.outOfBoundY){
            registerImpulse(p1.m,p1.vy);
            p1.outOfBoundY = true;
        }
    }else{
        p1.outOfBoundY = false;
    }

}
//#endregion collision

//#region Utils

var total_dp = 0;
function registerImpulse(mass,v){
    total_dp+=mass*Math.abs(v)*2;
}

function randColor(){
    return randomColor = '#'+ Math.floor(Math.random()*16777215).toString(16);    
}

function distanceSq(x0,y0,x1,y1){
    let dx= (x0-x1);
    let dy= (y0-y1);
    return dx*dx+dy*dy;
}

function distance(x0,y0,x1,y1){
    return Math.sqrt(distanceSq(x0,y0,x1,y1));
}

function setColor(color){
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
}

function getCanvasX(posX){
    return posX;
}

function getCanvasY(posY){
    return cv.height-posY;
}

function showPressure(){
    ele_pressure.innerHTML = "Pressure: "+(total_dp/t/(cv.height+cv.width)*2).toFixed(4) + " N/pixel";
}

//#endregion Utils

//#region mainTick
var oldT=0;
function tick(){

    ctx.clearRect(0,0,cv.width,cv.height);

    for(let i=0;i<N;i++){
        checkWallCollision(particles[i]);
        for(let j=i+1;j<N;j++){
            checkCollision(particles[i],particles[j]);
        }
    }

    for(let i=0;i<N;i++){
        let p = particles[i];
        setColor(p.color);
        p.tick(TIME_STEP);
        p.drawBall(i);
    }

    t+=TIME_STEP;
    
    let newT = Date.now();
    if(newT-oldT>=200){
        showPressure();
        oldT = Date.now();
    }

    requestAnimationFrame(tick)
}
//#endregion mainTick

//#region Init

function particleInit(){
    particles = new Array(N);
    for(let i=0;i<N;i++){
        particles[i] = (new Particle(0,0,0,0,1)).random();
    }
}

run();
requestAnimationFrame(tick);

//#endregion Init