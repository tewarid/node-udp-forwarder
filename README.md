# node-udp-forwarder [![Codacy Badge](https://api.codacy.com/project/badge/Grade/e9d12b56dd6649e1ab966be1198a0ec9)](https://www.codacy.com/app/tewarid/node-udp-forwarder?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=tewarid/node-udp-forwarder&amp;utm_campaign=Badge_Grade)

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

var f = udpf.create(4007, '10.211.55.3',
    'udp4', 9903, '10.211.55.2',
    '225.0.0.1', 0, '10.211.55.2');

// call f.end() when done
```
