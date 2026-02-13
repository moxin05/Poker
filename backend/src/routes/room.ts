import { Router } from "express";
import { z } from "zod";
import { RoomModel } from "../models/Room";
import { UserModel } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { badRequest, conflict, notFound } from "../utils/httpErrors";
import { generateUniqueInviteCode } from "../utils/inviteCode";
import { broadcastRoomUpdate } from "../socket";

export const roomRouter = Router();
roomRouter.use(requireAuth);

/* ------------------------------------------------
   辅助：格式化房间返回数据（含玩家头像）
   ------------------------------------------------ */
async function formatRoom(room: any) {
  // 批量查玩家头像
  const userIds = room.players.map((p: any) => p.userId);
  const users = await UserModel.find({ _id: { $in: userIds } }).lean();
  const avatarMap = new Map(users.map((u) => [u._id.toString(), u.avatar || ""]));

  return {
    id: room._id.toString(),
    inviteCode: room.inviteCode,
    hostId: room.hostId.toString(),
    status: room.status,
    maxPlayers: room.maxPlayers,
    smallBlind: room.smallBlind,
    bigBlind: room.bigBlind,
    initialChips: room.initialChips,
    players: room.players.map((p: any) => ({
      id: p.userId.toString(),
      phone: p.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
      seatIndex: p.seatIndex,
      chips: p.chips,
      isOnline: p.isOnline,
      avatar: avatarMap.get(p.userId.toString()) || "",
    })),
    createdAt: room.createdAt,
  };
}

/* ------------------------------------------------
   辅助：找到第一个空座位（顺时针从 0 开始）
   ------------------------------------------------ */
function findEmptySeat(players: any[], maxPlayers: number): number {
  const occupied = new Set(players.map((p: any) => p.seatIndex));
  // 按顺序 0,1,2,3,4,5,6,7 找空位
  for (let i = 0; i < maxPlayers; i++) {
    if (!occupied.has(i)) return i;
  }
  return -1;
}

/* ------------------------------------------------
   GET /api/rooms/current — 获取当前所在房间
   如果没有则自动创建一个
   ------------------------------------------------ */
roomRouter.get("/current", async (req, res, next) => {
  try {
    const { userId, phone } = req.auth!;

    // 找用户当前所在的未结束房间
    let room = await RoomModel.findOne({
      "players.userId": userId,
      status: { $ne: "finished" },
    });

    // 没有则自动创建
    if (!room) {
      const inviteCode = await generateUniqueInviteCode();
      room = await RoomModel.create({
        inviteCode,
        hostId: userId,
        players: [
          {
            userId,
            phone,
            seatIndex: 5, // 下方居中
            chips: 1000,
            isOnline: true,
          },
        ],
      });
    }

    res.success({ room: await formatRoom(room) });
  } catch (e) {
    next(e);
  }
});

/* ------------------------------------------------
   GET /api/rooms/:roomId — 获取房间详情
   ------------------------------------------------ */
roomRouter.get("/:roomId", async (req, res, next) => {
  try {
    const room = await RoomModel.findById(req.params.roomId);
    if (!room) throw notFound("房间不存在", "ROOM_NOT_FOUND");
    res.success({ room: await formatRoom(room) });
  } catch (e) {
    next(e);
  }
});

/* ------------------------------------------------
   POST /api/rooms/join — 通过邀请码加入房间
   ------------------------------------------------ */
const JoinSchema = z.object({
  inviteCode: z.string().trim().min(1, "请输入邀请码"),
});

roomRouter.post("/join", async (req, res, next) => {
  try {
    const { userId, phone } = req.auth!;
    const { inviteCode } = JoinSchema.parse(req.body);

    const room = await RoomModel.findOne({
      inviteCode: inviteCode.toUpperCase(),
    });
    if (!room) throw notFound("邀请码无效或房间不存在", "ROOM_NOT_FOUND");

    // 已在这个房间
    const alreadyIn = room.players.some(
      (p) => p.userId.toString() === userId
    );
    if (alreadyIn) {
      return res.success({ room: await formatRoom(room) });
    }

    // 房间已满
    if (room.players.length >= room.maxPlayers) {
      throw conflict("房间已满", "ROOM_FULL");
    }

    // 游戏进行中不能加入
    if (room.status === "playing") {
      throw conflict("游戏进行中，无法加入", "GAME_IN_PROGRESS");
    }

    // 先离开当前房间（如果在其他房间）
    await RoomModel.updateMany(
      { "players.userId": userId, _id: { $ne: room._id }, status: { $ne: "finished" } },
      { $pull: { players: { userId } } }
    );

    // 分配座位
    const seatIndex = findEmptySeat(room.players, room.maxPlayers);
    if (seatIndex === -1) throw conflict("没有空座位", "ROOM_FULL");

    room.players.push({
      userId: userId as any,
      phone,
      seatIndex,
      chips: room.initialChips,
      isOnline: true,
    });
    await room.save();

    // 广播给房间内所有在线玩家
    broadcastRoomUpdate(room._id.toString()).catch(() => {});

    res.success({ room: await formatRoom(room) });
  } catch (e) {
    next(e);
  }
});

/* ------------------------------------------------
   POST /api/rooms/:roomId/leave — 退出房间
   ------------------------------------------------ */
roomRouter.post("/:roomId/leave", async (req, res, next) => {
  try {
    const { userId } = req.auth!;

    const room = await RoomModel.findById(req.params.roomId);
    if (!room) throw notFound("房间不存在", "ROOM_NOT_FOUND");

    const playerIndex = room.players.findIndex(
      (p) => p.userId.toString() === userId
    );
    if (playerIndex === -1) {
      throw badRequest("你不在这个房间中", "NOT_IN_ROOM");
    }

    room.players.splice(playerIndex, 1);

    // 如果房间空了就标记结束
    if (room.players.length === 0) {
      room.status = "finished";
    } else if (room.hostId.toString() === userId) {
      // 房主继承：按 seatIndex 顺位给下一个人
      const sorted = [...room.players].sort((a, b) => a.seatIndex - b.seatIndex);
      room.hostId = sorted[0].userId;
    }

    await room.save();

    // 广播给剩余玩家
    if (room.players.length > 0) {
      broadcastRoomUpdate(room._id.toString()).catch(() => {});
    }

    res.success({ ok: true });
  } catch (e) {
    next(e);
  }
});