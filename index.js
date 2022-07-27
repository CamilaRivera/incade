require('dotenv').config({
  path:
    process.env.NODE_ENV === 'production'
      ? 'config/production.env'
      : 'config/development.env',
});

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.DEV', process.env.DEV);

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
  res.render('main', {dev: process.env.DEV});
});


const validateFormData = (formData) => {
  const errors = {};
  if (!formData.email || !formData.email.trim()) {
    errors.email = true;
  }
  if (!formData.name || !formData.name.trim()) {
    errors.name = true;
  }
  if (!formData.message || !formData.message.trim()) {
    errors.message = true;
  }
  return errors;
};

app.post('/contacto', (req, res) => {
  const {email, name, message} = req.body;
  const errors = validateFormData({email, name, message});

  res.redirect('/?contacto=enviado');
});

app.listen(4000, () => console.log('Gator app listening on port 4000!'));