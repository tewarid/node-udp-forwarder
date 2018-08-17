var dgram = require("dgram");

var ANY_IPV4_ADDRESS = "0.0.0.0";
var ANY_IPV6_ADDRESS = "::";
var ANY_PORT = 0;
var UDP_IPV4 = "udp4";
var UDP_IPV6 = "udp6";

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

UdpForwarder.prototype.initialize = function(destinationPort,
    destinationAddress, options) {
    var self = this;
    self.destinationPort = destinationPort;
    if (self.destinationPort === undefined) {
        throw String("Need port to forward datagrams to.");
    }
    self.destinationAddress = destinationAddress;
    if (self.destinationAddress === undefined) {
        throw String("Need host name or address to forward datagrams to.");
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
    self.forwarder.on("error", function(err) {
        endDueToError("forwarder error", err);
    });
    self.forwarder.on("message", function(msg, rinfo) {
        if (self.sourceRemoteEndpoint !== undefined) {
            self.source.send(msg, self.sourceRemoteEndpoint.port,
                self.sourceRemoteEndpoint.address);
        }
    });
    self.forwarder.on("listening", function() {
        var address = self.forwarder.address();
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
    self.source.on("error", function(err) {
        endDueToError("source error", err);
    });
    self.source.on("message", function(msg, rinfo) {
        self.sourceRemoteEndpoint = rinfo;
        self.forwarder.send(msg, self.destinationPort, self.destinationAddress);
    });
    self.source.on("listening", function() {
        var address = self.source.address();
        self.port = address.port;
        if (self.options.multicastAddress) {
            console.log("adding membership to group "
                + self.options.multicastAddress
                + " on interface " + self.address);
            self.source.addMembership(self.options.multicastAddress,
                self.address);
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
        var address = anyIPAddress(self.protocol);
        if (self.address !== address) {
            console.log("listening for multicast datagrams on a " +
                "specific interface such as " + self.address +
                " is only supported on Windows");
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

UdpForwarder.prototype.endDueToError = function(message, err) {
    console.log(message + ":\n" + err.stack);
    this.end();
};

UdpForwarder.prototype.end = function() {
    this.source.close();
    this.forwarder.close();
};
