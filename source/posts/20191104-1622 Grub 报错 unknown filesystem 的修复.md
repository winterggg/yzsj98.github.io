```
title: Grub 报错 unknown filesystem 的修复
date: 2019.11.04 16:22
tags: Grub Debug
description: 再用双系统我是狗
```

本文记录了下在安装 `Manjaro` 的基础上安装 `Windows 10` 而导致的 `grub` 引导失败报 `unknown filesystem` 的修复过程。

## TL;DR

**适用于 UEFI ！！！**

`grub rescue`

```
迭代 ls 找到 manjaro 所在的分区 (hdx,gptx)
set prefix=(hdx,gptx)/boot/grub
set root=hdx,gptx
insmod normal
normal
```

`进入系统后`

```bash
mount | grep /boot/efi # 找到 efi 所在分区 /dev/sdax
sudo update-grub
sudo grub-install /dev/sdax
```

完结撒花！



## 问题描述

因为种种原因，需要在笔记本上临时装个 `Win10`。于是找到启动盘，安装镜像，一顿操作后重启。发现居然直接进了 `Win10` ，隐约感觉有点不对劲，但忍住疑惑开始边进行繁琐的 `Win10` 配置， 边观看世界赛半决赛 T1 vs G2。配置的差不多后重启进入 `Manjaro` 却悲剧了。告诉我引导失败，报了 `unknown filesystem`，并贴心的进入了 `grub rescue` 模式。这时反应过来可能是安装工具改了磁盘挂载导致 `grub` 加载失败。



## 解决

### Grub 运行模式

`Grub` 有两种运行模式， `normal` 和 `rescue` ，`normal` 就是正常情况下那个包含了菜单界面的模式，而当 `grub` 发现错误时，就会进入 `rescue` 模式

`rescue` 的常用命令如下：

|        |        说明        |
| :----: | :----------------: |
|  set   | 查看、编辑环境变量 |
|   ls   |    查看分区信息    |
| insmod |      加载模块      |

### 修复 `grub` 配置

1. 使用 `ls` 命令，列出所有分区。
2. 依次使用 `ls (分区)/` 命令，直到分区可读且列出了 `Manjaro` 的 `/` 为止。记下根目录所在分区 `(hdx,gptx)`。
3. 输入 `set prefix=(hdx,gptx)/boot/grub` 和 `set root=hdx,gptx`，更改环境变量 `prefix` 和 `root`。
4. 执行 `insmod normal` 载入 `normal` 模块
5. 执行 `normal` 进入 normal 模式，此时应该可以正常引导进入 `Manjaro`.

### （可选）控制台模式

该小节来自网络，没有尝试过

```
进入普通模式，出现菜单，如果加载grub.cfg（错误的）可能出现问题，按shift可以出现菜单，之后按c键进入控制台
```

进入正常模式后就会出现`grub>`这样的提示符，在这里支持的命令就非常多了。 

引导系统

```
set root=(hd0,msdos1)  #设置正常启动分区
linux /boot/vmlinuz ....  ro text root=/dev/sda1  #加载内核，进入控制台模式
initrd  /boot/initrd ....  #加载initrd.img
boot #引导
```

### 更新 `grub`

进入系统后，打开终端：

1. 执行 `mount | grep /boot/efi`，记下 `efi` 分区的位置 `/dev/sdax`
2. 执行 ` sudo update-grub ` ，该操作会自动检测安装的操作系统，更新 `grub` 菜单。
3. 执行 `sudo grub-install /dev/sdax`，重新安装。