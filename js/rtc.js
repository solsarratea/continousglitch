let datachannels = [];
let socket;

function connect() {
	// Connect to signalling server:
  console.log('connected to signalling server at https://continous-glitch.glitch.me/');

  socket = io.connect('https://continous-glitch.glitch.me/');

	let id = Math.floor(Math.random()*100000);
   
	// Start WebRTC handshake. (with social distance)
	let pcs = new Map();
	
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
			console.log("got candidate")
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
      case 'diffusionRate': 
        window.guiData.diffusionRate1 = msg.value;
        break;
      case 'sharp': 
        window.guiData.sharp = msg.value;
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

connect();