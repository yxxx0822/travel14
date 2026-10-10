# 旅游时光手账 (Travel01)

结对编程组：Travel14（陈雨轩 + 许冰轩）

## 项目简介

旅游时光手账是一个带社交功能的旅行日记应用，用户可以记录旅行点滴、分享心情、查看时光回顾和旅行统计。

## 功能特性

- 用户注册登录与个人资料管理
- 创建和编辑旅行日记
- 上传照片并添加心情标签
- 日记可见性控制（公开/私密/仅好友）
- 关注其他用户
- 点赞和评论
- 地图服务集成（高德地图）
- 时光信封（历史回忆）
- 旅行统计

## 技术栈

- **后端**: Python + FastAPI
- **数据库**: SQLite (可切换到 PostgreSQL)
- **ORM**: SQLAlchemy
- **认证**: JWT
- **地图服务**: 高德地图 API

## 快速开始

### 1. 安装依赖

```bash
cd travel01
pip install -r requirements.txt
```

### 2. 配置环境变量

修改 `.env` 文件，填入你的高德地图 API Key：

```
AMAP_WEB_SERVICE_KEY=你的Web服务Key
AMAP_JS_API_KEY=你的JS_API_Key
```

### 3. 运行项目

```bash
python main.py
```

服务将在 `http://localhost:8000` 启动

### 4. 查看 API 文档

访问 `http://localhost:8000/docs` 查看自动生成的 API 文档

## 项目结构

```
travel01/
├── app/
│   ├── models/          # 数据库模型
│   ├── schemas/         # Pydantic 数据验证模型
│   ├── api/             # API 路由
│   ├── services/        # 业务逻辑层
│   └── utils/           # 工具类
├── tests/               # 测试
├── main.py              # 应用入口
├── requirements.txt     # 依赖列表
└── .env                 # 环境变量
```

## 开发进度

- [x] 项目初始化
- [x] 数据库模型设计
- [x] 基础工具类（地图服务、认证）
- [ ] 用户注册登录 API
- [ ] 日记 CRUD API
- [ ] 社交功能 API
- [ ] 前端开发

## 类图

参考项目文档中的 UML 类图

## License

MIT
