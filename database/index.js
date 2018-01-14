/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';
  
  class Database {
    
    constructor (sequelize, Sequelize) {
      this.sequelize = sequelize;
      this.Sequelize = Sequelize;
      this.defineModels();
    }
    
    get seq() {
      return this.sequelize;
    }
    
    defineModels() {
      this.defineModel('ConnectSession', {
        sid: {
          type: Sequelize.STRING(191),
          primaryKey: true
        },
        userId: Sequelize.STRING(191),
        expires: Sequelize.DATE,
        data: Sequelize.TEXT
      });

      this.defineModel('event', {
        serial: { 
          type: Sequelize.STRING(191),
          allowNull: false
        },
        start: {
          type: this.Sequelize.DATE,
          allowNull: false
        },
        end: {
          type: this.Sequelize.DATE,
          allowNull: false
        },
        minValue: Sequelize.INTEGER,
        maxValue: Sequelize.INTEGER
      });
    }
    
    defineModel(name, attributes, options) {
      this[name] = this.sequelize.define(name, attributes, Object.assign(options || {}, {
        charset: 'utf8'
      }));
      
      this[name].sync();
    }
    
    // Event methods
    
    createEvent(start, end, serial) {
      return this.event.create({
        start: start,
        end: end,
        serial: serial
      });
    }
    
    updateEvent(id, start, end) {
      return this.event.findById(id).then((event) => {
        event.start = start;
        event.end = end;
        return event.save();
      });
    }
    
    listEventsByStartAndEnd(start, end, serials) {
      return this.event.findAll({
        where: {
          start: {
            [this.Sequelize.Op.gte]: start
          },
          end: {
            [this.Sequelize.Op.lte]: end
          },
          serial: {
            [this.Sequelize.Op.in]: serials
          }
        }
      });
    }
    
    findOngoingEvent(now, serial) {
      return this.event.findOne({
        where: {
          start: {
            [this.Sequelize.Op.lte]: now.format()
          },
          end: {
            [this.Sequelize.Op.gt]: now.format()
          },
          serial: serial
        }
      });
    }
  }

  const config = require('nconf');
  const Sequelize = require('sequelize');
  const sequelize = new Sequelize(config.get('mysql:database'), config.get('mysql:username'), config.get('mysql:password'), {
    host: config.get('mysql:host'),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  module.exports = new Database(sequelize, Sequelize);

})();