const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const { csrfSync } = require('csrf-sync');
const env = require('./config/env');
const { sessionMiddleware } = require('./config/session');
const { flash } = require('./middlewares/flash');
const { loadUser } = require('./middlewares/auth');
const { notFound, errorHandler } = require('./middlewares/errors');
const { tradeLabel, TRADES } = require('./config/trades');
const { cityName, CITIES } = require('./config/cities');
const { formatSenegalPhone, whatsappLink } = require('./utils/phone');

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => (req.body && req.body._csrf) || req.headers['x-csrf-token'],
});

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          mediaSrc: ["'self'", 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: env.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  if (!env.isProd) app.use(morgan('dev'));

  app.use(
    express.static(path.join(__dirname, '..', 'public'), {
      maxAge: env.isProd ? '7d' : 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );

  app.use(express.urlencoded({ extended: false, limit: '50kb' }));
  app.use(express.json({ limit: '50kb' }));
  app.use(sessionMiddleware());
  app.use(flash);

  // Globals for every view.
  app.use((req, res, next) => {
    // Lazy: only creates a session when a form is actually rendered (keeps crawlers sessionless).
    res.locals.csrfToken = () => generateToken(req);
    res.locals.path = req.path;
    res.locals.baseUrl = env.baseUrl;
    res.locals.title = null;
    res.locals.description = null;
    res.locals.noAds = false;
    res.locals.currentUser = null;
    res.locals.helpers = { tradeLabel, cityName, formatSenegalPhone, whatsappLink };
    res.locals.TRADES = TRADES;
    res.locals.CITIES = CITIES;
    next();
  });
  app.use(loadUser);
  // After locals/user so that the CSRF error page can still render the layout.
  app.use(csrfSynchronisedProtection);

  app.use(require('./routes/auth'));
  app.use(require('./routes/profile'));
  app.use(require('./routes/pages'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
