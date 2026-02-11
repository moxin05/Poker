# 德州扑克 — 前端

React 19 + Vite + Socket.IO Client

## 快速启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev        # http://localhost:5173

# 构建
npm run build

# 预览构建产物
npm run preview
```

## Vite 代理配置

开发模式下，Vite 自动代理以下路径到后端 `localhost:3001`：

| 路径 | 说明 |
|------|------|
| `/api/*` | REST API |
| `/uploads/*` | 静态资源（头像等） |
| `/ws` | WebSocket（Socket.IO） |

## 项目结构

```
src/
├── main.jsx                      # 入口（BrowserRouter + AuthProvider + ToastProvider）
├── App.jsx                       # 路由配置
├── styles/
│   └── index.css                 # 全局基础样式
│
├── api/                          # API 层
│   ├── http.js                   # fetch 封装（自动 token、错误处理）
│   ├── auth.js                   # 认证 API（注册/登录/me）
│   ├── room.js                   # 房间 API（创建/加入/退出/邀请码）
│   └── user.js                   # 用户 API（头像上传/个人信息）
│
├── auth/                         # 认证上下文
│   ├── AuthContext.jsx           # 全局登录状态（token/user/login/logout）
│   └── tokenStorage.js           # localStorage JWT 持久化
│
├── hooks/
│   └── useSocket.js              # WebSocket 连接管理 Hook
│
├── shared/
│   └── cards.js                  # 扑克牌常量（花色/点数/路径映射）
│
├── components/                   # 通用组件
│   ├── PokerCard.jsx + .css      # 扑克牌卡牌（3D翻牌、角标、三种尺寸）
│   ├── Toast.jsx + .css          # 全局 Toast 提示（info/success/warn/error）
│   ├── LandscapeGuard.jsx + .css # 竖屏提示横屏
│   └── VideoBackground.jsx + .css# 视频背景
│
├── features/
│   ├── auth/
│   │   ├── AuthPage.jsx          # 登录/注册页（毛玻璃卡片）
│   │   └── auth.css
│   │
│   ├── lobby/
│   │   ├── LobbyPage.jsx         # 游戏大厅主页
│   │   ├── lobby.css              # 大厅所有样式（~1200行）
│   │   └── components/
│   │       ├── LobbyHeader.jsx    # 顶部导航栏（滑动高亮 + 头像上传）
│   │       ├── PokerTable.jsx     # 牌桌（CSS绘制 + 座位 + 游戏状态）
│   │       ├── ActionBar.jsx      # 加注操作栏（过牌/跟注/弃牌/加注/全下）
│   │       ├── InviteModal.jsx    # 邀请好友弹窗
│   │       ├── JoinRoomModal.jsx  # 加入牌桌弹窗
│   │       └── StatsPanel.jsx     # 数据统计弹窗
│   │
│   └── join/
│       └── JoinByLink.jsx        # /join?code=XXX 链接加入路由
│
└── public/
    ├── asset/
    │   ├── fold.png               # 卡牌背面
    │   ├── card_number.png        # 卡牌角标盾形底图
    │   ├── table.png              # 牌桌素材（备用）
    │   ├── diluke.png             # IP角色立绘（备用）
    │   └── background.mp4        # 登录页视频背景
    └── card/
        ├── heart_1.png ~ heart_13.png    # 红桃 A~K
        ├── spade_1.png ~ spade_13.png    # 黑桃 A~K
        ├── diamond_1.png ~ diamond_13.png# 方块 A~K
        └── club_1.png ~ club_13.png      # 梅花 A~K
```

## 路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | AuthPage | 登录/注册 |
| `/` | LobbyPage | 游戏大厅（需登录） |
| `/join?code=XXX` | JoinByLink | 链接直接加入牌桌 |

## 设计风格

参考原神·七圣召唤卡牌游戏，温暖柔和色调：

| 元素 | 色值 |
|------|------|
| 背景 | `#3c3530 → #322b26` 温暖棕色渐变 |
| 文字 | `#f0e4d0` 暖奶油色 |
| 强调 | `#c4a265 / #dcc18a` 暖金色 |
| 牌桌 | CSS 绘制：棕框 + 青绿菱格桌面 + SVG 纹章/装饰 |
| 卡牌 | 奶油色边框 + 盾形角标 + 3D 翻牌动画 |

## 核心交互

- **卡牌**: 3D 翻牌动画（`perspective` + `rotateY`），hover 上浮，选中金圈
- **导航栏**: 纯 CSS 滑动高亮（`:hover ~ .slider` 兄弟选择器）
- **座位视角旋转**: 当前玩家始终在屏幕下方正中，其他玩家相对位置旋转
- **发牌动画**: 公共牌缩放弹入，手牌从天而降
- **实时更新**: WebSocket 监听 `room:updated` 即时刷新座位
- **Toast**: 全局提示系统（4种类型，自动消失，毛玻璃效果）
- **竖屏提示**: 手机竖屏时全屏遮罩提示横屏使用

## 全局 Hook

### useSocket(roomId)
WebSocket 连接管理，自动鉴权和加入房间频道。

```js
const { emit, on, connected } = useSocket(room?.id);
emit("game:start");
on("game:deal", (data) => { ... });
```

### useToast()
全局 Toast 提示。

```js
const toast = useToast();
toast.success("加入成功");
toast.error("操作失败");
```

### useAuth()
认证上下文。

```js
const { token, user, login, register, logout } = useAuth();
```
