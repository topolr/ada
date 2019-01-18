<!--{"name":"Quick Start","icon":"paper-plane","active":false,"desc":"Integrated Web Framework","index":1,"commentId":"2"}-->

## 从npm开始

### 1.安装adajs npm模块

```javascript
npm install adajs -g
```
### 2.在磁盘上创建项目目录
### 3.命令行进入该目录
### 4.初始化ada模板项目

```javascript
> adajs init <projectname>
```
比如
```javascript
> adajs init web
```
### 5.安装依赖模块
```javascript
npm install
```
一切就绪可以开始工作了。

### 6.开发
```javascript
npm run dev
```
> 开发模式会自动追踪文件变动并进行构建发布，同时会向浏览器发送构建信息，页面会自动更新。

### 7.发布
```javascript
npm run publish
```
> 发布模式会只构建项目

## 从git开始

### 1.从github上下载或者clone项目适合的模板项目

 - https://github.com/topolr/ada-template-web.git
 - https://github.com/topolr/ada-template-server.git
 - https://github.com/topolr/ada-template-comonent.git

### 2.安装依赖模块
```javascript
npm install
```
OK，一起就绪

### 3.开发
```javascript
npm run dev
```
### 4.发布
```javascript
npm run publish
```

## Ada Template

ada 提供了3中类型的模板项目，用于快速开发工作。

### web模板

web模板是指纯前端项目，不带后端服务

```javascript
> adajs init projectname web
```

### server模板

server模板是指前后端同在一个项目中的情形，后端使用的是Express

```javascript
> adajs init projectname server
```
特别的是express的入口文件需要做拆分（模板中已经做过），这样的拆分是为了使ada托管express服务。

### component模板
开发ada组件的模板

```javascript
> adajs init projectname component
```