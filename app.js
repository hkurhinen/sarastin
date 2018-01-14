/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';
  
  const config = require('nconf');
  config.file({file: __dirname + '/config.json'});
  
  const argv = require('minimist')(process.argv.slice(2));
  const express = require('express');
  const path = require('path');
  const bodyParser = require('body-parser');
  const expressSession = require('express-session');
  const cookieParser = require('cookie-parser');
  const port = argv.port||3000;
  const database = require(`${__dirname}/database`);
  const Keycloak = require('keycloak-connect');
  const session = require('express-session');
  const SequelizeStore = require('connect-session-sequelize')(session.Store);
  const app = express();
  const http = require('http').Server(app);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
  
  const sessionStore = new SequelizeStore({
    db: database.seq,
    table: "ConnectSession"
  });

  const keycloak = new Keycloak({ store: sessionStore }, config.get('keycloak'));

  app.use(session({
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    secret: config.get('session-secret')
  }));

  app.use(keycloak.middleware({
    logout: '/logout'
  }));

  app.use((req, res, next) => {
    const isLoggedIn = !!req.kauth && req.kauth.grant;

    req.sarastin = {
      isLoggedIn: isLoggedIn
    };

    next();
  });
  
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended : true
  }));

  app.set('port', port);

  app.locals.keycloakAccountUrl = keycloak.accountUrl();

  require('./routes')(app, database, require(`${__dirname}/access-control`)(keycloak));
  
  http.listen(app.get('port'), () => { console.log('Listening'); });
  
})();