const dgram = require('dgram');

const ANY_IPV4_ADDRESS = '0.0.0.0';
const ANY_IPV6_ADDRESS = '::';
const ANY_PORT = 0;
const UDP_IPV4 = 'udp4';
const UDP_IPV6 = 'udp6';

function UdpForwarder(destinationPort, destinationAddress, options) {
    initialize(this, destinationPort, destinationAddress, options);
}

function initialize(o, destinationPort, destinationAddress, options) {
    o.destinationPort = destinationPort;
    if (o.destinationPort === undefined) {
        throw String('Need port to forward datagrams to.');
    }
    o.destinationAddress = destinationAddress;
    if (o.destinationAddress === undefined) {
        throw String('Need host name or address to forward datagrams to.');
    }
    o.options = options;
    o.protocol = options.protocol;
    if (o.protocol === undefined) {
        o.protocol = UDP_IPV4;
    }
    o.listeners = 0;
    o.sourceRemoteEndpoint = undefined;
    initializeForwarder(o, options);
    initializeSource(o, options);
}

function initializeForwarder(o, options) {
    evaluateForwarderOptions(o, options);
    o.forwarder = dgram.createSocket(o.protocol);
    o.forwarder.on('error', (err) => {
        console.log(`forwarder error:\n${err.stack}`);
        o.end();
    });
    o.forwarder.on('message', (msg, rinfo) => {
        if (o.sourceRemoteEndpoint !== undefined) {
            o.source.send(msg, o.sourceRemoteEndpoint.port,
                o.sourceRemoteEndpoint.address);
        }
    });
    o.forwarder.on('listening', () => {
        const address = o.forwarder.address();
        o.forwarderPort = address.port;
        callback(o);
    });
    o.forwarder.bind(o.forwarderPort, o.forwarderAddress);
}

function evaluateForwarderOptions(o, options) {
    o.forwarderPort = options.forwarderPort;
    if (o.forwarderPort === undefined) {
        o.forwarderPort = ANY_PORT;
    }
    o.forwarderAddress = options.forwarderAddress;
    if (o.forwarderAddress === undefined) {
        o.forwarderAddress = anyIPAddress(o.protocol);
    }
}

function initializeSource(o, options) {
    evaluateSourceOptions(o, options);
    o.source = dgram.createSocket(o.protocol);
    o.source.on('error', (err) => {
        console.log(`source error:\n${err.stack}`);
        o.end();
    });
    o.source.on('message', (msg, rinfo) => {
        o.sourceRemoteEndpoint = rinfo;
        o.forwarder.send(msg, o.destinationPort, o.destinationAddress);
    });
    o.source.on('listening', () => {
        const address = o.source.address();
        o.port = address.port;
        if (o.options.multicastAddress) {
            console.log(`adding membership to group`
                + ` ${o.options.multicastAddress}`
                + ` on interface ${o.address}`);
            o.source.addMembership(o.options.multicastAddress, o.address);
        }
        callback(o);
    });
    o.source.bind(o.port, o.address);
}

function evaluateSourceOptions(o, options) {
    o.port = options.port;
    if (o.port === undefined) {
        o.port = ANY_PORT;
    }
    o.address = options.address;
    if (o.address === undefined) {
        o.address = anyIPAddress(o.protocol);
    }
    var isWindows = /^win/.test(process.platform);
    if (!isWindows && o.options.multicastAddress) {
        const address = anyIPAddress(o.protocol);
        if (o.address !== address) {
            console.log(`listening for multicast datagrams on a`
                + ` specific interface such as ${o.address}`
                + ` is only supported on Windows`);
            o.address = address;
        }
    }
}

function anyIPAddress(protocol) {
    if (protocol === UDP_IPV4) {
        return ANY_IPV4_ADDRESS;
    } else if (protocol === UDP_IPV6) {
        return ANY_IPV6_ADDRESS;
    }
}

function callback(o) {
    o.listeners++;
    if (o.listeners == 2 && o.options.created) {
        o.options.created();
    }
}

UdpForwarder.prototype.end = function() {
    this.source.close();
    this.forwarder.close();
};

module.exports = {
    create: function create(destinationPort, destinationAddress, options) {
        if (options == undefined) {
            options = {};
        }
        return new UdpForwarder(destinationPort, destinationAddress, options);
    }
};
