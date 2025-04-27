# @inventorjs/axios-weapp-adapter

[![npm version](https://img.shields.io/npm/v/@inventorjs/axios-weapp-adapter.svg)](https://www.npmjs.com/package/@inventorjs/axios-weapp-adapter)
[![license](https://img.shields.io/npm/l/@inventorjs/axios-weapp-adapter.svg)](https://github.com/inventorjs/axios-weapp-adapter/blob/main/LICENSE)

微信小程序环境下的 Axios 适配器，让你在小程序中也能使用 axios 发送请求。

## 特性

- 完全兼容 axios API
- 支持请求和响应拦截器
- 支持请求取消
- 支持 HTTP 状态码校验
- TypeScript 类型支持

## 安装

```bash
# 使用 npm
npm install @inventorjs/axios-weapp-adapter axios

# 使用 yarn
yarn add @inventorjs/axios-weapp-adapter axios

# 使用 pnpm
pnpm add @inventorjs/axios-weapp-adapter axios
```

## 使用示例

```js
import axios from 'axios';
import weappAdapter from '@inventorjs/axios-weapp-adapter';

// 创建 axios 实例并使用微信小程序适配器
const instance = axios.create({
  adapter: weappAdapter,
  // 其他 axios 配置项
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

// 使用 axios 发送请求
instance.get('/users')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// 也可以在单个请求中使用适配器
axios({
  url: 'https://api.example.com/users',
  method: 'GET',
  adapter: weappAdapter
}).then(/* ... */);
```

## API

该适配器与标准 axios 适配器保持一致，完全支持 axios 的所有配置项：

- `url`: 请求的 URL
- `method`: 请求方法
- `data`: 请求体数据
- `headers`: 请求头
- `timeout`: 请求超时时间
- `cancelToken`: 取消请求的令牌
- `validateStatus`: 验证响应状态码的函数

更多配置项请参考 [axios 文档](https://axios-http.com/docs/intro)。

## 注意事项

1. 微信小程序环境中不支持 axios 的某些特性，例如浏览器相关的功能（如 XSRF）
2. 请确保小程序已经授权网络请求域名

## 贡献指南

欢迎提交 Issues 或 Pull Requests 来改进这个项目！

1. Fork 本仓库
2. 创建你的特性分支: `git checkout -b feature/awesome-feature`
3. 提交你的更改: `git commit -m 'Add some awesome feature'`
4. 推送到分支: `git push origin feature/awesome-feature`
5. 提交 Pull Request

## 许可证

[MIT](./LICENSE)
