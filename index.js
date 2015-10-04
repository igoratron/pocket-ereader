const PocketStrategy = require('passport-pocket');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const nunjucks = require('nunjucks');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const static = require('serve-static');

const POCKET_CONSUMER_KEY = process.env.POCKET_KEY;
const READABILITY_TOKEN = process.env.READABILITY_KEY;
const HOST = process.env.HOST || 'http://192.168.1.115';
const PORT = process.env.PORT || 3000
const SECRET = 'X6GiQnSU03';

const articleStore = require('./lib/articleStore');
const pocket = require('./lib/pocket')(POCKET_CONSUMER_KEY);
const content = require('./lib/content')(READABILITY_TOKEN);

const pocketStrategy = new PocketStrategy({
    consumerKey    : POCKET_CONSUMER_KEY,
    callbackURL    : `${HOST}:${PORT}/login/callback`
  },
  function(username, accessToken, done) {
    process.nextTick(() => done(null, { username, accessToken }));
  }
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(pocketStrategy);

const server = express();

server.use(bodyParser.urlencoded({ extended: false }))
server.use(cookieParser());
server.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));
server.use(static('./public'));
server.use(morgan('combined'));
server.use(passport.initialize());
server.use(passport.session());

nunjucks.configure('./views', {
  express: server,
  watch: true
});

server.route('/')
  .get(
    (req, res) => {
      if(req.user) {
        pocket.get(req.user.accessToken, {
          count: 20,
          sort: 'newest',
          since: 1441317546
        })
        .then((data) => {
          Object.keys(data.list)
            .forEach(id => articleStore.add(id, data.list[id]));
          res.render('articlelist.html', {
            articles: data.list
          });
        })
        .catch((error) => res.send(error));
      } else {
        res.render('loggedout.html')
      }
    }
  );

server.route('/login')
  .post(
    passport.authenticate('pocket'),
    (req, res) => res.redirect('/')
  );

server.route('/article/:id')
  .get(
    (req, res) => {
      content.get(articleStore.get(req.params.id).resolved_url)
        .then(article => {
          res.setHeader('Cache-Control', 'public, max-age=31557600');
          res.render('articleview.html', { article });
        })
        .catch(error => res.send(error));
    }
  );

server.route('/login/callback')
  .get(
    passport.authenticate('pocket', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
  );

server.route('/logout')
  .get(
    (req, res) => {
      req.session.destroy();
      res.redirect('/');
    }
  );

server.route('/pocket.appcache')
  .get(
    (req, res) => { 
      res.type('text/cache-manifest');
      res.render('pocket.appcache', {
        cacheVersion: parseInt(Date.now() / 60000),
        articleUrls: articleStore.getAll()
          .map(article => `/article/${article.item_id}`)
      });
    }
  );

server.listen(PORT);
console.log(`server running at : ${HOST}:${PORT}`)
