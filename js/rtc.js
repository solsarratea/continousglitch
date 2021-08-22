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
		console.log("Got hello: from "+ data.from)
		let pc = createPeerConnection(socket,pcs,data, id);
		await pc.setLocalDescription(await pc.createOffer());
		socket.emit('offer', {from: id, to: data.from, offer: pc.localDescription })
	});

	socket.on('offer', async data => {
		if (data.to == id){
			let pc = createPeerConnection(socket,pcs,data,id);
			console.log("Got offer: from " + data.from ,pc)
			await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
			await pc.setLocalDescription(await pc.createAnswer());
			socket.emit('answer', {from: id, to: data.from, answer: pc.localDescription});
		}
	});

	socket.on('answer', async data => {
		if (data.to == id){
			let pc = pcs.get(data.from);
			console.log("Got answer: from "+ data.from)
			await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
	}})

	socket.on('candidate', data => {
		if (data.to == id){
			let pc = pcs.get(data.from);
			console.log("got candidate", data.candidate)
			pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	})
    console.log("Emitting 'hello' message with id: ", id)
	socket.emit('hello', {from: id})
}

function broadcast(msg){
   // console.log("Sending msg", msg)
	for (let index = 0; index < datachannels.length; index++) {
		datachannels[index].send(msg);	
	}
}

function createPeerConnection(socket,pcs,data,id){
	let pc = new RTCPeerConnection({"iceServers":[
		{"urls":"stun:stun.l.google.com:19302"},
		{
			'urls': 'turn:turn.b621.net:3478?transport=udp',
			'credential': 'ifyouseethis',
      			'username': 'twitter-benjojo12'
    		},
    		{
      			'urls': 'turn:turn.b621.net:3478?transport=tcp',
			'credential': 'ifyouseethis',
      			'username': 'twitter-benjojo12'
    		}]
	});

	pc.onicecandidate = e => {
		if (e.candidate) {
			socket.emit('candidate', {to: data.from , from: id ,candidate: e.candidate});
		}
	}
  
	let datachannel = pc.createDataChannel("data", {negotiated: true, id: 0});
	datachannel.onopen = e => {
		console.log("Datachannel open!");
		datachannels.push(datachannel);
	};
  
	datachannel.onmessage = e => {
        if (window.guiData.receiver){
            console.log("Receiving data.")
		    receiveMessage(e)
        }
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

function broadcastSingleMessage(kind, state, value){
    if(state){
        console.log("Broadcasting: ", kind, " with value ", value)
        broadcast(JSON.stringify({
		    kind: kind,
		    value: value
	    }));
    }
}
function broadcastMessages(sendParams){
    if(window.guiData.sender){
        for (var param in sendParams) {
            if (sendParams.hasOwnProperty(param)) {
                const kind = param;
                const state = sendParams[param];
                const value = window.guiData[param];
                broadcastSingleMessage(kind, state, value);

            }
        }
    }
}

function receiveMessage(e){
    if(window.guiData.receiver){
        const msg = JSON.parse(e.data);
        const kind = msg.kind;
        const value = msg.value;
        const receiveParams = window.guiData.receive;
             if (receiveParams.hasOwnProperty(kind)) {
                 const state = receiveParams[kind];
                 if (state){
                     console.log("Receiving: ", kind, " with value ", value)
                     window.guiData[kind] = value;
                 }

             }
    }
}

connect();
