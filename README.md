# TravelFlow 差旅申请管理

基于 SvelteKit、TypeScript、Tailwind CSS 和 Vitest 构建的企业差旅申请与审批管理系统。

## 功能

- 工作台：申请状态指标和最近申请
- 发起申请：表单校验、预览和提交
- 申请管理：搜索、状态筛选和详情
- 审批处理：提交审批、通过、驳回及审批意见
- 数据统计：状态分布、部门申请量、费用和通过率

## 开发

安装依赖后运行：

```sh
npm install
npm run dev
```

## 检查与测试

```sh
npm run check
npm test
```

## 构建

```sh
npm run build
npm run preview
```

## API

- `GET /api/applications`：获取申请列表
- `POST /api/applications`：创建差旅申请
- `GET /api/applications/:id`：获取申请详情
- `PATCH /api/applications/:id`：更新申请状态

当前示例数据存储在进程内存中，服务重启后会恢复初始数据。
