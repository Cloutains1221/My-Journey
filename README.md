# Cloutains的旅程

一个记录个人旅行足迹的全栈博客网站。用地图、时间线和照片展示每一段旅程，支持访客互动投票和评论。

### 功能一览

**前台展示**
- 首页地图展示所有足迹，标记点按评级色彩分级，hover 有脉冲动效
- 旅程时间线，按日期倒序排列，桌面端带竖线时间轴
- 旅程详情页：封面图、评级徽章、长篇游记、照片画廊（点击放大灯箱）
- 全屏地图页，可自由拖拽缩放浏览，底部有旅程快捷列表
- 访客互动：认同度投票（5 档）、想去程度投票（5 档），支持昵称和留言

**管理后台（`/admin`）**
- 密码登录认证
- 旅程增删改查，中文标题自动生成 URL 标识
- 照片批量上传（拖拽 / 点选），大图自动压缩至 1920px
- 一键设封面、删除照片
- 评论管理：查看并删除访客投票和留言

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | Supabase (PostgreSQL) |
| 存储 | Supabase Storage |
| 地图 | Leaflet + react-leaflet |
| 部署 | Vercel |

### 数据库

项目使用 Supabase 作为后端，包含以下表：

| 表名 | 用途 |
|------|------|
| `trips` | 旅程信息（标题、日期、地点、坐标、内容、评级等） |
| `photos` | 旅程照片（关联 trip_id，存储 Supabase Storage URL） |
| `agreement_votes` | 认同度投票（关联 trip_id，含昵称和可选留言） |
| `desire_votes` | 想去程度投票（关联 trip_id，含昵称和可选留言） |

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Cloutains1221/My-Journey.git
cd My-Journey

# 安装依赖
npm install

# 创建环境变量文件 .env.local，填入以下内容：
# NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名公钥
# SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
# ADMIN_PASSWORD=管理后台登录密码

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 查看网站，`http://localhost:3000/admin` 进入管理后台。

### 项目结构

```
src/
├── app/
│   ├── page.tsx                  # 首页（时间线 + 地图）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   ├── admin/
│   │   ├── page.tsx              # 管理后台页面
│   │   └── AdminClient.tsx       # 管理后台客户端组件
│   ├── api/
│   │   ├── admin/                # 管理 API（认证、旅程、照片、评论）
│   │   └── votes/                # 投票 API（认同、想去）
│   ├── map/page.tsx              # 全屏地图页
│   └── trip/[slug]/page.tsx      # 旅程详情页
├── components/
│   ├── Nav.tsx                   # 导航栏
│   ├── HeroMap.tsx               # 首页地图
│   ├── TripCard.tsx              # 旅程卡片
│   ├── PhotoGallery.tsx          # 照片画廊（含灯箱）
│   ├── RatingBadge.tsx           # 评级徽章
│   ├── AgreementVote.tsx         # 认同度投票组件
│   ├── DesireVote.tsx            # 想去程度投票组件
│   └── VisitorComments.tsx       # 访客评论展示
└── lib/
    ├── types.ts                  # 类型定义和标签常量
    ├── supabase.ts               # Supabase 公开客户端
    └── supabase-admin.ts         # Supabase 管理客户端（仅服务端）
```

### 部署

推荐使用 Vercel 一键部署，需要在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 |
| `ADMIN_PASSWORD` | 管理后台登录密码 |

### 许可

MIT License
