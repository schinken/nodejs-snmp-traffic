var  snmp   = require('snmp-native')
    ,util   = require('util')
    ,events = require('events');


var Client = function( host, min_kbps, max_kbps, smoothing ) {

    events.EventEmitter.call(this);

    this.min_kbps   = min_kbps || 100.0;
    this.max_kbps   = max_kbps || 5000.0;
    this.smoothing  = smoothing || 0.1;

    this.host       = host;

    this.last_time  = new Date();
    this.last_bytes = 0.0;
    this.cur_kbps   = 0.0;
    this.avg_bytes  = 0.0;

    this.session    = false;

    this.setup();
};

util.inherits(Client, events.EventEmitter);


Client.prototype.setup = function() {

    this.session = new snmp.Session({ host: this.host });

    var ctx = this;

    setInterval( function() {
        ctx.poll_snmp();
    }, 2000 );

    setInterval( function() {
        avg = ctx.calculate_speed();
        ctx.emit('update', avg );
    }, 500 );
};

Client.prototype.cap_value = function( val, min, max ) {

    if( val < min ) {
        return min;
    }

    if( val > max ) {
        return max;
    }

    return val;
};

Client.prototype.map_range = function( val, min1, max1, min2, max2 ) {
    return min2 + (max2 - min2) * ((val - min1) / (max1 - min1));
};

Client.prototype.calculate_speed = function() {
    this.avg_bytes = (1.0-this.smoothing)*this.avg_bytes + this.smoothing*this.cur_kbps;
    kbps = this.cap_value( this.avg_bytes, this.min_kbps, this.max_kbps );
    return this.map_range( kbps, this.min_kbps, this.max_kbps, 0.0, 1.0 );
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
            client.cur_kbps = diff_bytes / 1024.0 / diff_time;
            client.last_time = cur_time;
        }

    });
};

Client.prototype.on_update = function( cb ) {
    this.on('update', cb );
};

module.exports = {
    Client: Client    
};
