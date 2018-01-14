/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  const moment = require('moment-timezone');
  const SarastinUtils = require(`${__dirname}/../utils`);
  
  const ZERO_VALUE = 1024;
  const MAX_BRIGHTNESS = 700;
  
  class Routes {

    constructor(app, database, accessControl) {
      this.app = app;
      this.db = database;
      this.accessControl = accessControl;
      this.registerRoutes();
    }
    
    registerRoutes() {
      this.app.get('/', this.accessControl.requireLoggedIn(), this.getIndex.bind(this));
      this.app.get('/events', this.accessControl.requireLoggedIn(), this.getEvents.bind(this));
      this.app.get('/value/:serial', this.getValue.bind(this));
      this.app.post('/event', this.accessControl.protectResourceMiddleware({type: 'ser', scopes: ['manage'], id: { from: 'body', name: 'serial'}}), this.postEvent.bind(this));
      this.app.put('/event/:id', this.accessControl.protectResourceMiddleware({type: 'ser', scopes: ['manage'], id: { from: 'body', name: 'serial'}}), this.putEvent.bind(this));
    }
    
    handleError(error, req, res) {
      console.error(error);
      res.status(500).send(error);
    }
    
    async getIndex(req, res) {
      const entitlements = await this.accessControl.getEntitlements(this.accessControl.getAccessToken(req));
      const allowedResources = SarastinUtils.listResourcesWithScope(entitlements, 'manage');
      const serials = allowedResources.map((allowedResource) => {
        return allowedResource.split(':')[1];
      });

      res.render('index', {
        serials: serials
      });
    }
    
    async getEvents(req, res) {
      try {
        const entitlements = await this.accessControl.getEntitlements(this.accessControl.getAccessToken(req));
        const allowedResources = SarastinUtils.listResourcesWithScope(entitlements, 'manage');
        const serials = allowedResources.map((allowedResource) => {
          return allowedResource.split(':')[1];
        });
        
        const events = await this.db.listEventsByStartAndEnd(req.query.start, req.query.end, serials);
        const results = [];
        events.forEach((event) => {
          results.push({
            id: event.id,
            title: event.serial,
            start: moment(event.start).tz('Europe/Helsinki').format(),
            end: moment(event.end).tz('Europe/Helsinki').format()
          });
        });

        res.send(results);
      } catch (err) {
        this.handleError(err, req, res);
      }
    }
    
    async postEvent(req, res) {
      try {
        res.send(await this.db.createEvent(req.body.start, req.body.end, req.body.serial));
      } catch (err) {
        this.handleError(err, req, res);
      }
    }
    
    async putEvent(req, res) {
      try {
        res.send(await this.db.updateEvent(req.params.id, req.body.start, req.body.end));
      } catch (err) {
        this.handleError(err, req, res);
      }
    }
    
    async getValue(req, res) {
      try {
        const serial = req.params.serial;
        const now = moment();
        const event = await this.db.findOngoingEvent(now, serial);
        if (!event) {
          res.send(ZERO_VALUE, { 'Content-Type': 'text/plain' }, 200);
          return;
        }
        
        const start = moment(event.start);
        const end = moment(event.end); 
        const total = end.diff(start, 'seconds');
        const elapsed = now.diff(start, 'seconds');
        const value = SarastinUtils.convertToRange(elapsed, 0, total, ZERO_VALUE, MAX_BRIGHTNESS);

        res.send(value, { 'Content-Type': 'text/plain' }, 200);
      } catch (err) {
        this.handleError(err, req, res);
      }
    }
  }
  
  module.exports = (app, database, accessControl) => {
    return new Routes(app, database, accessControl);
  };
  
})();