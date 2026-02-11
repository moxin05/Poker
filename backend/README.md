# 德州扑克 — 后端

Node.js + TypeScript + Express + MongoDB + Socket.IO

## 快速启动

```bash
# 安装依赖
npm install

# 配置环境变量（参考 .env.example）
cp .env.example .env

# 开发模式（热重载）
npm run dev

# 编译
npm run build

# 生产运行
npm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 3001 |
| `MONGODB_URI` | MongoDB 连接串 | — |
| `JWT_SECRET` | JWT 签名密钥（≥16位） | — |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 7d |
| `BCRYPT_SALT_ROUNDS` | bcrypt 加盐轮数 | 10 |
| `CORS_ORIGIN` | 允许的前端源 | http://localhost:5173 |

## 项目结构

```
src/
├── index.ts                 # 入口：HTTP + WebSocket 服务器
├── app.ts                   # Express 应用（路由、中间件）
├── config/
│   └── env.ts               # 环境变量 Zod 校验
├── db/
│   └── mongoose.ts          # MongoDB 连接
├── models/
│   ├── User.ts              # 用户模型（手机号、密码、头像、tokenVersion）
│   └── Room.ts              # 房间模型（邀请码、玩家列表、盲注配置）
├── routes/
│   ├── auth.ts              # 认证：注册 / 登录 / 获取当前用户
│   ├── room.ts              # 房间：创建 / 加入 / 退出 / 邀请码
│   └── user.ts              # 用户：头像上传 / 个人信息
├── socket/
│   ├── index.ts             # Socket.IO 入口（鉴权、房间频道、事件路由）
│   ├── GameManager.ts       # 德扑游戏状态机（发牌、下注轮次、结算）
│   └── Deck.ts              # 扑克牌堆（洗牌 / 发牌）
├── middleware/
│   ├── auth.ts              # JWT 鉴权 + tokenVersion 唯一登录校验
│   └── errorHandler.ts      # 统一错误处理
├── utils/
│   ├── jwt.ts               # JWT 签发 / 验证
│   ├── password.ts          # bcrypt 密码哈希
│   ├── httpErrors.ts        # HTTP 错误工厂
│   └── inviteCode.ts        # 6位邀请码生成（唯一性保证）
└── types/
    └── express.d.ts         # Express Request 类型扩展
```

## REST API

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 手机号注册 |
| POST | `/api/auth/login` | 登录（递增 tokenVersion，旧 token 失效） |
| GET | `/api/auth/me` | 获取当前用户（需 Bearer Token） |

### 房间
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/rooms` | 创建房间 |
| GET | `/api/rooms/current` | 获取当前房间（无则自动创建） |
| GET | `/api/rooms/:id` | 获取房间详情 |
| POST | `/api/rooms/join` | 通过邀请码加入房间 |
| POST | `/api/rooms/:id/leave` | 退出房间 |
| GET | `/api/rooms/:id/invite` | 获取邀请码 |

### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/avatar` | 上传头像（multipart，sharp 压缩为 256×256 webp） |
| GET | `/api/user/profile` | 获取个人信息 |

### 静态资源
| 路径 | 说明 |
|------|------|
| `/uploads/avatars/*` | 用户头像文件 |

## WebSocket

连接路径: `/ws`，鉴权: `auth.token = JWT`

### 客户端 → 服务端
| 事件 | 说明 |
|------|------|
| `room:join` | 加入房间频道 |
| `game:start` | 房主开始游戏 |
| `game:action` | 玩家操作（check/call/fold/raise/allin） |

### 服务端 → 客户端
| 事件 | 说明 |
|------|------|
| `room:updated` | 房间信息变更（加入/退出/断线） |
| `game:started` | 游戏开始（庄位/盲注位） |
| `game:deal` | 发手牌（私发，仅本人可见） |
| `game:community` | 翻公共牌（flop/turn/river） |
| `game:turn` | 轮到某玩家操作 |
| `game:action_result` | 操作结果广播 |
| `game:showdown` | 摊牌（公开所有手牌） |
| `game:round_end` | 本轮结算 |
| `game:error` | 错误提示 |
| `kicked` | 唯一登录：被新登录踢下线 |

## 核心机制

- **唯一登录**: User.tokenVersion 每次登录递增，JWT 携带 ver，中间件校验匹配
- **房主继承**: 房主退出/断线 → 按 seatIndex 顺位转移给下一位
- **邀请码**: 6位大写字母数字（去除 I/O/0/1），数据库唯一索引
- **头像**: multer 接收 → sharp 压缩为 256×256 webp → 存 uploads/avatars/
