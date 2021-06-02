window.w = window.innerWidth 
window.h = window.innerHeight

////////////// AUX
var getParam = function (url) {
  var parser = document.createElement('a');
  parser.href = url;
  var query = parser.search.substring(1);
  return query;
};
let param = getParam(window.location.href);
////////////////////////////////////////////////////

window.step = 1.;
window.iterations = 3;
window.interpolate = .5;
window.weight = 5;
window.sharp = 0.5;
window.diffusionRate1 = 2.;
window.diffusionRate2 = 3.5;
window.frequencyBroadcast = 3;

window.guiData = {};
window.gui;
function  addGuiControls(){
    gui = new dat.GUI();
    gui.remember(this);
  
    guiData = {
      "step" : 1.,
      "iterations": 1,
      "interpolate": .2,
      "sharp": 0.2,
      "weight" : 10.,
      "diffusionRate1": 2.,
      "diffusionRate2": 3.5,
      "frequencyBroadcast": 5,
  };
    gui.add(guiData, 'frequencyBroadcast', 1, 100 ).step(1);
    gui.add(guiData, 'step', 0., 5.).step(.1);
    gui.add(guiData, 'iterations', 1, 10 ).step(1);
    gui.add(guiData, 'interpolate', 0, 2.).step(0.001);
    gui.add(guiData, 'sharp', 0, 1.).step(0.001);
    gui.add(guiData, 'weight', -20, 20.); 
    gui.add(guiData, 'diffusionRate1', 0. ,10.).step(0.001);
    gui.add(guiData, 'diffusionRate2', 0. ,10.).step(0.001);
};

var camera, renderer,scene, domEevents,controls,dragControls;
function setupMainScene(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(2, 3, 5);
  renderer = new THREE.WebGLRenderer({});

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.setScalar(10);
  scene.add(light);

  controls.minDistance = 0.025;
  controls.maxDistance = 44;
}

var bufferScene ,ping ,pong, renderTargetParams;
function setupBufferScene(){
    bufferScene = new THREE.Scene();
    renderTargetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearMipMapLinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
    };

    ping = new THREE.WebGLRenderTarget( w, h, renderTargetParams );
    pong = new THREE.WebGLRenderTarget( w, h, renderTargetParams );

}


var texture;
function loadImageTexture(){
  texture = new THREE.TextureLoader().load( param );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
}

var bufferUniforms, bufferMaterial, plane, bufferObject;
function initBufferScene(){
    bufferUniforms = {
      channel1: { type : 't', value : pong.texture },
      time: { type: "f", value: 1.0 },
      step: { type: "f", value: step},
      iterations: { type: "f", value: iterations },
      diff1: { type: "f", value: diffusionRate1},
      diff2: { type: "f", value: diffusionRate2},
      interpolate: { type: "f", value: interpolate },
      sharp: { value: sharp },
      weight: { type: "f", value: weight },
      channel0: {value: texture},
      resolution : { type : 'v2', value : new THREE.Vector2( window.innerWidth, window.innerHeight ) }
    }


    bufferMaterial = new THREE.ShaderMaterial({
        uniforms : bufferUniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });

    plane = new THREE.PlaneGeometry( 200, 200);  
    bufferObject = new THREE.Mesh( plane, bufferMaterial ); 
    bufferObject.material.side = THREE.DoubleSide;
    bufferScene.add(bufferObject);
}

var material,quad,geom;
function initMainScene(){
  material = new THREE.ShaderMaterial({
    uniforms : {
      channel0: { type : 't', value : pong.texture },
    },
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'finalShader' ).textContent
});
    finalMaterial =  new THREE.MeshBasicMaterial({map: ping.texture});
    geom = new THREE.PlaneBufferGeometry( 2, 2);
    quad = new THREE.Mesh( geom, material );
    quad.material.side = THREE.DoubleSide;
    scene.add(quad);
}

function nStepSimulation() {
  for (var i = 0; i < iterations; i++) {
    renderer.setRenderTarget(ping);
    renderer.render(bufferScene, camera);

    renderer.setRenderTarget(null);
    renderer.clear();

    var temp = pong;
    pong= ping;
    ping= temp;

    quad.material.map = ping.texture;
    bufferMaterial.uniforms.channel0.value = pong.texture;
  }
}

function broadcastMessages(){
  broadcast(JSON.stringify({
		kind: 'interpolate',
		value: guiData.interpolate,
	}));
  
  broadcast(JSON.stringify({
		kind: 'diffusionRate',
		value: guiData.diffusionRate1,
	}));
  
   broadcast(JSON.stringify({
		kind: 'sharp',
		value: guiData.sharp,
	}));
}

var timeU,frame;

frame = 0;
function render() {
  timeU = performance.now() * 0.05;
  bufferMaterial.uniforms.time.value = timeU;
  
  bufferMaterial.uniforms.step.value = guiData.step;
  bufferMaterial.uniforms.interpolate.value = guiData.interpolate;
 
  bufferMaterial.uniforms.sharp.value = guiData.sharp
  bufferMaterial.uniforms.weight.value = guiData.weight;
  
  bufferMaterial.uniforms.diff1.value = guiData.diffusionRate1;
  bufferMaterial.uniforms.diff2.value = guiData.diffusionRate2;
  
  if (frame % (frequencyBroadcast *100) == 0){
    broadcastMessages();
  };
  frame ++;
  requestAnimationFrame(render);
  
  for (let index = 0; index < iterations; index++) {
    renderer.setRenderTarget(ping);
    renderer.render(bufferScene, camera);

    renderer.setRenderTarget(null);
    renderer.clear();

    let temp = pong;
    pong = ping;
    ping = temp;
    
    quad.material.uniforms.channel0.value = ping.texture;
    bufferMaterial.uniforms.channel1.value = pong.texture;
  }

  
  renderer.render(scene, camera);
}

loadImageTexture();
setupMainScene();
setupBufferScene();
initBufferScene();
initMainScene();

addGuiControls();
render();
