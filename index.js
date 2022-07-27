require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? 'config/production.env'
      : 'config/development.env',
});

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.DEV', process.env.DEV);

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
    dev: process.env.DEV,
    recaptchaSiteKey: process.env.RECAPTCH_V3_KEY,
    contactForm: {},
  });
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
  const {email, name, message, token} = req.body;
  if (!await validateRecaptcha(token || '')) {
    res.render('main', {
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
  }
  const errors = validateFormData({email, name, message});
  if (Object.keys(errors).length > 0) {
    res.render('main', {
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
  res.render('main', {
    contactForm: {
      success: true,
      data: {
        email, name, message,
      },
    },
    dev: process.env.DEV,
    recaptchaSiteKey: process.env.RECAPTCH_V3_KEY
  });
});

app.listen(4000, () => console.log('Gator app listening on port 4000!'));