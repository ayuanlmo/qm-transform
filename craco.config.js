const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    plugins: [
        {
            plugin: {
                overrideWebpackConfig: ({webpackConfig}) => {
                    const htmlPlugin = webpackConfig.plugins.find(
                        (plugin) => plugin instanceof HtmlWebpackPlugin
                    );

                    if (htmlPlugin) {
                        htmlPlugin.options.templateParameters = {
                            ...htmlPlugin.options.templateParameters,
                            __LMO_BUILD_CONFIG: {
                                __LMO_APP_BUILD_TIME: Date.now(),
                                __LMO_APP_NAME: 'lmo-Transform'
                            }
                        };
                    }

                    return webpackConfig;
                }
            }
        }
    ],
    style: {
        postcss: {
            plugins: [
                require('tailwindcss'),
                require('autoprefixer')
            ]
        }
    },
    devServer: {
        port: process.env.PORT || 8088
    },
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src/')
        },
        configure: (webpackConfig) => {
            webpackConfig.devtool = isProduction ? false : 'source-map';
            webpackConfig.output.path = 'build';
            webpackConfig.optimization = {
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 0,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    automaticNameDelimiter: '~',
                    name: '*',
                    cacheGroups: {
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true
                        }
                    }
                }
            };
            const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);

            if (oneOfRule) {
                oneOfRule.oneOf.unshift({
                    test: /\.(scss|sass)$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass')
                            }
                        }
                    ]
                });
            }
            webpackConfig.output.path = path.join(path.resolve(), 'build');
            webpackConfig.plugins.forEach((plugin) => {
                if (plugin.constructor.name === 'MiniCssExtractPlugin')
                    plugin.options.filename = 'css/_lmo_style_[contenthash].qm.css';
            });
            webpackConfig.output.filename = 'script/_lmo_script_[contenthash].qm.js';
            webpackConfig.output.chunkFilename = 'script/_lmo_script_[contenthash].chunk.qm.js';
            webpackConfig.module.rules.push({
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'static/_lmo_static_[contenthash].qm.[ext]'
                        }
                    }
                ]
            });

            return webpackConfig;
        }
    },
    jest: {
        configure: {
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1'
            }
        }
    }
};
