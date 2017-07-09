'use strict';

module.exports = function(Ailment) {
    Ailment.validatesUniquenessOf('name', {message: 'Ailment name is not unique.'})
};
