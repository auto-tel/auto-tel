
const webpack = require('webpack')
const {identity} = require('lodash')
const autoprefixer = require('autoprefixer')
const sysConfigDefault = require('./src/server/config')
const packThreadCount = sysConfigDefault.devCPUCount // number
const BabiliPlugin = require('babili-webpack-plugin')
const OpenBrowserPlugin = require('open-browser-webpack-plugin')
const HappyPack = require('happypack')
const happyThreadPool = packThreadCount === 0 ? null : HappyPack.ThreadPool({ size: packThreadCount })
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const pack = require('./package.json')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const env = process.env.NODE_ENV
const git = require('git-rev-sync')

const happyConf = {
  loaders: ['babel-loader'],
  threadPool: happyThreadPool,
  verbose: true
}
let version = pack.version + '-' + git.long()
const url = `http://localhost:${sysConfigDefault.devPort}`
const extractTextPlugin1 = new MiniCssExtractPlugin({
  filename: 'css/[name].styles.css'
})

// const confs = {
//   ...sysConfigDefault.site,
//   cdn: url,
//   host: url
// }
// const pug = {
//   loader: 'pug-html-loader',
//   options: {
//     data: {
//       ...confs,
//       _global: confs
//     }
//   }
// }

const stylusSettingPlugin =  new webpack.LoaderOptionsPlugin({
  test: /\.styl$/,
  stylus: {
    preferPathResolver: 'webpack'
  }
})

var config = {
  mode: 'development',
  entry: {
    'auto-tel': './src/client/entry/index.jsx',
    basic: './src/client/entry/basic.jsx',
    //index: './src/views/index.pug',
    'proxy-js': './src/client/entry/proxy.jsx',
    'redirect-js': './src/client/entry/redirect.jsx'
    //proxy: './src/views/proxy.pug',
    //redirect: './src/views/redirect.pug'
  },
  output: {
    path: __dirname + '/app/assets',
    filename: 'js/[name].bundle.js',
    publicPath: '/',
    chunkFilename: 'js/[name].' + version + '.js',
    libraryTarget: 'var'
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
    //'sip.js': 'SIP'
  },
  watch: true,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.json'],
    alias: {
      'client': path.resolve(__dirname, 'src/client')
    }
  },
  resolveLoader: {
    modules: [
      path.resolve(__dirname, 'src/client/loaders'),
      path.join(process.cwd(), 'node_modules')
    ]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [packThreadCount === 0 ? 'babel-loader?cacheDirectory' : 'happypack/loader?cacheDirectory']
      },
      {
        test: /\.styl$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it use publicPath in webpackOptions.output
              publicPath: '../'
            }
          },
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it use publicPath in webpackOptions.output
              publicPath: '../'
            }
          },
          {
            loader: 'antd-icon-loader',
            options: {

              //relative path to your css path
              path: '../../_bc/auto-tel-resources/res/fonts',

              //version, will add to icon source url to help clear cache
              version: pack.devDependencies.antd
            }
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it use publicPath in webpackOptions.output
              publicPath: '../'
            }
          },
          //'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.svg/,
        exclude: /font|src(\/|\\)assets(\/|\\)images/,
        use: [
          'babel-loader',
          'react-svg-loader'
        ]
      },
      {
        test: /\.woff|\.woff2|.eot|\.ttf/,
        use: 'url-loader?limit=15000&publicPath=../&name=fonts/[name]_[hash].[ext]'
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        exclude: /ringcentral-widgets(\/|\\)assets(\/|\\)images(\/|\\).+\.svg/,
        use: ['url-loader?limit=10192&name=images/[hash].[ext]']
      },
      // {
      //   test: /\.pug$/,
      //   use: [
      //     'file-loader?name=index.html',
      //     'concat-loader',
      //     'extract-loader',
      //     'html-loader',
      //     pug
      //   ]
      // },
      {
        test: /\.md$/,
        use: 'raw-loader'
      },
      {
        test: /\.sass|\.scss/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it use publicPath in webpackOptions.output
              publicPath: '../'
            }
          },
          //'style-loader',
          {
            loader: 'css-loader',
            options: {
              localIdentName: '[folder]_[local]',
              modules: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [
                  autoprefixer
                ]
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              outputStyle: 'expanded',
              includePaths: ['src/client/css', 'node_modules']
            }
          }
        ]
      },
      {
        test: /\.ogg$/,
        use: 'file-loader?publicPath=./&name=audio/[name]_[hash].[ext]'
      }
    ]
  },
  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new OpenBrowserPlugin({
      url
    }),
    new LodashModuleReplacementPlugin(),
    stylusSettingPlugin,
    packThreadCount === 0 ? null : new HappyPack(happyConf),
    extractTextPlugin1
  ].filter(identity),
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    contentBase: path.join(__dirname, 'app/assets/'),
    historyApiFallback: true,
    hot: true,
    inline: true,
    host: '0.0.0.0',
    port: sysConfigDefault.devPort,
    proxy: {
      '*': {
        target: 'http://localhost:' + sysConfigDefault.port,
        secure: false,
        ws: false,
        bypass: function (req) {
          let pth = req.path
          if (
            (
              /(\.json|\.jpg|\.png|\.css|font\/)$/.test(pth) &&
              !/^\/static\//.test(pth) &&
              !/^\/_bc\//.test(pth)
            ) ||
            /\.bundle\.js/.test(pth)
          ) {
            console.log('bypass', pth)
            return req.path
          }
        }
      }
    }
  }
}

if (env === 'production') {
  config.plugins = [
    packThreadCount === 0 ? null : new HappyPack(happyConf),
    //new webpack.optimize.DedupePlugin(),
    // commonsChunkPlugin,
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'manifest',
    //   minChunks: Infinity
    // }),
    extractTextPlugin1,
    stylusSettingPlugin,
    new LodashModuleReplacementPlugin(),
    //new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.optimize.MinChunkSizePlugin({
    //   minChunkSize: 51200 // ~50kb
    // }),
    new BabiliPlugin()
  ]
  config.mode = 'production'
  delete config.watch
  delete config.devtool
  delete config.devServer
}

module.exports = config

