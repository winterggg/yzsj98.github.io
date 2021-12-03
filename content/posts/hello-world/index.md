---
title: "你好！一只水饺~"
date: 2021-12-04T00:54:32+08:00
math: true
categories: ['Daily']
---

## Intro

- 👋 Hi, I’m @yzsj98 一只水饺
- 👀 I’m interested in sleeping all the time
- 🌱 I’m currently learning programming

## 闲聊

大概在不久前，突然觉得得给自己起个网名，之前一直用的真实姓名感觉不太好。于是花时间想了想，最终决定使用“一只水饺”。也没有啥特别的意思，大概就是自己睡眠不是很足，希望能够一直睡个好觉，嘿嘿。顺便也买了一个域名 [YiZhiShuiJiao.Com](https://www.yizhishuijiao.com)。

恰好最近在学 `Go`，新网站的静态页面生成器就用 `Hugo` 好了。

## 功能测试

晚上花了点时间，从网上找了个几乎没啥功能的 Hugo 主题，改了一下，加了一些必要的功能。目前还有很多问题。接下来是简单的功能测试：

### 脚注功能测试

本站所有源码托管于 Github[^github] 上，使用 Github Action 自动部署[^deploy script]。

### 图片测试

点击可以放大。

![image-test](assets/image-test.png)

### 公式测试

Front Matter 里开启 math 属性即可使用公式。

```yaml
math: true
```

行类公式 $y=kx+b$正常显示。

块状公式正常显示：
$$
y=kx+b+\frac{1}{2}
$$

### 隐藏文章功能

Front Matter 里开启 hide 属性即可隐藏。

```yaml
hide: true
```

### 代码测试

```java
class Main {
    public static void main(String... args) {
        System.out.println("yzsj98");
    }
}
```

### Todo

大概就是这些，整体完成度还是挺低的。想到一些可以改进的东西先列出来，等有空慢慢完善吧...

- [x] 目录功能。
- [x] 字体更换。
- [x] 图片 Zoom 功能。
- [x] 公式支持。
- [x] 隐藏文章功能。
- [ ] 代码样式调整。
- [ ] 代码复制功能。
- [ ] 公式冲突的问题。
- [ ] 标签和目录页。
- [ ] 友联页面。
- [ ] 评论页面。
- [ ] 分页功能（等需要用到再说吧...）
- [ ] 字体排版、字重优化。
- [ ] 图床（不做似乎也可以）。
- [ ] 图片标题。
- [ ] 图片懒加载。
- [ ] 网站ICON。



[^github]: [yzsj98/yzsj98.github.io: 博客源代码和部署文件](https://github.com/yzsj98/yzsj98.github.io)
[^deploy script]: [部署脚本](https://github.com/yzsj98/yzsj98.github.io/blob/main/.github/workflows/deploy.yml)