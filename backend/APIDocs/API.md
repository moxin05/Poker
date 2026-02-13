# Poker 服务端 API 文档

## 通用说明

### 基础地址

- 开发环境示例：`http://localhost:3001`（以实际 `PORT` 为准）

### 统一响应格式

- **成功**：HTTP 2xx，Body 为 `{ "code": 0, "data": <业务数据>, "msg": "success" }`
- **失败**：HTTP 4xx/5xx，Body 为 `{ "code": <状态码>, "data": null, "msg": "<错误说明>" }`

### 鉴权

- 需登录的接口：请求头携带 `Authorization: Bearer <token>`（登录/注册返回的 `token`）
- 未带或 token 无效：返回 401

---

## 1. 健康检查

### GET /health

无需鉴权。

**请求**：无参数

**成功响应**（200）

```json
{
  "code": 0,
  "data": { "ok": true },
  "msg": "success"
}
```

---

## 2. 认证 /api/auth

### POST /api/auth/register

注册。

**请求 Body（JSON）**

| 字段     | 类型   | 必填 | 说明                    |
|----------|--------|------|-------------------------|
| phone    | string | 是   | 11 位中国大陆手机号      |
| password | string | 是   | 密码，6～20 位          |

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "<userId>",
      "phone": "13800138000",
      "avatar": ""
    }
  },
  "msg": "success"
}
```

**错误**：手机号已注册等 → 4xx，body 中 `msg` 为具体说明。

---

### POST /api/auth/login

登录。

**请求 Body（JSON）**

| 字段     | 类型   | 必填 | 说明               |
|----------|--------|------|--------------------|
| phone    | string | 是   | 11 位手机号        |
| password | string | 是   | 密码，6～20 位     |

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "<userId>",
      "phone": "13800138000",
      "avatar": "<头像 URL 或 空字符串>"
    }
  },
  "msg": "success"
}
```

**错误**：手机号或密码错误等 → 401。

---

### GET /api/auth/me

获取当前登录用户信息。**需要鉴权。**

**请求**：无 Body，Header 带 `Authorization: Bearer <token>`

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "user": {
      "id": "<userId>",
      "phone": "138****8000",
      "avatar": "<头像 URL 或 空字符串>"
    }
  },
  "msg": "success"
}
```

---

## 3. 房间 /api/rooms

以下接口均**需要鉴权**，Header 带 `Authorization: Bearer <token>`。

### POST /api/rooms

创建房间。若当前用户已在某未结束房间中，直接返回该房间。

**请求 Body（JSON）**

| 字段        | 类型   | 必填 | 默认值 | 说明         |
|-------------|--------|------|--------|--------------|
| maxPlayers  | number | 否   | 8      | 2～8         |
| smallBlind  | number | 否   | 10     | 小盲注       |
| bigBlind    | number | 否   | 20     | 大盲注       |
| initialChips| number | 否   | 1000   | 初始筹码     |

**成功响应**（200 或 201）

```json
{
  "code": 0,
  "data": {
    "room": {
      "id": "<roomId>",
      "inviteCode": "<邀请码>",
      "hostId": "<房主 userId>",
      "status": "waiting | playing | finished",
      "maxPlayers": 8,
      "smallBlind": 10,
      "bigBlind": 20,
      "initialChips": 1000,
      "players": [
        {
          "id": "<userId>",
          "phone": "138****8000",
          "seatIndex": 0,
          "chips": 1000,
          "isOnline": true,
          "avatar": "<URL 或 空字符串>"
        }
      ],
      "createdAt": "<ISO 日期>"
    }
  },
  "msg": "success"
}
```

---

### GET /api/rooms/current

获取当前用户所在房间；若无则自动创建一个并返回。

**请求**：无 Body

**成功响应**（200）：同上，`data.room` 结构一致。

---

### GET /api/rooms/:roomId

获取指定房间详情。

**路径参数**

| 参数    | 类型   | 说明   |
|---------|--------|--------|
| roomId  | string | 房间 ID |

**成功响应**（200）：`data.room` 结构同上。

**错误**：房间不存在 → 404。

---

### POST /api/rooms/join

通过邀请码加入房间。

**请求 Body（JSON）**

| 字段       | 类型   | 必填 | 说明   |
|------------|--------|------|--------|
| inviteCode | string | 是   | 邀请码 |

**成功响应**（200）：`data.room` 结构同上。

**错误**：邀请码无效、房间已满、游戏进行中等 → 4xx。

---

### POST /api/rooms/:roomId/leave

退出指定房间。

**路径参数**

| 参数   | 类型   | 说明   |
|--------|--------|--------|
| roomId | string | 房间 ID |

**成功响应**（200）

```json
{
  "code": 0,
  "data": { "ok": true },
  "msg": "success"
}
```

**错误**：房间不存在、不在该房间等 → 4xx。

---

### GET /api/rooms/:roomId/invite

获取房间邀请信息（邀请码）。

**路径参数**

| 参数   | 类型   | 说明   |
|--------|--------|--------|
| roomId | string | 房间 ID |

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "inviteCode": "<邀请码>"
  },
  "msg": "success"
}
```

**错误**：房间不存在 → 404。

---

## 4. 用户 /api/user

以下接口均**需要鉴权**。

### POST /api/user/avatar

上传头像。表单字段名为 `avatar`，支持 jpg/png/webp/gif，单文件最大 5MB。

**请求**：`Content-Type: multipart/form-data`，字段 `avatar` 为图片文件

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "avatar": "/uploads/avatars/<filename>.webp"
  },
  "msg": "success"
}
```

**错误**：未选文件、格式不支持等 → 4xx。

---

### GET /api/user/profile

获取当前用户个人信息。

**请求**：无 Body

**成功响应**（200）

```json
{
  "code": 0,
  "data": {
    "user": {
      "id": "<userId>",
      "phone": "13800138000",
      "avatar": "<URL 或 空字符串>"
    }
  },
  "msg": "success"
}
```

**错误**：用户不存在等 → 4xx。

---

## 5. 静态资源

### GET /uploads/avatars/:filename

访问头像图片，无需鉴权。例如：`/uploads/avatars/xxx.webp`。

---

*文档根据当前后端代码整理，若有接口变更请同步更新此文档。*
