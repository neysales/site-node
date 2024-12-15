const express = require('express');
const session = require('express-session');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const i18nextBackend = require('i18next-fs-backend');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = process.env.PORT || 3000;

// Carrega configurações do arquivo YAML
const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'));
const apiKey = config.apiKey;

// Configuração do i18next
i18next
  .use(i18nextBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json'
    },
    fallbackLng: 'pt',
    preload: ['pt', 'en'],
    ns: ['translation'],
    defaultNS: 'translation'
  });

app.use(i18nextMiddleware.handle(i18next));

// Configuração do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Configuração do layout EJS
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Rotas
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { layout: false });
});

app.post('/login', (req, res) => {
  const phone = req.body.phone;
  // Aqui você implementaria a lógica de verificação do telefone
  req.session.phone = phone;
  res.redirect('/verify');
});

app.get('/verify', (req, res) => {
  if (!req.session.phone) {
    return res.redirect('/login');
  }
  res.render('verify', { layout: false });
});

app.post('/verify', (req, res) => {
  const code = req.body.code;
  // Aqui você implementaria a verificação do código
  if (code.length === 6) {
    req.session.authenticated = true;
    res.redirect('/dashboard');
  } else {
    res.redirect('/verify');
  }
});

app.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    currentPage: 'dashboard',
    t: req.t
  });
});

// Rota de logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    res.redirect('/login');
  });
});

app.get('/agenda', authMiddleware, (req, res) => {
  res.render('agenda', {
    title: 'Agenda',
    currentPage: 'agenda',
    t: req.t
  });
});

app.get('/company', authMiddleware, (req, res) => {
  res.render('company', {
    title: 'Companhia',
    currentPage: 'company',
    t: req.t
  });
});

app.get('/settings', authMiddleware, (req, res) => {
  res.render('settings', {
    title: 'Configurações',
    currentPage: 'settings',
    t: req.t
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
