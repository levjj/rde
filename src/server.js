/* eslint no-var:0 */
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('../webpack.config');

var app = new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  stats: {
    colors: true
  }
});

app.listen(3000, 'localhost', function onstart(err) {
  /* eslint no-console:0 */
  if (err) {
    console.log(err);
  }
  console.log('Listening at localhost:3000');
});
