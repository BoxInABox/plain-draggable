/* eslint-env node, es6 */

'use strict';

const
  BASE_NAME = 'plain-draggable',
  OBJECT_NAME = 'PlainDraggable',
  LIMIT_TAGS = ['SNAP', 'SVG', 'LEFTTOP'],
  BUILD = process.env.NODE_ENV === 'production',
  LIMIT = process.env.EDITION === 'limit',
  BUILD_BASE_NAME = `${BASE_NAME}${LIMIT ? '-limit' : ''}`,
  PREPROC_REMOVE_TAGS = (BUILD ? ['DEBUG'] : []).concat(LIMIT ? LIMIT_TAGS : []),

  webpack = require('webpack'),
  preProc = require('pre-proc'),
  path = require('path'),
  fs = require('fs'),
  PKG = require('./package'),

  SRC_DIR_PATH = path.resolve(__dirname, 'src'),
  BUILD_DIR_PATH = BUILD ? __dirname : path.resolve(__dirname, 'test'),
  ESM_DIR_PATH = __dirname,
  ENTRY_PATH = path.join(SRC_DIR_PATH, `${BASE_NAME}.js`);

function writeFile(filePath, content, messageClass) {
  const HL = '='.repeat(48);
  fs.writeFileSync(filePath,
    `/* ${HL}\n        DON'T MANUALLY EDIT THIS FILE\n${HL} */\n\n${content}`);
  console.log(`Output (${messageClass}): ${filePath}`);
}

module.exports = {
  entry: ENTRY_PATH,
  output: {
    path: BUILD_DIR_PATH,
    filename: `${BUILD_BASE_NAME}${BUILD ? '.min' : ''}.js`,
    library: OBJECT_NAME,
    libraryTarget: 'var',
    libraryExport: 'default'
  },
  resolve: {mainFields: ['module', 'jsnext:main', 'browser', 'main']},
  module: {
    rules: [
      {
        resource: {and: [SRC_DIR_PATH, /\.js$/]},
        use: [
          // ================================ Save ESM file
          {
            loader: 'skeleton-loader',
            options: {
              procedure(content) {
                if (this.resourcePath === ENTRY_PATH) {
                  writeFile(
                    path.join(ESM_DIR_PATH, `${BUILD_BASE_NAME}${BUILD ? '' : '-debug'}.esm.js`),
                    content, 'ESM');
                }
                return content;
              }
            }
          },
          // ================================ Babel
          {
            loader: 'babel-loader',
            options: {presets: [['es2015', {modules: false}]]}
          },
          // ================================ Preprocess
          PREPROC_REMOVE_TAGS.length ? {
            loader: 'skeleton-loader',
            options: {
              procedure(content) {
                content = preProc.removeTag(PREPROC_REMOVE_TAGS, content);
                if (BUILD && this.resourcePath === ENTRY_PATH) {
                  writeFile(path.join(SRC_DIR_PATH, `${BUILD_BASE_NAME}.proc.js`), content, 'PROC');
                }
                return content;
              }
            }
          } : null
        ].filter(loader => !!loader)
      }
    ]
  },
  devtool: BUILD ? false : 'source-map',
  plugins: BUILD ? [
    new webpack.optimize.UglifyJsPlugin({compress: {warnings: true}}),
    new webpack.BannerPlugin(
      `${PKG.title || PKG.name} v${PKG.version} (c) ${PKG.author.name} ${PKG.homepage}`)
  ] : []
};
