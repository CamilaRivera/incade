require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? 'config/production.env'
      : 'config/development.env',
});

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.DEV', process.env.DEV);

const nodemailer = require('nodemailer');
const axios = require('axios');
const express = require('express');
const sassMiddleware = require('node-sass-middleware');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.set('view engine', 'ejs');

console.log('__dirname', __dirname);
app.use(
  sassMiddleware({
    src: __dirname + '/src/scss',
    dest: path.join(__dirname, 'public', 'assets', 'css'),
    debug: true,
    prefix: '/assets/css',
  })
);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('main', {
    contactEmail: process.env.EMAIL_RECEIVER,
    dev: process.env.DEV,
    contactForm: {},
  });
});

app.get('/preguntas-frecuentes', (req, res) => {
  res.render('faq', {
    contactEmail: process.env.EMAIL_RECEIVER,
    dev: process.env.DEV,
    contactForm: {},
  });
});

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  port: 465, // true for 465, false for other ports
  host: 'smtp.gmail.com',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
  secure: true,
});

const validateFormData = (formData) => {
  if (
    (!formData.email || !formData.email.trim()) &&
    (!formData.phone || !formData.phone.trim())
  ) {
    return 'Debe ingresar un email o telefono';
  }
  return undefined;
};

app.get('/contacto', async (req, res) => {
  res.redirect('/#contacto');
});

app.post('/contacto', async (req, res) => {
  const { email, name, message, phone } = req.body;
  const error = validateFormData({ email, name, message, phone });
  if (error) {
    res.render('main', {
      contactEmail: process.env.EMAIL_RECEIVER,
      contactForm: {
        errors: {
          message: error,
        },
        data: {
          email,
          name,
          message,
          phone,
        },
      },
      dev: process.env.DEV,
    });
    return;
  }

  // Send email
  const mailData = {
    from: process.env.SMTP_EMAIL, // sender address
    to: process.env.EMAIL_RECEIVER, // list of receivers
    subject: 'Formulario contacto despidojusto.cl',
    text: `
        Has recibido un contacto:
        Nombre: ${name}
        Email: ${email}
        Telefono: ${phone}
        Mensaje: ${message}
      `,
    html: `
      <b>Hola!</b><br>
      Has recibido un contacto:<br/><br/>
      <b>Email</b>: ${email}<br/>
      <b>Telefono</b>: ${phone}<br/>
      <b>Nombre</b>: ${name}<br/>
      <b>Mensaje</b>: ${message}<br/>
      `,
  };
  transporter.sendMail(mailData, function (err, info) {
    if (err) {
      console.error(err);
      res.render('main', {
        contactEmail: process.env.EMAIL_RECEIVER,
        contactForm: {
          success: false,
          data: {
            email,
            name,
            message,
            phone,
          },
          errors: { emailFailure: true },
        },
        dev: process.env.DEV,
      });
    } else {
      console.info('Email de contacto enviado con exito', email);
      res.render('main', {
        contactEmail: process.env.EMAIL_RECEIVER,
        contactForm: {
          success: true,
          data: {
            email,
            name,
            message,
            phone,
          },
        },
        dev: process.env.DEV,
      });
    }
  });
});

app.listen(process.env.PORT || 4000, () => console.log('Gator app listening on port 4000!'));
