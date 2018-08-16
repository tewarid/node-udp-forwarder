#!/usr/bin/env node
var argv = require("commander");
var packageConfig = require('./package.json');

argv
.usage("[options]")
.version(packageConfig.version)
.option("-p, --port [number]", "Listen at specified port number", parseInt)
.option("-a, --address [address]", "Listen at specified IP address")
.option("-m, --multicastAddress [address]",
    "Join and listen for datagrams from specified multicast group")
.option("-i, --protocol [udp4|udp6]",
    "Specify udp4 to use IPv4, udp6 to use IPv6", "udp4")
.option("-d, --destinationPort <number>", "Forward to specified port", parseInt)
.option("-n, --destinationAddress <host>",
    "Forward to specified host name, or unicast or multicast IP address")
.option("-f, --forwarderPort [number]", "Forward from specified port", parseInt)
.option("-o, --forwarderAddress [address]", "Forward from specified IP address")
.parse(process.argv);

const options = {
    protocol: argv.protocol,
    port: argv.port,
    address: argv.address,
    multicastAddress: argv.multicastAddress,
    forwarderPort: argv.forwarderPort,
    forwarderAddress: argv.forwarderAddress,
    created: created
};

const f = require('./udp-forwarder.js').create(argv.destinationPort,
    argv.destinationAddress, options);

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
