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
    gui.add(guiData, 'weight', 0, 20.); 
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

var material,quad,geom;

function initMainScene(){
  const loader = new THREE.TextureLoader();
  loader.load(
  param,
  function(texture){
    
    material = new THREE.ShaderMaterial({
    uniforms : {
      channel0: { type : 't', value : texture },
    },
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'finalShader' ).textContent
});
    finalMaterial =  new THREE.MeshBasicMaterial({map: texture});
    geom = new THREE.PlaneBufferGeometry( 2, 2);
    quad = new THREE.Mesh( geom, material );
    quad.material.side = THREE.DoubleSide;
    scene.add(quad);
},
    undefined,
    function(err){
      console.error("AN ERROR")
    }
)}


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
 
  if (frame % (frequencyBroadcast *100) == 0){
    broadcastMessages();
  };
  frame ++;
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

setupMainScene();

initMainScene();

addGuiControls();
render();
