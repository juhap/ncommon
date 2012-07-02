var fs = require("fs");

var getBytesWithUnit = function (bytes, useSI, precision, useSISuffix) {
  "use strict";
  if (!(!isNaN(bytes) && +bytes > -1 && isFinite(bytes))) {
    return false;
  }
  var units, obj, amountOfUnits, unitSelected, suffix;
  units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  obj = {
    base : useSI ? 10 : 2,
    unitDegreeDiff : useSI ? 3 : 10
  };
  amountOfUnits = Math.max(0, Math.floor(Math.round(Math.log(+bytes) / Math.log(obj.base) * 1e6) / 1e6));
  unitSelected = Math.floor(amountOfUnits / obj.unitDegreeDiff);
  unitSelected = units.length > unitSelected ? unitSelected : units.length - 1;
  suffix = (useSI || useSISuffix) ? units[unitSelected] : units[unitSelected].replace('B', 'iB');
  bytes = +bytes / Math.pow(obj.base, obj.unitDegreeDiff * unitSelected);
  precision = precision || 3;
  if (bytes.toString().length > bytes.toFixed(precision).toString().length) {
    bytes = bytes.toFixed(precision);
  }
  return bytes + " " + suffix;
};

// Read JSON based configuration file and return as object
module.exports.readConfig = function(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Convert byte count to human readable (=>KB, MB, GB etc.)
module.exports.bytesToHuman = function(bytes) {
  return getBytesWithUnit(bytes, true, 1, true);
}