# nodejs-snmp-traffic

## description

this script reads the current network traffic as kb/s over the snmp protocol. The default OID for traffic retrieval is ".1.3.6.1.2.1.2.2.1.10.5", which is the br0-wan (incoming) interface in openwrt backfire 10.03.1.

the internal snmp value describe the bytes transferred since the router has started.

## usage

    var snmp = require('./snmp_traffic');

    var traffic = snmp.Client('hostip');
    traffic.on('update', function( kbps ) {
        console.log( kbps );
    });

the callback is triggered as soon as a new value is available. our openwrt router only updates the value every 12/13 seconds.

## dependencies

* snmp-native

Just run

    npm install

inside your local git directory
