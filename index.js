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

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.set('view engine', 'ejs');


console.log('__dirname', __dirname);
app.use(
  sassMiddleware({
    src: __dirname + '/src/scss',
    dest: path.join(__dirname, 'public', 'assets', 'css'),
    debug: true,
    prefix: '/assets/css'
  })
);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('main', {
    contactEmail: process.env.EMAIL_RECEIVER,
    dev: process.env.DEV,
    recaptchaSiteKey: process.env.RECAPTCH_V3_KEY,
    contactForm: {},
  });
});

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  port: 465,               // true for 465, false for other ports
  host: "smtp.gmail.com",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
  secure: true,
});


const validateFormData = (formData) => {
  const errors = {};
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email';
  }
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Nombre';
  }
  if (!formData.message || !formData.message.trim()) {
    errors.message = 'Mensaje';
  }
  console.log('validateFormData formData', formData);
  console.log('validateFormData errors', errors);
  return errors;
};

const validateRecaptcha = async (token) => {
  console.log('validateRecaptcha token', token);
  const url = `https://www.google.com/recaptcha/api/siteverify?response=${token}&secret=${process.env.RECAPTCH_V3_SECRET}`;
  let { data } = await axios.post(url);
  console.log('validateRecaptcha data', data);
  if (!data.success) {
    console.log('Recaptcha v3 rejected! token length: ', token.length);
    return false;
  }
  console.log('Recaptcha v3 approved! token length: ', token.length);
  return true;
}


app.get('/contacto', async (req, res) => {
  res.redirect('/#contact');
});

app.post('/contacto', async (req, res) => {
  const { email, name, message, token } = req.body;
  if (!await validateRecaptcha(token || '')) {
    res.render('main', {
      contactEmail: process.env.EMAIL_RECEIVER,
      contactForm: {
        errors: {
          recaptcha: true,
        },
        data: {
          email, name, message
        }
      },
      dev: process.env.DEV,
      recaptchaSiteKey: process.env.RECAPTCH_V3_KEY
    });
    return;
  }
  const errors = validateFormData({ email, name, message });
  if (Object.keys(errors).length > 0) {
    res.render('main', {
      contactEmail: process.env.EMAIL_RECEIVER,
      contactForm: {
        errors: {
          message: `Los campos ${Object.values(errors).join(', ')} son obligatorios`
        },
        data: {
          email, name, message,
        },
      },
      dev: process.env.DEV,
      recaptchaSiteKey: process.env.RECAPTCH_V3_KEY
    });
    return;
  }

  // Send email
  const mailData = {
    from: process.env.SMTP_EMAIL,  // sender address
    to: process.env.EMAIL_RECEIVER,   // list of receivers
    subject: 'Formulario contacto despidojusto.cl',
    text: `
        Has recibido un contacto:
        Email: ${email}
        Nombre: ${name}
        Mensaje: ${message}
      `,
    html: `
      <b>Hola!</b><br>
      Has recibido un contacto:<br/><br/>
      <b>Email</b>: ${email}<br/>
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
            email, name, message,
          },
          errors: { emailFailure: true },
        },
        dev: process.env.DEV,
        recaptchaSiteKey: process.env.RECAPTCH_V3_KEY
      });
    }
    else {
      console.info('Email de contacto enviado con exito', email);
      res.render('main', {
        contactEmail: process.env.EMAIL_RECEIVER,
        contactForm: {
          success: true,
          data: {
            email, name, message,
          },
        },
        dev: process.env.DEV,
        recaptchaSiteKey: process.env.RECAPTCH_V3_KEY
      });
    }
  });
});

app.listen(4000, () => console.log('Gator app listening on port 4000!'));