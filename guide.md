# 书源编写教程

## 前置要求

- nodejs LTS
- pnpm

## 编写书源

### 生成书源

运行 `pnpm new <id>` 命令根据要求生成一个新的书源。

### 填写测试相关变量

打开生成的书源根据提示和已有书源填充 `testSeeds` 对象。

### 保存页面到本地

> 本步骤可跳过；
> 可以让 AI 直接访问书源网站来生成书源；
> 测试可以跳过，不影响正常功能。

运行 `pnpm record <id>` 命令将书源网站的内容保存到 `text/fixtures/<id>` 文件夹供测试或 AI 生成书源使用。

### 完成书源

手动填充 `<id>.ts` 中 `TODO` 标记的位置以完成书源。或者使用 AI 完成书源的编写。

### 产物生成

`qysg.config.ts` 文件为项目所需部分配置存放位置，可以按需修改。

**一定要修改 `qysg.config.ts` 文件中的 `BASE_URL` 为自己的网址。**

运行 `pnpm build` 命令生成最终的产物，`dist/html` 文件夹中为书源 html，`dist/json` 文件夹为生成的 json 文件。

## 部分函数介绍

**部分介绍可能已经过时，推荐查看常用函数文件来获得最佳体验**

### `utils/bridge.ts`

此文件是书源 `flutterBridge`, `http`, `cache`, `cookie` 和 `getHelp()` 全局变量的实现位置，与官方提供的函数有部分区别。
主要为需要 `JSON.stringify` 的参数在内部自动实现，无需再调用时传入。部分方法优化了封装和参数。

### `utils/encoding.ts`

此文件为纯 TS 实现的编码转换函数，不再需要 `FlutterJSBridge.utf8ToGbkUrlEncoded` 转换字符编码，使用 `percentEncodeGBK(str)` 即可转换为 GBK 编码的 URL 参数用以适配 GBK 编码网站的搜索。

更多编码的转换可以查看文件来实现多编码的转换。

### `utils/html.ts`

此文件是一个简单的 html 解析和操控工具，提供了类似于 JQuery 的 API 来查找和解析元素。默认不再使用 JQuery 远程脚本，而是使用这个轻量高效的替代品。

**后文提到的 Q 对象即为使用此工具返回的对象。**

此文件中函数不再需要 `.trim()` 来去除空格，已经内置。

### `utils/helpers.ts`

此文件为书源开发中封装的一些通用工具函数。具体函数可以查看文件，这里只简单介绍一下。

#### `parsePage`

此函数为将请求获取的网页数据解析为 Q 对象，可选发送调试数据到 App。

大多数情况下无需使用此函数。

#### `fetchPage`

此函数为通用的网页数据获取函数。

此函数高度封装，默认情况下可以直接使用此函数发起请求并返回 Q 对象。大大节省书源文件中高度重复的代码。

可选发送调试数据到 App。

#### `replacePlaceholders`

此函数为通用 `{{name}}` 占位符替换函数。默认情况下无需使用此函数。

#### `resolvePagination`

此函数为 `{{page}}` 分页占位符替换函数，大多数情况下发现的占位符可以使用此函数替换。

#### `resolveUrl`

从函数将相对路径转为绝对路径并且编码

#### `extractChapters`

此函数为通用章节提取函数，适配大多数情况。

#### `extractContent`

此函数为通用正文提取函数，适配大多数情况，删除大多数广告。
