# Flarum Login Screen

![License](https://img.shields.io/badge/license-MIT-blue.svg) <!-- [![Latest Stable Version](https://img.shields.io/packagist/v/tacraft-social-guild/flarum-login-screen.svg)](https://packagist.org/packages/tacraft-social-guild/flarum-login-screen) [![Total Downloads](https://img.shields.io/packagist/dt/tacraft-social-guild/flarum-login-screen.svg)](https://packagist.org/packages/tacraft-social-guild/flarum-login-screen) -->
<!-- 部分内容由AI或是Flarum CLI生成，所以被注释掉了。（也有可能是我觉得没什么必要 -mahiro76）-->
<!-- A [Flarum](https://flarum.org) 2.x extension that redesigns the native login modal and arranges third-party login buttons into a configurable icon grid. -->

面向 Flarum 2 的登录界面美化扩展：只重绘**原生登录弹窗**的外观与第三方登录按钮的排列方式，不新增登录方式，也不修改任何登录逻辑与表单字段。

## 安装
环境要求：
```
Flarum 2.0 +
PHP 8.5 +
```

**1 . 在 `Flarum` 的 `composer.json` 中添加仓库源（若已添加则跳过）：**
```json
{
  "repositories": [
    {
      "type": "vcs", 
      "url": "https://github.com/TaCraft-Social-Guild/flarum-login-screen"
    }
  ]
}
```

**2 . 在`require`中添加获取的分支属性：**
```json
{
  "require": {
    "tacraft-social-guild/flarum-login-screen": "dev-main"
  }
}
```

**3 . 执行安装命令：**
```sh
composer require tacraft-social-guild/flarum-login-screen
```

**4 . 清理`PHP`缓存：**
```sh
php flarum cache:clear
```

**安装完成后进入「管理后台 → 扩展 → Login Screen」进行配置。**
<!-- Windows 下创建符号链接需要管理员权限或开启「开发者模式」。若软链接创建失败，可将 `"symlink": true` 改为 `false`（复制安装，每次改动需重新执行 `composer update`），或手动使用 `mklink /J` 建立目录联接。 -->

## 更新

```sh
composer update tacraft-social-guild/flarum-login-screen
php flarum cache:clear
```

## 设置项

设置键均以 `tacraft-social-guild-login-screen.` 为前缀。

| 设置 | 设置键后缀 | 可选值 | 默认值 |
| --- | --- | --- | --- |
| 每行登录按钮数量 | `login_buttons_per_row` | 1 / 2 / 3 / 4 | `4` |
| 登录按钮尺寸 | `login_button_size` | 40 / 48 / 56 / 64 / 72 / 80 px | `56` |
| 按钮提示延迟 | `login_button_tooltip_delay` | 0 / 250 / 500 / 750 / 1000 / 1500 / 2000 ms | `500` |

按钮尺寸与提示延迟由 LESS 变量参与编译，修改后需执行 `php flarum cache:clear` 让资源重新编译。

## 兼容性

- Flarum `2.0 +`（已在 Flarum 2.0.2 + PHP 8.5 上完成测试）
<!-- - 已验证与 `tacraft-sociality/concourse` 主题共存：主题会用 `!important` 强制 `.LogInButtons` 纵向 flex 排列，本扩展改用行内 `!important` 网格布局覆盖该行为 -->
- 提示依赖 Popover API（Chrome 114+ / Safari 17+ / Firefox 125+）；不支持时退化为普通固定定位元素，功能不受影响

<!-- ## 开发

前端代码位于 `js/`：

```sh
cd js
npm install
npm run build            # 生产构建，输出 js/dist/forum.js 与 js/dist/admin.js
npm run dev              # 开发监听
npm run check-typings    # TypeScript 类型检查
npm run format-check     # Prettier 格式检查
```

后端测试：

```sh
composer test:setup      # 仅首次运行，准备测试数据库
composer test
```

-->


<!-- ## 常见问题

- **修改了列数但前台没有变化**：执行 `php flarum cache:clear`，再用 `Ctrl+F5` 强制刷新。若仍无效，检查是否有自定义 CSS 以更高特异性固定了 `.LogInButtons` 的布局。
- **悬停提示不显示**：提示文案由按钮或其内部元素的 `aria-label`、`title`、`alt`、`data-provider` 等属性推断，若第三方插件未提供任何可读文本，则该按钮不会显示提示。
- **第三方按钮没有变成方形图标**：确认对应登录插件渲染的按钮位于 `.LogInModal .LogInButtons` 容器内。

-->

## 链接

<!-- -[Packagist](https://packagist.org/packages/tacraft-social-guild/flarum-login-screen) -->
- [GitHub](https://github.com/TaCraft-Social-Guild/flarum-login-screen)
<!-- [Discuss](https://discuss.flarum.org/d/PUT_DISCUSS_SLUG_HERE) -->

## 许可

本项目基于 [MIT license](LICENSE) 发布。
