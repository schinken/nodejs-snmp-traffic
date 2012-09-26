var  snmp   = require('snmp-native')
    ,util   = require('util')
    ,events = require('events')
    ,common = require('./common');


var Client = function( host ) {

    events.EventEmitter.call(this);

    this.host       = host;

    this.last_time  = new Date();
    this.last_bytes = 0.0;

    this.session    = false;

    this.setup();
};

util.inherits(Client, events.EventEmitter);


Client.prototype.setup = function() {

    this.session = new snmp.Session({ host: this.host });

    var ctx = this;

    setInterval( function() {
        ctx.poll_snmp()
    }, 2000 );
};

Client.prototype.poll_snmp = function() {

    var client = this;

    this.session.get({ oid: [1,3,6,1,2,1,2,2,1,10,5] }, function( error, val ) {

        if( error ) {
            console.log("Failed to retrieve snmp values");
            return;    
        }

        cur_time = new Date();
        bytes = val[0].value;

        if( client.last_bytes === 0 ) {
            client.last_bytes = bytes;    
        }

        var diff_bytes = bytes - client.last_bytes;
        if( diff_bytes > 0 ) {

            client.last_bytes = bytes;

            // diff of interval in ms
            var diff_time = ( cur_time-client.last_time ) / 1000.0;
            client.last_time = cur_time;
            
            var cur_kbps = diff_bytes / 1024.0 / diff_time;
            client.emit('update', cur_kbps);
        }

    });
};

module.exports = {
    Client: Client    
};
