const dgram = require('dgram');

const ANY_IPV4_ADDRESS = '0.0.0.0';
const ANY_IPV6_ADDRESS = '::';
const ANY_PORT = 0;
const UDP_IPV4 = 'udp4';
const UDP_IPV6 = 'udp6';

function UdpForwarder(destinationPort, destinationAddress, protocol, port,
    address, multicastAddress, forwarderPort, forwarderAddress) {

    this.destinationPort = destinationPort;
    if (this.destinationPort === undefined) {
        throw String('Need port to forward datagrams to.');
    }
    this.destinationAddress = destinationAddress;
    if (this.destinationAddress === undefined) {
        throw String('Need host name or address to forward datagrams to.');
    }
    this.protocol = protocol;
    if (this.protocol === undefined) {
        this.protocol = UDP_IPV4;
    }
    this.port = port;
    if (this.port === undefined) {
        this.port = ANY_PORT;
    }
    this.address = address;
    if (this.address === undefined) {
        this.address = ANY_IPV4_ADDRESS;
    }
    this.multicastAddress = multicastAddress;
    this.multicastInterface = this.address;
    this.forwarderPort == forwarderPort;
    if (this.forwarderPort === undefined) {
        this.forwarderPort = ANY_PORT;
    }
    this.forwarderAddress = forwarderAddress;
    if (this.forwarderAddress === undefined) {
        this.forwarderAddress = forwarderAddress;
    }
    this.serverRemoteEndpoint = undefined;

    this.forwarder = dgram.createSocket(this.protocol);
    this.server = dgram.createSocket(this.protocol);

    const o = this;

    o.forwarder.on('error', (err) => {
        console.log(`forwarder error:\n${err.stack}`);
        o.forwarder.close();
        o.server.close();
    });

    o.server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        o.server.close();
        o.forwarder.close();
    });

    o.forwarder.on('message', (msg, rinfo) => {
        if (o.serverRemoteEndpoint !== undefined) {
            o.server.send(msg, o.serverRemoteEndpoint.port,
                o.serverRemoteEndpoint.address);
        }
    });

    o.server.on('message', (msg, rinfo) => {
        o.serverRemoteEndpoint = rinfo;
        o.forwarder.send(msg, o.destinationPort, o.destinationAddress);
    });

    o.forwarder.on('listening', () => {
        const address = o.forwarder.address();
        console.log(`forwarding from ${address.address}:${address.port}`);
    });

    o.server.on('listening', () => {
        const address = o.server.address();
        console.log(`listening on ${address.address}:${address.port}`);
        if (o.multicastAddress && o.multicastInterface) {
            console.log(`adding membership to group ${o.multicastAddress}`
                + ` on interface ${o.multicastInterface}`);
            o.server.addMembership(o.multicastAddress, o.multicastInterface);
        }
    });

    o.forwarder.bind(o.forwarderPort, o.forwarderAddress);

    var isWindows = /^win/.test(process.platform);
    if (!isWindows
        && (o.address !== ANY_IPV4_ADDRESS || o.address !== ANY_IPV6_ADDRESS)) {
        console.log(`cannot listen for multicast datagrams at ${o.address},`
            + ` it is only supported on Windows`);
    }
    if (!isWindows && o.multicastAddress && o.protocol === UDP_IPV4) {
        o.address = ANY_IPV4_ADDRESS;
    } else if (!isWindows && multicastAddress && o.protocol === UDP_IPV6) {
        o.address = ANY_IPV6_ADDRESS;
    }

    o.server.bind(o.port, o.address);
}

UdpForwarder.prototype.end = function() {
    this.server.close();
    this.forwarder.close();
};

module.exports = {
    create: function create(destinationPort, destinationAddress, protocol, port,
        address, multicastAddress, forwarderPort, forwarderAddress) {
        return new UdpForwarder(destinationPort, destinationAddress,
            protocol, port, address, multicastAddress,
            forwarderPort, forwarderAddress);
    }
};
