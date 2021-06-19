let datachannels = [];
let socket;

function connect() {
    console.log("connecting")
	// Connect to signalling server:
    console.log("https://continous-glitch.herokuapp.com/");
    socket = io.connect("https://continous-glitch.herokuapp.com/");

	let id = Math.floor(Math.random()*100000);
   
	// Start WebRTC handshake. (with social distance)
	let pcs = new Map();
	window.pcs = pcs;

	socket.on('hello', async data => {
		console.log("got hello", data)
		let pc = createPeerConnection(socket,pcs,data, id);
		await pc.setLocalDescription(await pc.createOffer());
		socket.emit('offer', {from: id, to: data.from, offer: pc.localDescription })
	});

	socket.on('offer', async data => {
		if (data.to == id){
			let pc = createPeerConnection(socket,pcs,data,id);
			console.log("got offer",pc)
			await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
			await pc.setLocalDescription(await pc.createAnswer());
			socket.emit('answer', {from: id, to: data.from, answer: pc.localDescription});
		}
	});

	socket.on('answer', async data => {
		if (data.to == id){
			let pc = pcs.get(data.from);
			console.log("got answer")
			await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
	}})

	socket.on('candidate', data => {
		if (data.to == id){
			let pc = pcs.get(data.from);
			console.log("got candidate", data.candidate)
			pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	})

	socket.emit('hello', {from: id})
}

function onmsg(e) {
	let msg = JSON.parse(e.data);
    switch (msg.kind){
    case 'interpolate':
        window.guiData.interpolate = msg.value;
        break;
    case 'diffusionRate1':
        window.guiData.diffusionRate1 = msg.value;
        break;
    case 'diffusionRate2':
        window.guiData.diffusionRate2 = msg.value;
        break;
    case 'invert':
        window.guiData.invert = msg.value;
        break;
    case 'sharp':
        window.guiData.sharp = msg.value;
        break;
    case 'hue':
        window.guiData.hue = msg.value;
        break;
    case 'saturate':
        window.guiData.saturate = msg.value;
        break;
    case 'weight':
        window.guiData.weight = msg.value;
        break;

      default:
        console.log(`Invalid msg ${msg.kind}`)
    }
}

function broadcast(msg){
 // console.log("sending msg", msg)
	for (let index = 0; index < datachannels.length; index++) {
		datachannels[index].send(msg);	
	}
}

function createPeerConnection(socket,pcs,data,id){
	let pc = new RTCPeerConnection({"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]});

	pc.onicecandidate = e => {
		if (e.candidate) {
			socket.emit('candidate', {to: data.from , from: id ,candidate: e.candidate});
		}
	}
  
	let datachannel = pc.createDataChannel("data", {negotiated: true, id: 0});
	datachannel.onopen = e => {
		console.log("datachannel open!");
		datachannels.push(datachannel);
	};
  
	datachannel.onmessage = e => {
		onmsg(e)
	}


	datachannel.binaryType = "arraybuffer"
	datachannel.onclose = e => {
		console.log("datachannel closed!",e);
		datachannels.splice(datachannels.indexOf(datachannel),1);
	};
	datachannel.onerror = e => {
		console.log("datachannel error:", e);
	};
	pcs.set(data.from, pc);
	return pc;
}

function broadcastSingleMessage(kind, value){
    //TODO: implement actor to be sender and to chose which parameters to broadcast
    if(window.guiData.sender){
       // console.log("Broadcasting: ", kind)
        broadcast(JSON.stringify({
		    kind: kind,
		    value: value
	    }));
    }
}
function broadcastMessages(){
//FIXME: hardcoded parameters to broadcast
    broadcast(JSON.stringify({
		kind: 'interpolate',
		value: window.guiData.interpolate,
	}));

    broadcast(JSON.stringify({
		kind: 'diffusionRate1',
		value: window.guiData.diffusionRate1,
	}));

    // broadcast(JSON.stringify({
	// 	kind: 'hue',
	// 	value: window.guiData.hue,
	// }));

    // broadcast(JSON.stringify({
	// 	kind: 'saturate',
	// 	value: window.guiData.saturate,
	// }));

    broadcast(JSON.stringify({
		kind: 'sharp',
		value: window.guiData.sharp,
	}));

    broadcast(JSON.stringify({
		kind: 'invert',
		value: window.guiData.invert,
	}));
    // broadcast(JSON.stringify({
	// 	kind: 'weight',
	// 	value: window.guiData.weight,
	// }));
}

connect();
