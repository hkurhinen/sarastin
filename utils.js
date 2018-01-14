/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  class SarastinUtils {
    
    static convertToRange(x, in_min, in_max, out_min, out_max) {
      return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
    static listResourcesWithScope(entitlements, scope) {
      const result = [];
      const permissions = entitlements.permissions;
      permissions.forEach((permission) => {
        if (permission.scopes && permission.scopes.indexOf(scope) > -1) {
          result.push(permission.resource);
        }
      });

      return result;
    }
    
  }
  
  module.exports = SarastinUtils;

})();