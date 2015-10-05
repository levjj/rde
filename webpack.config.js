var path = require('path');
var webpack = require('webpack');
var build = !!!process.env.NODE_ENV;
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'eval',
  entry: build ? ['./src/index'] : [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'static'),
    filename: 'bundle.js',
    publicPath: build ? '' : '/static/'
  },
  plugins: build ? [new ExtractTextPlugin('style.css', {allChunks: true})] : [
    new ExtractTextPlugin('style.css', {allChunks: true}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    modulesDirectories: [
      'node_modules'
    ],
    extensions: ['', '.json', '.js']
  },
  module: {
    preLoaders: [{
      test: /\.json$/,
      loader: 'json'
    }],
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loaders: ['react-hot', 'babel']},
      {test: /\.jsx$/, loader: 'babel'},
      {test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css')},
      {test: /\.woff$/, loader: 'url?limit=10000&mimetype=application/font-woff' },
      {test: /\.woff2$/, loader: 'url?limit=10000&mimetype=application/font-woff2' },
      {test: /\.ttf$/, loader: 'url?limit=10000&mimetype=application/octet-stream' },
      {test: /\.eot$/, loader: 'file' },
      {test: /\.svg$/, loader: 'url?limit=10000&mimetype=image/svg+xml' }
    ]
  }
};
