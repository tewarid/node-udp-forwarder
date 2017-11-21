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

const f = udpf.create(argv.destinationPort, argv.destinationAddress,
    argv.protocol,
    argv.port, argv.address,
    argv.multicastAddress,
    argv.forwarderPort, argv.forwarderAddress);

process.on("uncaughtException", function(err) {
    console.info(err);
});

process.on("SIGINT", function() {
    f.end();
});
