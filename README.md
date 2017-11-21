# node-udp-forwarder

A simple UDP datagram forwarder / proxy. Akin to [socat](http://www.dest-unreach.org/socat/doc/socat-multicast.html) but multi-platform, extensible, and hackable. Provides a command line interface (CLI) and an API.

## Forwarding using CLI

Here's a full command line example, but only destination port and address are really required
```bash
udpforwarder \
--destinationPort 9903 --destinationAddress 10.211.55.3 \
--protocol udp4 --port 9903 --address 10.211.55.2 \
--multicastAddress 225.0.0.1 \
--forwarderPort 0 --forwarderAddress 10.211.55.2
```

Listens for incoming datagrams on port 9903 of the interface with IP address 10.211.55.2, and forwards them to port 9903 of IP address 10.211.55.3.

The source port and address of forwarded datagrams are 0 (picks any random port number) and 10.211.55.2, respectively. Datagrams received on the random port number are sent to the last known sender of the incoming datagrams above.

Multicast datagrams arriving at port 9903 (of interface 10.211.55.2 on Windows) are also forwarded.

IP version 4 is used here (udp4) but IP version 6 (udp6) may also be specified.

## Forwarding using API

```javascript
const udpf = require("./udp-forwarder");

var f = udpf.create(4007, '10.211.55.3',
    'udp4', 9903, '10.211.55.2',
    '225.0.0.1', 0, '10.211.55.2');

// call f.end() when done
```
