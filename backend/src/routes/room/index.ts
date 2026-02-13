import { Router } from "express";
import { z } from "zod";
import { RoomModel } from "../../models/Room";
import { UserModel } from "../../models/User";
import { requireAuth } from "../../middleware/auth";
import { badRequest, conflict, notFound } from "../../utils/httpErrors";
import { generateUniqueInviteCode } from "../../utils/inviteCode";
import { broadcastRoomUpdate } from "../../socket";
import * as ErrorConstants from "../../constants/errorConstants"

export const roomRouter = Router();
roomRouter.use(requireAuth);

roomRouter.get("/:roomId/invite", async (req, res, next) => {
    try {
        const room = await RoomModel.findById(req.params.roomId);
        if (!room) throw notFound(ErrorConstants.NOT_FOUND_ROOMID);

        res.success({
            inviteCode: room.inviteCode
        });
    } catch (e) {
        next(e);
    }
});

/*
座位与视觉：
- 牌桌的「位置」和「坐次」(seatIndex) 分离，方便前端换座只改展示、不改后端。
- 房主默认 0 号座位；换座仅视觉变化，不改变实际 seatIndex。

seatIndex 分配（后续实现）：
- 把 seatIndex 当成稳定座位号，有人离开也不重排。
- 新人分配：当前空出来的最小号，若无空位则 max + 1。房主固定 0，后来者依次占用 1,2,3…，中间有人走就出现空号。
- 游戏逻辑只认「在座的玩家列表」，不依赖 seatIndex 连续。
*/

/*
筹码与借入、清算（后续实现）：
- 初始筹码由系统「借」给玩家，每人开局借入 1000，即初始负债 1000（净头寸 -1000）；手持 1000、欠 1000，净收益为 0。
- 输光后可向系统再借，借入累计；离桌或局终时：净收益 = 当前筹码 − 本局总借入。净收益 ≥ 0 为盈利，< 0 为负债，在清算时处理。
- 带 1000 离桌且未再借：借入 1000、手持 1000 → 净收益 0，不算盈利 1000。
*/
roomRouter.get("/current", async (req, res, next) => {
    try {
        const { userId, phone } = req.auth!;
        const inviteCode = await generateUniqueInviteCode();
        let room = await RoomModel.create({
            inviteCode,
            hostId: userId,
            players: [
                {
                    userId,
                    phone,
                    seatIndex: 0,
                    chips: 0
                }
            ]
        });
    } catch (error) {
        next(error);
    }

    try {
    const { userId, phone } = req.auth!;
    const inviteCode = await generateUniqueInviteCode();
    let room = await RoomModel.create({
    inviteCode,
    hostId: userId,
    players: [
        {
        userId,
        phone,
        seatIndex: 5,
        chips: 1000,
        isOnline: true,
        },
    ],
    });

    res.success({ room: await formatRoom(room) });
  } catch (e) {
    next(e);
  }
});