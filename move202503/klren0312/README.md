## project
- 项目名称: hexo-deployer-walrus
> 描述: hexo是一个快速、简洁且高效的博客框架, 借助本插件, 可以更加方便的将hexo部署到walrus上


## Member
- ZCDC  github: https://github.com/klren0312
> 自我介绍&技术栈: 前端开发, react, vue, nodejs 


## Installation

``` bash
$ npm install hexo-deployer-walrus --save
```

## Options
You can configure this plugin in `_config.yml`. How to setting walrus site-builder can be found in the Walrus official [Documentation](https://docs.wal.app/walrus-sites/intro.html/)

``` yaml
deploy:
  type: walrus (allow)
  network: mainnet or testnet (allow)
  epochs:  number of epochs to store file for walrus (allow, max is 53)
  site_builder_path: default use the system environment variable, you can use custom path
  sites_config_path: default use the plugin config, you can use custom path
```