# node-udp-forwarder [![Build Status](https://semaphoreci.com/api/v1/tewarid/node-udp-forwarder/branches/master/badge.svg)](https://semaphoreci.com/tewarid/node-udp-forwarder) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/e9d12b56dd6649e1ab966be1198a0ec9)](https://www.codacy.com/app/tewarid/node-udp-forwarder?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tewarid/node-udp-forwarder&amp;utm_campaign=Badge_Grade) [![Maintainability](https://api.codeclimate.com/v1/badges/e059350e706ac9f80440/maintainability)](https://codeclimate.com/github/tewarid/node-udp-forwarder/maintainability)

A simple UDP datagram forwarder / proxy. Akin to [socat](http://www.dest-unreach.org/socat/doc/socat-multicast.html) but multi-platform, extensible, and hackable. Provides a command line interface (CLI) and an API.

## Installation

Install using [npm](https://www.npmjs.com/package/node-udp-forwarder)

```bash
[sudo] npm install [-g] node-udp-forwarder
```

## Forwarding using CLI

Here's a full command line example, but only destination port and address are really required
```bash
udpforwarder \
--destinationPort 9903 --destinationAddress 10.211.55.3 \
--protocol udp4 --port 9903 --address 10.211.55.2 \
--multicastAddress 225.0.0.1 \
--forwarderPort 0 --forwarderAddress 10.211.55.2
```

Listens for source datagrams on port `9903` of interface with IP address `10.211.55.2`, and forwards them to destination port `9903` at address `10.211.55.3`. Destination address can be a multicast group such as `225.0.0.1`.

The source port and address of forwarded datagrams are 0 (any random port number) and `10.211.55.2`, respectively. Datagrams received on the random port number are sent to the last known sender of the source datagrams above.

Multicast datagrams arriving at port `9903`, of interface `10.211.55.2` on Windows, are also forwarded. Linux and OS X require that the UDP socket be bound to all interfaces, address `0.0.0.0`, to be able to listen to multicast.

IP version 4 is chosen here using `udp4` but IP version 6 may also be specified using `udp6`.

## Forwarding using API

```javascript
const udpf = require("node-udp-forwarder");
/**
 * messageAdapter is invoked once per received message and should return an array of transformed messages.
 * it can change the message, omit the message, create new messages, or any combination thereof
 *
 * @param msg the received message buffer
 * @param rInfo the message remote source info 
 * @returns {[*]} an array of string or byte buffers to be forwarded to the destination
 */
function messageAdapter (msg, rInfo) {
  const newMessage = `${msg.toString()}-transformed`;
  return [msg, newMessage];
}


const options = {
    protocol: 'udp4',
    port: 9903,
    address: '10.211.55.2',
    multicastAddress: '225.0.0.1',
    forwarderPort: 0,
    forwarderAddress: '10.211.55.2',
    messageAdapter: messageAdapter, // optional
    created: created
};

var f = udpf.create(4007, '10.211.55.3', options);

function created() {
    console.log(`listening on ${f.address}:${f.port}`);
    console.log(`forwarding from ${f.forwarderAddress}:${f.forwarderPort}`);
}

// call f.end() when done
```
