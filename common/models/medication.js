'use strict';

module.exports = function(Medication) {
    Medication.validatesInclusionOf('size', {in: ['Small', 'Medium', 'Large']});
    Medication.validatesUniquenessOf('genericName', {message: 'Generic name is not unique.'})
};
