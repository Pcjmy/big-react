## README

big-react

### 实现功能

+ JSX
+ Reconciler
+ ReactDOM
+ React DOM Diff
+ React Hooks
  + useState
  + useEffect
  + useTransition
  + useRef

### 调试方法

```shell
# 打包
pnpm run build:dev

# pnpm link 到全局
cd dist/node_modules/react
pnpm link --global

cd dist/node_modules/react-dom
pnpm link --global

# 新建一个React项目
pnpm link react --global
pnpm link react-dom --global
```
