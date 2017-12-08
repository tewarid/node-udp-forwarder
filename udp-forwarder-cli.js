#!/usr/bin/env node
const udpf = require('./udp-forwarder.js');

const argv = require("optimist")
.usage("Usage: $0"
+ " --destinationPort [port] --destinationAddress [address]"
+ " [--protocol [udp4|udp6]]"
+ " [--port [port]] [--address [address]]"
+ " [--multicastAddress [address]]"
+ " [--forwarderPort [port]] [--forwarderAddress [address]]")
.demand(["destinationPort", "destinationAddress"])
.boolean("q")
.argv;

const options = {
    protocol: argv.protocol,
    port: argv.port,
    address: argv.address,
    multicastAddress: argv.multicastAddress,
    forwarderPort: argv.forwarderPort,
    forwarderAddress: argv.forwarderAddress,
    created: created
};

const f = udpf.create(argv.destinationPort, argv.destinationAddress, options);

function created() {
    console.log(`listening on ${f.address}:${f.port}`);
    console.log(`forwarding from ${f.forwarderAddress}:${f.forwarderPort}`);
}

process.on("uncaughtException", function(err) {
    console.info(err);
});

process.on("SIGINT", function() {
    f.end();
});
