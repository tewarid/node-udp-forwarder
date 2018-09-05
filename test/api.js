var udpf = require("node-udp-forwarder");

var options = {
    protocol: 'udp4',
    port: 8000,
    address: '127.0.0.1',
    multicastAddress: '225.0.0.1',
    forwarderPort: 0, // any
    forwarderAddress: '127.0.0.1',
    created: created
};

var f = udpf.create(8001, '127.0.0.1', options);

function created() {
    console.log("listening on " + f.address + ":" + f.port);
    console.log("forwarding from " + f.forwarderAddress + ":" +
        f.forwarderPort);
}

// call f.end() when done
