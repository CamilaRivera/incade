const express = require('express');
const sassMiddleware = require('node-sass-middleware');
const path = require('path');
const app = express();

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
    res.send('An alligator approaches!');
});

app.listen(3000, () => console.log('Gator app listening on port 3000!'));