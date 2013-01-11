var  snmp   = require('snmp-native')
    ,util   = require('util')
    ,events = require('events');


var Client = function( host, oid, interval ) {

    events.EventEmitter.call(this);

    this.host       = host;
    this.oid        = oid || [1,3,6,1,2,1,2,2,1,10,5];
    this.interval   = interval || 10;

    this.last_time  = new Date();
    this.last_bytes = 0.0;

    this.session    = false;

    this.setup();
};

util.inherits(Client, events.EventEmitter);


Client.prototype.setup = function() {
    this.session = new snmp.Session({ host: this.host });
    this.create_poll();
};

Client.prototype.create_poll = function() {
  
    var that = this;
    setTimeout( function() {

        // If snmp request hasnt finished after 20 sek, create a new one
        var interval_timeout = setTimeout( function() {
            that.create_poll();
        }, this.interval*2.0 );

        that.poll_snmp(function() {
            clearTimeout(interval_timeout);
        });

    }, this.interval );
};

Client.prototype.poll_snmp = function(cb) {

    var client = this;

    this.session.get({ oid: this.oid }, function( error, val ) {

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

        if(cb) {
            process.nextTick(cb);    
        }

    });
};

module.exports = {
    Client: Client    
};
