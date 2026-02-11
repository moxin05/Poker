import http from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { UserModel } from "../models/User";
import { RoomModel } from "../models/Room";
import { env } from "../config/env";
import { GameManager } from "./GameManager";

const games = new Map<string, GameManager>();

/** 全局 io 实例，供 REST 路由调用广播 */
let _io: Server | null = null;
export function getIO(): Server {
  if (!_io) throw new Error("Socket.IO not initialized");
  return _io;
}

/** 广播房间更新给房间内所有人 */
export async function broadcastRoomUpdate(roomId: string) {
  const io = getIO();
  const room = await RoomModel.findById(roomId);
  if (!room) return;

  const userIds = room.players.map((p: any) => p.userId);
  const users = await UserModel.find({ _id: { $in: userIds } }).lean();
  const avatarMap = new Map(users.map((u) => [u._id.toString(), u.avatar || ""]));

  const players = room.players.map((p: any) => ({
    id: p.userId.toString(),
    phone: p.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
    seatIndex: p.seatIndex,
    chips: p.chips,
    isOnline: p.isOnline,
    avatar: avatarMap.get(p.userId.toString()) || "",
  }));

  io.to(roomId).emit("room:updated", {
    id: room._id.toString(),
    inviteCode: room.inviteCode,
    hostId: room.hostId.toString(),
    status: room.status,
    maxPlayers: room.maxPlayers,
    smallBlind: room.smallBlind,
    bigBlind: room.bigBlind,
    initialChips: room.initialChips,
    players,
    createdAt: room.createdAt,
  });
}

export function setupSocket(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    path: "/ws",
  });
  _io = io;

  // JWT 鉴权
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("缺少 token"));
      const payload = verifyAccessToken(token);
      const user = await UserModel.findById(payload.sub).lean();
      if (!user) return next(new Error("用户不存在"));
      if (payload.ver !== (user.tokenVersion ?? 0)) return next(new Error("登录已失效"));
      socket.data.userId = payload.sub;
      socket.data.phone = user.phone;
      socket.data.avatar = user.avatar || "";
      next();
    } catch {
      next(new Error("认证失败"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    console.log(`[ws] connected: ${userId}`);

    /* 唯一性登录：踢掉同一用户的旧连接 */
    for (const [sid, s] of io.sockets.sockets) {
      if (s.data.userId === userId && sid !== socket.id) {
        s.emit("kicked", { message: "你的账号在其他地方登录" });
        s.disconnect(true);
        console.log(`[ws] kicked old socket ${sid} for user ${userId}`);
      }
    }

    /* 加入房间频道 */
    socket.on("room:join", async (roomId: string) => {
      const room = await RoomModel.findById(roomId);
      if (!room) return socket.emit("error", { message: "房间不存在" });

      const inRoom = room.players.some((p) => p.userId.toString() === userId);
      if (!inRoom) return socket.emit("error", { message: "你不在这个房间" });

      // 离开之前的房间频道
      for (const r of socket.rooms) {
        if (r !== socket.id) socket.leave(r);
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      console.log(`[ws] ${userId} joined room ${roomId}`);
    });

    /* 开始游戏 */
    socket.on("game:start", async () => {
      const roomId = socket.data.roomId as string;
      if (!roomId) return socket.emit("game:error", { message: "未加入房间" });

      const room = await RoomModel.findById(roomId);
      if (!room) return socket.emit("game:error", { message: "房间不存在" });

      if (room.hostId.toString() !== userId) {
        return socket.emit("game:error", { message: "只有房主可以开始游戏" });
      }
      if (room.players.length < 2) {
        return socket.emit("game:error", { message: "至少需要 2 名玩家" });
      }

      let gm = games.get(roomId);
      if (gm && gm.isActive()) {
        return socket.emit("game:error", { message: "游戏已在进行中" });
      }

      room.status = "playing";
      await room.save();

      gm = new GameManager(roomId, room.players, {
        smallBlind: room.smallBlind,
        bigBlind: room.bigBlind,
      });
      games.set(roomId, gm);
      gm.startRound(io);
    });

    /* 玩家操作 */
    socket.on("game:action", async (data: { action: string; amount?: number }) => {
      const roomId = socket.data.roomId as string;
      if (!roomId) return socket.emit("game:error", { message: "未加入房间" });

      const gm = games.get(roomId);
      if (!gm || !gm.isActive()) {
        return socket.emit("game:error", { message: "游戏未开始" });
      }

      const result = gm.handleAction(userId, data.action, data.amount);
      if (result.error) {
        return socket.emit("game:error", { message: result.error });
      }

      io.to(roomId).emit("game:action_result", result.broadcast);

      if (result.nextPhase) {
        gm.advancePhase(io);
      }

      if (result.roundEnd) {
        io.to(roomId).emit("game:round_end", result.roundEnd);
        await RoomModel.findByIdAndUpdate(roomId, { status: "waiting" });
        games.delete(roomId);
      }
    });

    /* 断开连接 — 移除玩家 + 房主继承 */
    socket.on("disconnect", async () => {
      console.log(`[ws] disconnected: ${userId}`);
      const roomId = socket.data.roomId as string;
      if (!roomId) return;

      try {
        const room = await RoomModel.findById(roomId);
        if (!room) return;

        const idx = room.players.findIndex((p) => p.userId.toString() === userId);
        if (idx === -1) return;

        room.players.splice(idx, 1);

        if (room.players.length === 0) {
          room.status = "finished";
        } else if (room.hostId.toString() === userId) {
          // 房主继承：按 seatIndex 顺位给下一个人
          const sorted = [...room.players].sort((a, b) => a.seatIndex - b.seatIndex);
          room.hostId = sorted[0].userId;
          console.log(`[ws] host transferred to ${sorted[0].userId} (seat ${sorted[0].seatIndex})`);
        }

        await room.save();

        if (room.players.length > 0) {
          broadcastRoomUpdate(roomId);
        }
      } catch (err) {
        console.error("[ws] disconnect cleanup error:", err);
      }
    });
  });
}
