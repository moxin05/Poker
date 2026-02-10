# 德州扑克 — 前后端接口规范

> 基于当前前端页面功能梳理，后端需要实现以下 REST API + WebSocket 接口。

---

## 一、认证模块（已实现 ✅）

### `POST /api/auth/register`
注册新用户

**Request Body:**
```json
{ "phone": "13800138000", "password": "123456" }
```

**Response 200:**
```json
{
  "token": "eyJhbG...",
  "user": { "id": "xxx", "phone": "13800138000" }
}
```

**Error 409:** `PHONE_EXISTS` 手机号已注册

---

### `POST /api/auth/login`
用户登录

**Request Body:**
```json
{ "phone": "13800138000", "password": "123456" }
```

**Response 200:** 同 register

**Error 401:** `BAD_CREDENTIALS` 手机号或密码错误

---

### `GET /api/auth/me`
获取当前用户信息（需 Bearer Token）

**Response 200:**
```json
{ "user": { "id": "xxx", "phone": "13800138000" } }
```

---

## 二、房间模块（待实现）

### `POST /api/rooms`
创建房间

**Request Body:**
```json
{
  "maxPlayers": 8,
  "smallBlind": 10,
  "bigBlind": 20,
  "initialChips": 1000
}
```

**Response 201:**
```json
{
  "room": {
    "id": "room_abc123",
    "inviteCode": "POKER-X7K9M2",
    "hostId": "user_id",
    "maxPlayers": 8,
    "smallBlind": 10,
    "bigBlind": 20,
    "initialChips": 1000,
    "status": "waiting",
    "players": [
      { "id": "user_id", "phone": "138****8000", "chips": 1000, "seatIndex": 0 }
    ],
    "createdAt": "2026-02-11T..."
  }
}
```

---

### `GET /api/rooms/:roomId`
获取房间详情

**Response 200:**
```json
{
  "room": {
    "id": "room_abc123",
    "inviteCode": "POKER-X7K9M2",
    "hostId": "user_id",
    "status": "waiting | playing | finished",
    "maxPlayers": 8,
    "smallBlind": 10,
    "bigBlind": 20,
    "players": [
      { "id": "u1", "phone": "138****8000", "chips": 980, "seatIndex": 0, "isOnline": true },
      { "id": "u2", "phone": "139****9000", "chips": 1020, "seatIndex": 3, "isOnline": true }
    ]
  }
}
```

---

### `POST /api/rooms/join`
通过邀请码加入房间

**Request Body:**
```json
{ "inviteCode": "POKER-X7K9M2" }
```

**Response 200:**
```json
{ "room": { "id": "room_abc123", ... } }
```

**Error 404:** `ROOM_NOT_FOUND` 房间不存在
**Error 409:** `ROOM_FULL` 房间已满
**Error 409:** `ALREADY_IN_ROOM` 已在房间中

---

### `POST /api/rooms/:roomId/leave`
退出房间

**Response 200:**
```json
{ "ok": true }
```

---

### `GET /api/rooms/:roomId/invite`
获取/刷新邀请码

**Response 200:**
```json
{
  "inviteCode": "POKER-X7K9M2",
  "inviteLink": "https://domain.com/join?code=POKER-X7K9M2"
}
```

---

## 三、数据统计模块（待实现）

### `GET /api/stats/me`
获取当前用户的游戏统计

**Response 200:**
```json
{
  "stats": {
    "totalGames": 42,
    "wins": 15,
    "winRate": "35.7%",
    "totalEarnings": 3200,
    "biggestWin": 800,
    "currentStreak": 3
  }
}
```

---

## 四、游戏模块 — WebSocket（待实现）

> 游戏过程为实时交互，使用 WebSocket 通信。
>
> 连接地址: `ws://host:port/ws/room/:roomId?token=JWT_TOKEN`

### 4.1 客户端 → 服务端（玩家动作）

#### `game:start`
房主开始游戏
```json
{ "type": "game:start" }
```

#### `game:action`
玩家操作（过牌/跟注/弃牌/加注/全下）
```json
{
  "type": "game:action",
  "action": "check | call | fold | raise | allin",
  "amount": 100
}
```
- `check` — 过牌（无人下注时可用）
- `call` — 跟注（amount 可省略，自动跟当前最高注）
- `fold` — 弃牌
- `raise` — 加注（必须传 amount，>= minRaise）
- `allin` — 全下（amount 可省略，自动全押）

#### `game:leave`
退出牌局
```json
{ "type": "game:leave" }
```

---

### 4.2 服务端 → 客户端（游戏事件推送）

#### `room:updated`
房间信息变更（有人加入/离开）
```json
{
  "type": "room:updated",
  "room": { "players": [...], "status": "waiting" }
}
```

#### `game:started`
游戏开始
```json
{
  "type": "game:started",
  "game": {
    "roundId": "round_001",
    "dealerIndex": 0,
    "smallBlindIndex": 1,
    "bigBlindIndex": 2,
    "players": [
      { "id": "u1", "seatIndex": 0, "chips": 1000 },
      { "id": "u2", "seatIndex": 3, "chips": 1000 }
    ]
  }
}
```

#### `game:deal`
发手牌（仅发给当前玩家自己的牌，其他人不可见）
```json
{
  "type": "game:deal",
  "hand": [
    { "suit": "spade", "rank": 1 },
    { "suit": "heart", "rank": 13 }
  ]
}
```

#### `game:community`
公共牌翻牌（flop/turn/river）
```json
{
  "type": "game:community",
  "phase": "flop | turn | river",
  "cards": [
    { "suit": "heart", "rank": 1 },
    { "suit": "spade", "rank": 13 },
    { "suit": "diamond", "rank": 12 }
  ]
}
```

#### `game:turn`
轮到某玩家操作
```json
{
  "type": "game:turn",
  "playerId": "u1",
  "currentBet": 40,
  "minRaise": 20,
  "maxRaise": 980,
  "pot": 120,
  "canCheck": false,
  "timeLimit": 30
}
```

> 前端根据 `playerId === 自己` 来决定是否显示操作栏。
> `canCheck` 决定显示"过牌"还是"跟注"。
> `currentBet / minRaise / maxRaise / pot` 直接传给 ActionBar 组件。

#### `game:action_result`
某玩家的操作结果广播
```json
{
  "type": "game:action_result",
  "playerId": "u1",
  "action": "raise",
  "amount": 100,
  "playerChips": 880,
  "pot": 220
}
```

#### `game:round_end`
本轮结束，结算
```json
{
  "type": "game:round_end",
  "winners": [
    {
      "playerId": "u1",
      "amount": 220,
      "hand": [
        { "suit": "spade", "rank": 1 },
        { "suit": "heart", "rank": 13 }
      ],
      "handRank": "一对 A"
    }
  ],
  "players": [
    { "id": "u1", "chips": 1200 },
    { "id": "u2", "chips": 800 }
  ]
}
```

#### `game:error`
错误信息
```json
{
  "type": "game:error",
  "message": "不是你的回合",
  "code": "NOT_YOUR_TURN"
}
```

---

## 五、数据模型参考

### User
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | ObjectId | 用户 ID |
| phone | string | 手机号（唯一） |
| passwordHash | string | bcrypt 密码哈希 |
| createdAt | Date | 注册时间 |

### Room
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | ObjectId | 房间 ID |
| inviteCode | string | 6 位邀请码（唯一） |
| hostId | ObjectId | 房主 ID |
| status | string | waiting / playing / finished |
| maxPlayers | number | 最大人数 (2-8) |
| smallBlind | number | 小盲注 |
| bigBlind | number | 大盲注 |
| initialChips | number | 初始筹码 |
| players | Player[] | 玩家列表 |
| createdAt | Date | 创建时间 |

### Player (嵌套在 Room 中)
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId | 关联用户 |
| seatIndex | number | 座位号 (0-7) |
| chips | number | 当前筹码 |
| isOnline | boolean | 是否在线 |

### GameRound (可单独集合，也可嵌套)
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | ObjectId | 轮次 ID |
| roomId | ObjectId | 所属房间 |
| dealerIndex | number | 庄家座位 |
| communityCards | Card[] | 公共牌 (最多5张) |
| pot | number | 底池 |
| phase | string | preflop/flop/turn/river/showdown |
| currentTurn | ObjectId | 当前操作玩家 |
| actions | Action[] | 操作记录 |

### GameStats
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId | 用户 ID（唯一） |
| totalGames | number | 总场次 |
| wins | number | 胜场 |
| totalEarnings | number | 总盈利 |
| biggestWin | number | 最大单局盈利 |

---

## 六、接口优先级

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | 房间 CRUD | 创建/加入/退出房间，邀请码 |
| P0 | WebSocket 连接 | 房间实时通信基础 |
| P0 | 游戏核心 | 发牌、回合、玩家操作、结算 |
| P1 | 数据统计 | 记录胜负、展示统计 |
| P2 | 牌力判定 | 德扑牌型比较算法 |
