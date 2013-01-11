var  snmp   = require('snmp-native')
    ,util   = require('util')
    ,events = require('events');


var Client = function( host, eth_if, interval ) {

    events.EventEmitter.call(this);

    this.host       = host;
    this.interval   = interval || 10000;

    this.last_time  = new Date();
    this.last_bytes = 0.0;

    this.session    = false;
    this.setup(eth_if);
};

util.inherits(Client, events.EventEmitter);


Client.prototype.setup = function(eth_if) {

    var that = this;
    this.session = new snmp.Session({ host: this.host });

    this.get_interface_oid(eth_if, function(device_oid) {
        that.oid = [1,3,6,1,2,1,31,1,1,1,6,device_oid];
        that.create_poll();
    });
    
};

Client.prototype.get_interface_oid = function(eth_if, cb) {

    if(!cb) {
        return false;
    }

    this.session.getSubtree({ oid: [1,3,6,1,2,1,2,2,1,2] }, function(error, varbinds) {

        if(error) {
            console.log("Failed to retrieve device oid for device", eth_if);
        } else {
            var result = varbinds.some(function(vb) {
                if( vb.value == eth_if ) {
                    var if_oid = vb.oid[vb.oid.length - 1];
                    cb(if_oid);
                    return true;
                }
            });

            if(!result) {
                console.log("Couldnt find device", eth_if);
            }

        }
    });

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
