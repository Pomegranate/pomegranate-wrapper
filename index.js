/**
 * @file index
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Pomegranate-wrapper
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

'use strict';
var fileList = require('magnum-plugin-utils').fileList;
var fileName = require('magnum-plugin-utils').fileBaseName;
var _ = require('magnum-plugin-utils').lodash;
var Promise = require('magnum-plugin-utils').bluebird;
var path = require('path');
/**
 *
 * @module index
 */

exports.options = {
  workDir: 'wrapped'
}

exports.metadata = {
  name: 'Wrapper',
  layer: 'core',
  type: 'dynamic'
}

exports.plugin = {
  load: function(inject, loaded) {
    var loadError = false
    var Env = inject(function(Env) {
      return Env;
    })

    return fileList(this.options.workDir).then(function(files) {
      var loadedModules = _.chain(files)
        .map(function(file){
          this.Logger.log('Wrapping dependency -- ' + fileName(file, true) + '.' )
          var mod = require(path.join(this.options.workDir, file))
          mod = _.isFunction(mod) ? mod : false;
          if(!mod){
            var message = file + ' loading failed. Files loaded by pomegranate-wrapper must return a function.'
            this.Logger.error(message);
            loadError = new Error(message);
            return false
          }
          return mod
        }.bind(this))
        .filter(Boolean)
        .map(function(mod){
          return mod(Env, this.Logger)
        }.bind(this))
        .value()

      if(loadError){
        return loaded(loadError)
      }

      return Promise.all(loadedModules).then(function(toValidate){
        var validated = _.filter(toValidate, function(mod) {
          var hasLoadProp = _.has(mod, ['load']);
          if(!hasLoadProp){
            var message = 'loading failed. Functions called by pomegranate-wrapper must return an object with a load property'
            this.Logger.error(message);
            loadError = new Error(message);
            return false
          }
          return true
        }.bind(this));
        loaded(null, validated)
      })
    }.bind(this));

  },
  start: function(done) {
    done()
  },
  stop: function(done) {
    done()
  }
}