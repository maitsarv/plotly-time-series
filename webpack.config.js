const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    entry: './src/plotly_builder.js',
    output: {
        filename: 'plotly_time_series.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'plotlyTimeSeries',
        libraryExport: "default",
    },
    plugins: [
        new WebpackShellPlugin({
            onBuildExit: [
                'echo "Transfering files ... "',
                'cp dist/plotly_time_series.js demo/lit/',
                'echo "DONE ... "',
            ],
        }),

    ]
};
