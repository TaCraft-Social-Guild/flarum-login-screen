# AGENTS.md

本文件面向在本仓库工作的 AI 编码代理与人类贡献者，说明项目边界、架构、硬性约束、常用任务与排障路径。**动手前请至少读完第 1、5、6 节。**

> **文档分工**
>
> - `README.md`：面向使用者——安装、更新、设置项、兼容性。
> - `AGENTS.md`（本文件）：面向实现者——架构、数据流、陷阱、任务配方、排障。
>
> 功能细节与「为什么这么写」只写在本文件，不要搬回 README。

## 目录

1. [项目速览](#1-项目速览)
2. [功能特性概览（实现范围）](#2-功能特性概览实现范围)
3. [技术栈](#3-技术栈)
4. [目录结构](#4-目录结构)
5. [架构与数据流](#5-架构与数据流)
6. [硬性约束与已知陷阱](#6-硬性约束与已知陷阱)
7. [常见任务配方](#7-常见任务配方)
8. [排障手册](#8-排障手册)
9. [编码规范](#9-编码规范)
10. [常用命令](#10-常用命令)
11. [提交前检查清单](#11-提交前检查清单)
12. [需要人工确认的场景](#12-需要人工确认的场景)

## 1. 项目速览

| 项 | 值 |
| --- | --- |
| 包名 | `tacraft-social-guild/flarum-login-screen` |
| 类型 | `flarum-extension`，**纯主题型**，当前没有任何 PHP 业务类 |
| 目标平台 | Flarum `^2.0`（开发与验证基于 Flarum 2.0.2 + PHP 8.5） |
| 扩展入口 | `extend.php` |
| PHP 命名空间 | `Tacraftsocialguild\Loginscreen\` → `src/`（目录尚不存在） |
| 前端包名 / 版本 | `@tacraft-social-guild/flarum-login-screen` / `beta-0.0.1` |
| 设置键前缀 | `tacraft-social-guild-login-screen.` |
| 管理端标题 | `Login Screen` |
| 许可 | MIT |

**一句话定位**：只重绘 Flarum 原生登录弹窗（`.LogInModal`）的外观，并把第三方登录按钮（`.LogInButtons`）排成可配置的方形图标网格，附带悬停提示。

### 范围边界

- ✅ 允许：登录弹窗的 LESS 样式、第三方登录按钮的布局算法、按钮悬停提示、对应的后台设置项。
- ❌ 禁止：新增登录方式、替换或改写登录表单字段、改动鉴权 / 会话 / API 逻辑。
- ❌ 禁止：修改 Flarum 核心或第三方登录插件的源码。所有增强只能经由扩展挂载点（LESS、JS initializer、`Extend\Settings`）实现。
- ⚠️ 任何超出「外观 + 排列 + 提示」的需求，先确认是否属于本项目职责，再动手。

## 2. 功能特性概览（实现范围）

本清单同时是**实现范围的边界说明**：改动若超出这些能力，需先确认职责归属。

### 2.1 登录弹窗外观

- 430px 卡片式弹窗、28px 圆角、毛玻璃背景（`backdrop-filter: blur(22px)`）与柔和双层投影。
- 头部渐变背景 + 装饰圆环，标题居中加粗。
- 输入框 48px 高、12px 圆角；聚焦时主色描边 + 3px 光环。
- 占位文本 `#9aa0a8`、`font-weight: 600`（浅灰加粗，替代默认纯黑）。
- 「登录」主按钮带主色投影，悬停时 `translateY(-1px)` 轻微上浮。
- 表单下半部分紧凑化：`Form-group` 间距 8px，复选框组外边距归零，主按钮组仅保留 4px 上间距。
- 桌面端通过 `.ModalManager:has(> .LogInModal)` 的 flex 布局在视口内垂直居中，替代 Flarum 默认的固定上边距。

### 2.2 第三方登录按钮

- 统一为正方形图标按钮（宽高固定为同一值），图标水平垂直居中；可见文字以 clip 方式视觉隐藏，`aria-label` 保留无障碍名称。
- 按后台设置排成 N 列网格（1–4 列），按钮尺寸 40–80px 可选。
- 最后一行只剩一个按钮时自动占据整行并居中。
- 窄屏按可用宽度自动收敛列数，避免溢出弹窗。
- 兼容 FoF/OAuth（含 `FoFLogInButtons--icons` 仅图标模式）与 Blessing Skin 登录插件。

### 2.3 悬停提示

- 鼠标停留或键盘聚焦后，按设置的延迟显示登录平台名称。
- 通过 Popover API 渲染在浏览器顶层，**始终位于登录弹窗之上**，不会被 `overflow: hidden` 裁切。
- 按下 `Esc`、页面滚动、窗口尺寸变化、指针移出时自动隐藏。

### 2.4 响应式与可访问性

- ≤767px 切换为全屏卡片布局，修正移动端元素错位与顶部导航遮罩叠加问题。
- 按钮提供 `:focus-visible` 焦点轮廓，提示通过 `aria-describedby` 关联到按钮。
- 尊重 `prefers-reduced-motion`，关闭过渡动画。
- 论坛未启用任何第三方登录时，`.LogInButtons:empty` 自动隐藏。

## 3. 技术栈

| 层 | 技术 | 说明 |
| --- | --- | --- |
| 后端 | PHP 8.x、Flarum 2 扩展 API（`Flarum\Extend`） | 仅用 `Frontend` / `Settings` / `Locales` 三类 extender |
| 样式 | LESS | 由 Flarum 编译进论坛 / 管理端资源包 |
| 前端 | TypeScript + Mithril，`flarum-webpack-config` 打包 | 论坛端逻辑集中在一个 `IExtender` 里 |
| 文案 | YAML（`locale/en.yml`、`locale/zh.yml`） | 必须成对维护 |
| 测试 | PHPUnit（`flarum/testing`）、Jest（`@flarum/jest-config`） | **目前只有骨架，没有实际用例**（见下） |

### 测试现状（重要）

- `tests/unit/`、`tests/integration/`、`js/tests/` 内只有 `.gitkeep`（另有一个 `tests/integration/setup.php` 初始化脚本），**没有任何测试用例**；`composer test` 会以「No tests executed」结束。
- `js/package.json` 的 `test` 脚本写死为 `yarn node --experimental-vm-modules $(yarn bin jest)`，依赖 yarn 与 POSIX shell，Windows 下通常不可用。
- 因此当前的有效质量门禁是：`check-typings` + `format-check` + `build` + `php -l extend.php` + LESS 编译校验。
- CI 由 Flarum 复用工作流驱动：`.github/workflows/backend.yml`（`REUSABLE_backend.yml@2.x`）、`.github/workflows/frontend.yml`（`REUSABLE_frontend.yml@2.x`，开启 prettier / typescript / tests，关闭 bundlewatch，包管理器为 npm，主分支 `main`）。
- **CI 不回写构建产物**：`REUSABLE_frontend.yml` 没有提供关闭回写的开关，其内部判定为 `do_not_commit = github.ref != 'refs/heads/<main_git_branch>' || event_name != 'push'`，只有「push 到该分支」时才会 `git push` 提交 `js/dist`。`frontend.yml` 故意把 `main_git_branch` 设为不存在的 `__no_auto_commit__`，使表达式恒为 `true`：CI 只做格式 / 类型 / 构建 / 测试校验，**`js/dist` 一律由本地 `npm run build` 后手动提交**。因此工作流只声明 `permissions: contents: read`，无需仓库开启写权限；若把它改回真实分支名，就会重新出现 `403 denied to github-actions[bot]`。

## 4. 目录结构

```
extend.php                     扩展入口：前端资源注册、3 项设置默认值、serializeToForum、registerLessConfigVar、Locales
composer.json                  Composer 元数据；PSR-4 指向 src/；extra.flarum-extension 含标题与图标
icon.svg                       管理端扩展图标，被 extra.flarum-extension.icon.image 引用
LICENSE                        MIT
README.md                      使用者文档
AGENTS.md                      本文件
.styleci.yml                   Flarum PHP 代码风格
.editorconfig / .gitattributes / .gitignore

less/forum.less                论坛端全部样式（弹窗外观、按钮网格、提示气泡、移动端断点）——唯一需要改的样式文件
less/admin.less                管理端样式，当前为空但仍在 extend.php 中注册
less/forum.css(.map)           IDE File Watcher 生成的本地检查产物，已 gitignore，禁止提交

js/forum.ts                    论坛端入口，导出 src/common 与 src/forum
js/admin.ts                    管理端入口，导出 src/common 与 src/admin
js/src/forum/index.ts          导出 extend
js/src/forum/extend.ts         论坛端核心逻辑：提示系统 + 按钮网格布局（约 420 行，本项目最复杂的文件）
js/src/admin/index.ts          导出 extend
js/src/admin/extend.ts         管理端设置项（3 个 select）
js/src/common/index.ts         空导出
js/src/common/extend.ts        两端共享 extender，当前为空数组
js/dist/                       构建产物（forum.js / admin.js + map），必须提交并随包发布
js/webpack.config.cjs          = flarum-webpack-config()
js/jest.config.cjs             = @flarum/jest-config({})
js/tsconfig.json               继承 flarum-tsconfig，映射 flarum/* 到 vendor
js/tsconfig.test.json          测试用 tsconfig（include tests/**）
js/tests/                      前端测试骨架（仅 .gitkeep）

locale/en.yml                  英文文案
locale/zh.yml                  简体中文文案（7 个 key，必须与 en.yml 一致）

tests/phpunit.unit.xml         单元测试配置，扫描 tests/unit
tests/phpunit.integration.xml  集成测试配置，扫描 tests/integration（排除 tmp）
tests/integration/setup.php    集成测试数据库初始化脚本

.github/workflows/             backend.yml / frontend.yml，调用 Flarum 官方复用工作流
.idea/watcherTasks.xml         IDE File Watcher：调用 vendor/bin/lessc 产出 less/*.css
```

## 5. 架构与数据流

### 5.1 两条通道

设置值到达前端的路径有两条并行通道，排障时必须同时确认：

- **编译期通道**：`extend.php` 的 `registerLessConfigVar` → LESS 变量 → `less/forum.less` 输出 CSS 变量（`--login-buttons-per-row`、`--login-button-size`、`--login-button-tooltip-delay`）。决定默认表现，需要 `php flarum cache:clear` 才更新。
- **运行期通道**：`serializeToForum` → 论坛资源属性（`loginButtonsPerRow`、`loginButtonSize`、`loginButtonTooltipDelay`）→ `js/src/forum/extend.ts` 读取后以**行内 `!important`** 写入。负责最终覆盖，能压过主题样式。

### 5.2 设置链路

```
管理端下拉框 (js/src/admin/extend.ts)
  → 设置键 tacraft-social-guild-login-screen.login_buttons_per_row
              tacraft-social-guild-login-screen.login_button_size
              tacraft-social-guild-login-screen.login_button_tooltip_delay
  → extend.php: Extend\Settings 的 default + serializeToForum + registerLessConfigVar
  → ① 论坛资源属性 loginButtonsPerRow / loginButtonSize / loginButtonTooltipDelay
     ② LESS 变量 @login-buttons-per-row / @login-button-size / @login-button-tooltip-delay
  → less/forum.less 输出 CSS 变量 --login-buttons-per-row / --login-button-size / --login-button-tooltip-delay
  → js/src/forum/extend.ts 读取（属性优先 → CSS 变量兜底 → 硬编码默认值），行内 !important 落盘
```

三处 `serializeToForum` / `registerLessConfigVar` 的闭包同时承担**取值钳制**：列数 `1–4`、尺寸 `40–80`（追加 `px`）、延迟 `0–2000`（追加 `ms`）。新增设置项时这三处都要写。

### 5.3 论坛端运行时

1. `app.initializers.add('tacraft-social-guild-login-screen', ...)` 内调用 `setupLoginScreen()`，整体包在 `try/catch` 中——增强逻辑失败只 `console.error`，不中断论坛启动。
2. `markTcsSkinButtons(document)`：用 `/tcs\s+skin/i` 匹配按钮可读文本，命中则写入 `data-login-provider="tcs-skin"`，供 LESS 做图标微调。
3. `updateLoginButtonLayouts(document)`：对每个 `.LogInModal .LogInButtons` 执行 `applyButtonLayout()`。
4. `MutationObserver`（`document.body`，`childList + subtree`）监听后插入的登录按钮，命中则重新标记与重排。
5. 事件绑定：`pointerover` / `pointerout` / `focusin` / `focusout` / `keydown(Escape)` / `scroll`（capture）/ `resize`。
6. `resize` 有两条处理：立即 `hideTooltip()`；另以 150ms 防抖重算布局（视口宽度影响列数收敛）。

### 5.4 关键函数职责

| 函数 | 职责 |
| --- | --- |
| `readForumSetting(attribute)` | 三层安全回退读取设置：`app.forum.attribute()` → `app.store.getById('forums','1').attribute()` → `app.data.resources` 中 `type === 'forums'` 的 `attributes`。全部失败返回 `undefined` |
| `readCssNumber(container, property)` | `getComputedStyle` 读取 CSS 变量并 `parseFloat`，非有限数返回 `undefined` |
| `getLayout(container)` | 决定列数与尺寸：属性优先，`--login-buttons-per-row` / `--login-button-size` 兜底，最终 4 / 56；结果再钳制到 1–4 与 40–80 |
| `applyButtonLayout(container)` | 行内 `!important` 写入 `display: grid`、`grid-template-columns`、`gap: 8px`、`width: max-content`、`max-width: calc(100vw - 48px)`、`margin: 0 auto 18px`；逐项固定宽高并标记 `LoginButtons-single-final-item` |
| `updateLoginButtonLayouts(root)` | 批量查找容器并应用布局 |
| `getTooltipLabel(button)` | 推断平台名：`aria-label` → `title` → `data-login-tooltip` → 内部元素的 `aria-label` / `title` / `data-provider` / `data-name` / `img[alt]` / 文本 → `.Button-label` → 按钮文本 → 类名匹配内置 22 个平台名 → `LogInButton--xxx` 后缀 |
| `getTooltipDelay(modal)` | 属性优先（`0` 视为有效值），`--login-button-tooltip-delay` 兜底，默认 500，钳制 0–2000 |
| `positionTooltip(button)` | 优先置于按钮上方 8px，空间不足则下方；水平居中并夹在视口内 12px |
| `markTcsSkinButtons(root)` | 标记 Blessing Skin 按钮 |
| `setupLoginScreen()` | 串起以上全部逻辑 |

### 5.5 布局算法要点

- **列数收敛**：`gap` 固定 8px；`available = container.parentElement?.clientWidth || window.innerWidth`；`fittingColumns = max(1, floor((available + gap) / (size + gap)))`；`effectiveColumns = min(configuredColumns, fittingColumns)`。
- **单按钮居中**：当 `items.length > effectiveColumns && items.length % effectiveColumns === 1` 时，给最后一项加 `grid-column: 1 / -1` 与 `justify-self: center`，并加类 `LoginButtons-single-final-item`（LESS 侧有同名规则）。
- **包装层处理**：FoF/OAuth 会为按钮套 `.LogInButtonContainer`。若容器直接子项本身不是按钮，则再向下把所有按钮固定为同一尺寸、`padding: 10px`、`margin: 0`。
- **布局写入顺序**：先写容器，再写子项；CSS 变量同步写回容器，供 LESS 的 `var()` 使用。

## 6. 硬性约束与已知陷阱

> 以下每条都是踩过的坑，改动前请确认不会让历史缺陷回归。

### A. 启动时序

1. **Flarum 2 启动顺序**：`app.load()` → `bootExtensions()`（执行 `extend()`）→ `boot()` → `initialize()`（运行 `app.initializers`）→ 推送启动载荷 → 赋值 `app.forum` → `mount()`。
   - 在 `extend()` 阶段访问 `app.forum` 必然拿到 `undefined`，直接读属性会抛 `TypeError` 并中断整个前端启动（历史表现为「尝试加载此网站的完整版本时出现错误」）。
   - 因此：所有 DOM 操作必须放进 `app.initializers.add(...)`；读取设置必须走 `readForumSetting()` 的多级回退。
2. **增强逻辑必须可失败**：`setupLoginScreen()` 已被 `try/catch` 包裹。不要为了「更干净」而移除，任何新逻辑都要保持「出错不影响论坛启动」这一前提。

### B. 样式冲突

3. **主题 `!important` 冲突**：Concourse 等主题会用 `!important` 强制 `.LogInButtons { display: flex; flex-direction: column }` 与 `.LogInButtons .Button { width: 100% !important }`。
   - 本项目对 `.LogInButtons` 的网格规则必须**全部**带 `!important`（含 `gap`、`flex-direction`、`flex-wrap`、`margin`、`width`、`max-width`）。
   - 论坛端脚本还会写入**行内 `!important`** 作为最终兜底；修改布局逻辑时不要移除这条路径。
4. **LESS 除法陷阱**：`grid-column: 1 / -1` 会被 LESS 当作除法，必须写成 `grid-column: ~'1 / -1'`。
5. **LESS 变量默认值**：`less/forum.less` 顶部用 `.login-buttons-default() when (default())` 提供 `@login-buttons-per-row: 4`、`@login-button-size: 56px`、`@login-button-tooltip-delay: 500ms`，保证脱离 Flarum 单独编译（IDE 文件监视器、本地校验）时不报错。新增变量必须在这里给默认值。
6. **不要删除带警告注释的代码块**：
   - 网格区段顶部标注「如果你不知道你在干什么，就别改这一块儿的代码」。
   - Blessing Skin 图标微调 `.LogInButtons [data-login-provider='tcs-skin'] > :not(.Button-label):not(.Button-labelText):not(img) { left: 4px }` 标注「别删」。
   - 两者都是多轮视觉调试的结论，删除后会立即复现历史缺陷。
7. **LESS 与 JS 的 `max-width` 有意不同**：LESS 用 `calc(100vw - 64px)` 作为无 JS 时的保守兜底，JS 行内值覆盖为 `calc(100vw - 48px)`。看到两者不一致不要「顺手统一」，否则会改变移动端表现。
8. **`font-size: 0` 会吃掉以 `em` 表达的图片尺寸**（本节附加说明）：按钮上的 `font-size: 0`（用于视觉隐藏文字）会让内联 `width: 1em; height: 1em` 的 `<img>` 计算为 `0px`。Blessing Skin 自定义图标（`<img class="LogInButton-logo" style="width:1em;height:1em">`）正是这种写法，症状是「按钮外框在、图标空白」。
   - 因此 `.LogInButtons img` 必须用 `width` / `height` + `!important` 显式写成 `@login-button-icon-size`，**不能**只靠 `max-width` / `max-height`（它压不过内联 `width` / `height`）；`margin: 0 !important` 用于压掉插件的 `marginRight: 0.5em`，保证图片真正居中。
   - `data-login-provider='tcs-skin'` 的 `left: 4px` 只针对字体图标，选择器已用 `:not(img)` 排除图片，避免图片被推偏。

### C. 提示

9. **提示必须置于顶层**：`#LoginScreenTooltip` 挂载在 `document.body`，用 `popover="manual"` + `showPopover()` 提升到顶层。**不要**放进弹窗内部，否则会被 `.Modal-content` 的 `overflow: hidden` 裁切，且在关闭动画期间出现视觉异常。

### D. 构建与产物

10. **`js/dist/` 必须提交**：`extend.php` 直接引用 `js/dist/forum.js` 与 `js/dist/admin.js`；`.gitattributes` 已标记为 `linguist-generated` / `-diff`。改了 `js/src/**` 就必须重新 `npm run build` 并一并提交。
11. **`less/*.css`、`less/*.css.map` 是本地检查产物**：由 `.idea/watcherTasks.xml` 调用 `vendor/bin/lessc` 生成，**不参与** Flarum 编译，已被 `.gitignore` 忽略。不要提交，也不要让它们进入 `extend.php`。

### E. 扩展元数据

12. **扩展图标（`icon.svg`）**：`composer.json` 的 `extra.flarum-extension.icon.image` 指向它，Flarum 读取后内联为 base64 `background-image`，渲染在 `.ExtensionIcon` 上。
    - `.ExtensionIcon` 自身**没有**声明 `background-size` / `background-repeat` / `background-position`，因此必须在 `icon` 里显式写 `backgroundSize: "contain"`、`backgroundRepeat: "no-repeat"`、`backgroundPosition: "center"`（`flarum/gdpr` 同样写法）。
    - SVG 只写 `viewBox`，**不要**加 `width` / `height`，否则会按固有尺寸渲染并被容器裁剪。
    - 需在 25–90px 区间均可辨认（侧栏 25px、扩展页头部 30px、扩展卡片 90px、Widget 28px、禁用态 54px）。
    - `icon` 里不需要 `name` 字段：图片图标由 `background-image` 呈现，`name` 只用于 FontAwesome 类名。
13. **`composer.json` 的 `extra` 是「安装期快照」，不是实时读取**：`Flarum\Extension\ExtensionManager::getExtensions()` 把 `vendor/composer/installed.json` 中的包元数据直接传给 `Extension` 构造函数，`getIcon()` 用的就是这份快照。
    - 只改本仓库的 `composer.json` **不会生效**，管理端仍显示旧图标（通常是空白或通用占位）。
    - 必须在论坛根目录执行 `composer update tacraft-social-guild/flarum-login-screen` 重写 `installed.json`，再 `php flarum cache:clear`。
    - 判断是否生效：`installed.json` 中该包的 `extra.flarum-extension.icon` 应已包含 `image` 键（检查命令见第 10 节）。

### F. 文案

14. **双语文案必须同步**：修改 `locale/en.yml` 必须同时修改 `locale/zh.yml`，键名保持一致（当前 7 个 key）。

## 7. 常见任务配方

### 7.1 新增一个设置项

必须同步改动 **6 个文件 + 2 份文档**，漏一个就会出现「后台能选、前台不生效」：

1. `extend.php`：`->default('<key>', '<默认值>')`、`->serializeToForum('<属性名>', '<key>', 钳制闭包)`、`->registerLessConfigVar('<less-变量名>', '<key>', 钳制闭包)`。
2. `js/src/admin/extend.ts`：新增 `new Extend.Admin().setting({...})`，`options` 与 `default` 要和 `extend.php` 一致。
3. `locale/en.yml`、`locale/zh.yml`：新增 `<name>_label` 与 `<name>_help`，两文件键名一致。
4. `less/forum.less`：在 `.login-buttons-default()` 里加变量默认值，并在使用处输出对应 CSS 变量。
5. `js/src/forum/extend.ts`：在 `readForumSetting()` 消费侧读取，并加入 `readCssNumber()` 兜底与钳制。
6. `README.md` 设置项表格 + 本文件第 5.2 节数据流。

### 7.2 调整弹窗外观

- 只改 `less/forum.less`，不要碰 `js/src/forum/extend.ts`。
- 只改 LESS 时无需 `npm run build`，但必须执行 `php flarum cache:clear` 让资源重新编译。
- 涉及 `.LogInButtons` 的网格区段时，先读第 6 节 B 组。
- 桌面端居中依赖 `.ModalManager:has(> .LogInModal)`，移动端在 `@media (max-width: 767px)` 内改为 `display: block` 并切换为全屏卡片；改一端必须同步检查另一端。

### 7.3 修改提示行为

- 文案来源：`getTooltipLabel()`，推断顺序见 5.4。若要支持新的第三方插件，优先在 `knownProviders` 数组或 `getTooltipLabel()` 的候选选择器里加，而不是写死具体 DOM 结构。
- 显示延迟：`getTooltipDelay()`，同时受设置与 CSS 变量影响。
- 定位：`positionTooltip()`，改动后需验证「弹窗顶部按钮」「弹窗底部按钮」「视口边缘」三种情况。
- 显隐时机：`beginTooltip()` / `showTooltip()` / `hideTooltip()`，注意 `aria-describedby` 的保存与还原（`previousDescription`）。

### 7.4 修改扩展元数据或图标

1. 改 `composer.json`（标题、图标、`backgroundColor` 等）或替换 `icon.svg`。
2. 论坛根目录执行 `composer update tacraft-social-guild/flarum-login-screen` 刷新 `installed.json`。
3. 执行 `php flarum cache:clear`。
4. 管理端 `Ctrl+F5` 硬刷新绕过浏览器缓存。

## 8. 排障手册

| 症状 | 可能原因 | 处理 |
| --- | --- | --- |
| 启用后整站白屏 / 提示「尝试加载此网站的完整版本时出现错误」 | `extend()` 阶段访问了 `app.forum` | 把 DOM 与设置读取逻辑移进 `app.initializers`，走 `readForumSetting()`（第 6 节第 1 条） |
| 改了「每行数量」前台没变化 | 未 `cache:clear`；主题 `!important` 覆盖；浏览器缓存 | 依次：`php flarum cache:clear` → `Ctrl+F5` → 检查按钮容器的行内 `style` 是否有 `grid-template-columns` |
| 设为 3 列却显示 4 列 | 行内 `!important` 兜底路径被删，或 `serializeToForum` 属性名与前端读取不一致 | 对照 5.2 检查属性名；确认 `applyButtonLayout()` 仍写入 `grid-template-columns` |
| 按钮变成竖向排列 | 主题用 `flex-direction: column !important` 强制纵向，且本项目未用 `grid` | 保持 `display: grid !important` 与 `flex-direction: row !important` 同时存在 |
| 最后一行单按钮不居中 | 未加 `LoginButtons-single-final-item`，或 LESS 的 `grid-column` 被 LESS 当除法 | 检查类名与 `~'1 / -1'` 写法 |
| Blessing Skin 图标看起来偏左 | 未标记 `data-login-provider="tcs-skin"`，或 `left: 4px` 被删 | 确认 `markTcsSkinButtons()` 命中；恢复该规则 |
| 第三方插件的图片图标不显示（按钮外框在、图标空白） | 按钮 `font-size: 0` 让内联 `1em` 尺寸坍缩为 `0px`，而 `img` 规则只有 `max-width` | 保留 `.LogInButtons img` 的 `width` / `height` + `!important`（第 6 节第 8 条） |
| 悬停提示被弹窗裁切 / 被遮住 | 提示被放进 `.Modal-content`，或未启用 Popover | 提示必须挂在 `document.body`（第 6 节第 9 条） |
| 悬停提示完全不出现 | 按钮及其内部元素没有任何可读文本或可识别的类名 | 为对应插件按钮补 `aria-label` / `title`，或在 `knownProviders` 中登记 |
| 移动端元素错位、顶部被导航遮罩盖住 | `@media (max-width: 767px)` 内的覆盖规则被删 | 恢复该断点内的 `::before { display: none }` 与标题定位重置 |
| 管理端扩展图标空白 | `installed.json` 快照未刷新；或缺 `backgroundSize` 等属性 | 执行第 7.4 节流程；核对 `icon` 五项属性 |
| LESS 编译报错或输出异常 | 新增变量缺默认值；`1 / -1` 被当除法；`@var * 0.43` 未加括号 | 对照第 6 节 B 组 |

## 9. 编码规范

- **注释语言**：简体中文。类、方法/函数、字段使用文档注释（TSDoc / PHPDoc），说明用途、参数、返回值；不为显而易见的代码写行内注释。
- **TypeScript**：必须通过 `npm run check-typings` 与 `npm run format-check`（Prettier 配置来自 `@flarum/prettier-config`）。
- **PHP**：遵循 `.styleci.yml` 中的 Flarum 代码风格。
- **依赖**：不引入新的运行时依赖；新增前端依赖前确认与 `flarum-webpack-config` 兼容。
- **文件编码**：新增或编辑的源文件保存为 UTF-8 无 BOM；行尾由 `.gitattributes` 的 `* text=auto eol=lf` 统一为 LF。
- **常量集中**：`buttonSelector`、`tooltipId`、`knownProviders` 等常量集中在 `js/src/forum/extend.ts` 顶部，不要在函数内重复定义。

## 10. 常用命令

### 前端（在 `js/` 目录执行）

```sh
npm install
npm run build            # 生产构建，输出 js/dist/forum.js、js/dist/admin.js（必须提交）
npm run dev              # 开发监听（webpack --watch）
npm run check-typings    # TypeScript 类型检查
npm run format           # 自动格式化 src
npm run format-check     # 格式检查
```

### 后端

```sh
php -l extend.php        # 语法检查
composer test:setup      # 首次运行，准备集成测试数据库
composer test            # 运行单元 + 集成测试（当前无用例，会提示 No tests executed）
```

### 论坛站点联调

改过 `composer.json`（尤其是 `extra`）后必须刷新安装期快照：

```sh
composer update tacraft-social-guild/flarum-login-screen   # 重写 vendor/composer/installed.json
php flarum cache:clear                                     # 重建资源与缓存
```

确认快照内容（PowerShell）：

```powershell
(Get-Content vendor/composer/installed.json -Raw | ConvertFrom-Json).packages |
  Where-Object name -eq 'tacraft-social-guild/flarum-login-screen' |
  ForEach-Object { $_.extra.'flarum-extension'.icon }
```

### LESS 独立校验（无需启动论坛）

利用本地 `vendor` 中的 `Less_Parser`：

```php
<?php
require 'vendor/wikimedia/less.php/lib/Less/Autoloader.php';
Less_Autoloader::register();

$parser = new Less_Parser(['import_dirs' => ['less' => getcwd().'/less']]);
$parser->ModifyVars([
    'login-buttons-per-row' => '3',
    'login-button-size' => '64px',
    'login-button-tooltip-delay' => '500ms',
]);
$parser->parseFile(getcwd().'/less/forum.less');
echo $parser->getCss();
```

预期输出包含：`--login-buttons-per-row: 3`、`--login-button-size: 64px`、
`grid-template-columns: repeat(var(--login-buttons-per-row, 3), var(--login-button-size, 64px)) !important`、
`gap: 8px !important`、`grid-column: 1 / -1`。

### Windows / PowerShell 注意事项

- 不支持 `&&`、`||`、heredoc；用 `;` 与 `if ($?) { ... }` 串联命令。
- 读取含中文的文件时显式指定 `-Encoding UTF8`，否则控制台乱码（文件本身通常没问题）。
- `php -r '...'` 中的 `$` 会被 PowerShell 展开，应改为写临时 `.php` 文件再执行，用 `$argv` 传参。
- 本地联调可用 Junction / `mklink /J` 把本仓库链接到论坛的 `vendor/tacraft-social-guild/flarum-login-screen`。

## 11. 提交前检查清单

1. `cd js && npm run check-typings` 通过。
2. `cd js && npm run format-check` 通过。
3. `cd js && npm run build` 成功，`js/dist/*.js` 已更新并纳入本次提交。
4. `php -l extend.php` 无语法错误；改过 LESS 则用第 10 节的校验片段确认输出符合预期。
5. 新增或修改文案时，`locale/en.yml` 与 `locale/zh.yml` 键名一致。
6. 新增设置项时，`README.md` 设置表与本文件 5.2 节已同步。
7. `git status` 确认没有误提交 `less/*.css`、`less/*.css.map`、`composer.lock`、`.idea/`。
8. 提醒使用者：部署后需执行 `php flarum cache:clear` 并强制刷新页面；若动过 `composer.json`，还要 `composer update` 刷新快照。

## 12. 需要人工确认的场景

- **布局策略变更**（flex ↔ grid、列数收敛算法、`gap` 或 `max-width` 调整）：高风险，需在真实论坛同时验证「无主题」「Concourse 主题」「移动端」三种场景。
- **`serializeToForum` 属性名变更**：破坏性改动，旧前端产物会读不到值，必须同步重建 `js/dist/`。
- **设置取值区间调整**：`extend.php` 的钳制闭包、`js/src/admin/extend.ts` 的 `options`、`js/src/forum/extend.ts` 的钳制、`README.md` 表格、本文件 5.2 节，五处必须一致。
- **新增第三方登录插件适配**：需要确认该插件按钮是否位于 `.LogInModal .LogInButtons` 内，以及是否提供了可读文本（否则提示无内容可显示）。
- **删除或重写 `less/forum.less` 中带警告注释的区段**：除非能在真实环境复现并验证替代方案，否则不要动。
