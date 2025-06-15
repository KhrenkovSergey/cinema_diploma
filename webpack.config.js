const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            main: './src/scripts/main.js',
            booking: './src/scripts/booking.js',
            admin: './src/scripts/admin.js',
            login: './src/scripts/login.js',
            ticket: './src/scripts/ticket.js'
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            publicPath: isProduction ? '/cinema_diploma/' : '/'
        },
        mode: isProduction ? 'production' : 'development',
        devServer: {
            static: path.resolve(__dirname, 'dist'),
            hot: true,
            port: 3000,
            open: true,
            historyApiFallback: true,
            allowedHosts: 'all',
            proxy: [
                {
                    context: ['/api'],
                    target: 'https://shfe-diplom.neto-server.ru',
                    changeOrigin: true,
                    pathRewrite: { '^/api': '' },
                },
                {
                    context: ['/storage'],
                    target: 'https://shfe-diplom.neto-server.ru',
                    changeOrigin: true,
                }
            ]
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                },
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(png|jpg|jpeg|svg|gif)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
            }),
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: 'styles/[name].css',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'src/assets',
                        to: 'assets'
                    }
                ]
            }),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                filename: 'index.html',
                chunks: ['main']
            }),
            new HtmlWebpackPlugin({
                template: './src/booking.html',
                filename: 'booking.html',
                chunks: ['booking']
            }),
            new HtmlWebpackPlugin({
                template: './src/admin.html',
                filename: 'admin.html',
                chunks: ['admin']
            }),
            new HtmlWebpackPlugin({
                template: './src/login.html',
                filename: 'login.html',
                chunks: ['login']
            }),
            new HtmlWebpackPlugin({
                template: './src/ticket.html',
                filename: 'ticket.html',
                chunks: ['ticket']
            }),
        ],
    };
};
