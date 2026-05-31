# Cloutains 的旅程

> 用脚步丈量世界，用地图记录每一段旅程。

一个个人旅行足迹全栈 Web 应用。首页是一张深色交互地图，城市边界按评分染色，标记点带着脉冲动效；往下滚动是按年份分组的时间线，每张旅程卡片像杂志内页一样排版。点进详情页，封面图铺满半屏，正文支持首字下沉，照片画廊点击放大，访客可以投票和留言。

## 功能

### 首页

- **交互式地图** — 使用高德深色底图（自动降级 CARTO），城市区域按平均评分渲染不同颜色的多边形，hover 时发光扩散，点击弹出该城市所有旅程
- **统计栏** — 旅程总数、到访城市数、最近出行日期，数字动画入场
- **时间线** — 按年份分组，每段旅程以卡片展示封面、标题、地点、日期和评分徽章，桌面端左侧有竖线时间轴和年份导航

### 旅程详情页

- **杂志式封面** — 封面图铺满视口下半部分，标题叠加其上，带阅读进度条
- **长篇游记** — 支持段落和引用块，首段自动首字下沉（drop cap）
- **照片画廊** — 瀑布流排列，点击打开灯箱，支持左右键翻页和手势滑动
- **访客互动** — 认同度投票（1-5 档：非常认同 → 非常不认同）+ 想去程度投票（1-5 档：我要马上出发 → 狗都不去），支持昵称和留言
- **评论展示** — 所有投票和留言汇总展示，带头像色块和时间

### 全屏地图页

- 独立全屏地图，自由拖拽缩放，底部旅程快捷列表

### 管理后台（`/admin`）

- 密码登录，旅程 CRUD，中文标题自动生成 slug
- 照片批量上传（拖拽 / 点选），大图自动压缩至 1920px
- 一键设封面、删除照片
- 评论管理：查看并删除访客投票和留言

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | Supabase (PostgreSQL 17) |
| 存储 | Supabase Storage |
| 地图 | Leaflet + react-leaflet + 高德底图 |
| 地理处理 | Turf.js（城市边界合并） |
| 坐标转换 | GCJ-02 ↔ WGS-84 |
| 部署 | Vercel |

## 数据库

```
trips              8 条旅程
├── photos         66 张照片
├── agreement_votes  6 条认同投票
└── desire_votes     3 条想去投票

city_boundaries    城市边界 GeoJSON（用于地图多边形渲染）
```

所有表均开启 RLS（行级安全）。

## 设计风格

温暖的编辑式排版：奶油色画布、珊瑚色强调、深色地图表面。衬线字体用于标题，无衬线字体用于正文。评级标签用网络俚语："拉完了"、"npc"、"人上人"、"顶级"、"夯"。

## 本地开发

```bash
git clone https://github.com/Cloutains1221/My-Journey.git
cd My-Journey
npm install
```

创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名公钥
SUPABASE_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
ADMIN_PASSWORD=管理后台登录密码
```

启动：

```bash
npm run dev
```

- `http://localhost:3000` — 网站首页
- `http://localhost:3000/admin` — 管理后台
- `http://localhost:3000/map` — 全屏地图

## 项目结构

```
src/
├── app/
│   ├── page.tsx                  # 首页（统计栏 + 时间线）
│   ├── layout.tsx                # 根布局（导航栏 + 全局字体）
│   ├── map/page.tsx              # 全屏地图页
│   ├── trip/[slug]/page.tsx      # 旅程详情页
│   ├── admin/                    # 管理后台
│   └── api/
│       ├── admin/                # 管理 API（认证、旅程、照片、评论）
│       ├── votes/                # 投票 API
│       └── city-boundaries/      # 城市边界 GeoJSON API
├── components/
│   ├── HeroMap.tsx               # 首页交互地图（高德底图 + 城市多边形）
│   ├── TripCard.tsx              # 旅程卡片（时间线中使用）
│   ├── PhotoGallery.tsx          # 瀑布流照片画廊 + 灯箱
│   ├── AgreementVote.tsx         # 认同度投票
│   ├── DesireVote.tsx            # 想去程度投票
│   ├── VisitorComments.tsx       # 访客评论展示
│   ├── RatingBadge.tsx           # 评级徽章
│   ├── ReadingProgress.tsx       # 阅读进度条
│   ├── YearNav.tsx               # 年份导航
│   └── Nav.tsx                   # 导航栏
├── lib/
│   ├── types.ts                  # 类型定义 + 标签常量
│   ├── supabase.ts               # Supabase 客户端
│   ├── supabase-admin.ts         # Supabase 管理客户端
│   ├── coords.ts                 # GCJ-02 ↔ WGS-84 坐标转换
│   └── city-data.ts              # 城市边界匹配逻辑
scripts/
│   ├── schema.sql                # 数据库建表 SQL
│   └── fetch-city-boundaries.ts  # 城市边界数据抓取脚本
```

## 部署

推荐 Vercel 一键部署。需配置以下环境变量：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 |
| `ADMIN_PASSWORD` | 管理后台登录密码 |

## 许可

MIT License
