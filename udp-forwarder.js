const dgram = require('dgram');

const ANY_IPV4_ADDRESS = '0.0.0.0';
const ANY_IPV6_ADDRESS = '::';
const ANY_PORT = 0;
const UDP_IPV4 = 'udp4';
const UDP_IPV6 = 'udp6';

module.exports = {
    create: function create(destinationPort, destinationAddress, options) {
        if (options == undefined) {
            options = {};
        }
        return new UdpForwarder(destinationPort, destinationAddress, options);
    }
};

function UdpForwarder(destinationPort, destinationAddress, options) {
    this.initialize(destinationPort, destinationAddress, options);
}

UdpForwarder.prototype.initialize = function(destinationPort, destinationAddress, options) {
    var self = this;
    self.destinationPort = destinationPort;
    if (self.destinationPort === undefined) {
        throw String('Need port to forward datagrams to.');
    }
    self.destinationAddress = destinationAddress;
    if (self.destinationAddress === undefined) {
        throw String('Need host name or address to forward datagrams to.');
    }
    self.options = options;
    self.protocol = options.protocol || UDP_IPV4;
    self.listeners = 0;
    self.sourceRemoteEndpoint = undefined;
    self.initializeForwarder();
    self.initializeSource();
};

UdpForwarder.prototype.initializeForwarder = function() {
    var self = this;
    self.evaluateForwarderOptions();
    self.forwarder = dgram.createSocket(self.protocol);
    self.forwarder.on('error', (err) => {
        console.log(`forwarder error:\n${err.stack}`);
        self.end();
    });
    self.forwarder.on('message', (msg, rinfo) => {
        if (self.sourceRemoteEndpoint !== undefined) {
            self.source.send(msg, self.sourceRemoteEndpoint.port,
                self.sourceRemoteEndpoint.address);
        }
    });
    self.forwarder.on('listening', () => {
        const address = self.forwarder.address();
        self.forwarderPort = address.port;
        self.invokeCreated();
    });
    self.forwarder.bind(self.forwarderPort, self.forwarderAddress);
};

UdpForwarder.prototype.evaluateForwarderOptions = function() {
    var self = this;
    self.forwarderPort = self.options.forwarderPort || ANY_PORT;
    self.forwarderAddress = self.options.forwarderAddress ||
        anyIPAddress(self.protocol);
};

UdpForwarder.prototype.initializeSource = function() {
    var self = this;
    self.evaluateSourceOptions();
    self.source = dgram.createSocket(self.protocol);
    self.source.on('error', (err) => {
        console.log(`source error:\n${err.stack}`);
        self.end();
    });
    self.source.on('message', (msg, rinfo) => {
        self.sourceRemoteEndpoint = rinfo;
        self.forwarder.send(msg, self.destinationPort, self.destinationAddress);
    });
    self.source.on('listening', () => {
        const address = self.source.address();
        self.port = address.port;
        if (self.options.multicastAddress) {
            console.log(`adding membership to group`
                + ` ${self.options.multicastAddress}`
                + ` on interface ${self.address}`);
            self.source.addMembership(self.options.multicastAddress, self.address);
        }
        self.invokeCreated();
    });
    self.source.bind(self.port, self.address);
};

UdpForwarder.prototype.evaluateSourceOptions = function() {
    var self = this;
    self.port = self.options.port || ANY_PORT;
    self.address = self.options.address || anyIPAddress(self.protocol);
    var isWindows = /^win/.test(process.platform);
    if (!isWindows && self.options.multicastAddress) {
        const address = anyIPAddress(self.protocol);
        if (self.address !== address) {
            console.log(`listening for multicast datagrams on a ` +
                `specific interface such as ${self.address} ` +
                `is only supported on Windows`);
            self.address = address;
        }
    }
};

function anyIPAddress(protocol) {
    if (protocol === UDP_IPV4) {
        return ANY_IPV4_ADDRESS;
    } else if (protocol === UDP_IPV6) {
        return ANY_IPV6_ADDRESS;
    }
};

UdpForwarder.prototype.invokeCreated = function() {
    var self = this;
    self.listeners++;
    if (self.listeners == 2 && self.options.created) {
        self.options.created();
    }
};

UdpForwarder.prototype.end = function() {
    this.source.close();
    this.forwarder.close();
};
