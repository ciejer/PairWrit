const { defineConfig } = require('@vue/cli-service')

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        return {
          ...options,
          compilerOptions: {
            isCustomElement: tag => tag.startsWith('custom-')
          }
        }
      });
  },
  transpileDependencies: []
}