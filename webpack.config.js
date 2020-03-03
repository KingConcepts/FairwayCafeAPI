const path = require('path');
const nodeExternals = require('webpack-node-externals');
// const webpack = require('webpack');
// const ejsBuilder = require('ejs-webpack-builder');
const {
    NODE_ENV = 'production',
} = process.env;

module.exports = {
    entry: './src/server.ts',
    mode: NODE_ENV,
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'index.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    'ts-loader',
                ]
            }
        ]
    }
}