module.exports = {
    'map_range': function( val, min1, max1, min2, max2 ) {
        return min2 + (max2 - min2) * ((val - min1) / (max1 - min1));
    },
    'clamp': function clamp( val, max, min ) {
        if( val > max ) {
            return max;
        }    

        if( val < min ) {
            return min;    
        }

        return val;
    }
};
