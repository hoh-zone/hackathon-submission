# 这是我计划参与黑客松的项目，暂时起名为人类自由学术图书馆

## 项目简介

项目很简单，就是创建一个图书馆（基于walrus），有不同的目录。用户连接钱包之后可以上传自己的学术资料（现计划是上传markdown），然后其他人可以下载这些资料，也可以直接在每篇文章的评论区评论。

## 工程结构

合约struct：目录（Library），文章（issue），评论（comment）。其中评论计划先用中心化后端保存，然后每隔24小时保存一份最新评论的pdf，再上传到walrus上。

在合约设计上，我计划参考陈老师直播课上写的合约，在lets-walrus目录下。我觉得改吧改吧就可以了。

`demoproject`是目前工程：其中`walrus-allthinking`是前端，基于官方提供的dapp-kit脚手架写的。`allthinking_backend`是后端，基于python的`django框架`。`library`是合约，目前也完成了一小部分。

## 参与人
十九 GitHub ID：AlexWaker




