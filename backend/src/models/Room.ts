import mongoose, { type InferSchemaType } from "mongoose";

/* ------------------------------------------------
   Player 子文档
   ------------------------------------------------ */
const PlayerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true },
    seatIndex: { type: Number, required: true },
    chips: { type: Number, required: true },
    isOnline: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ------------------------------------------------
   Room 主文档
   ------------------------------------------------ */
const RoomSchema = new mongoose.Schema(
  {
    inviteCode: { type: String, required: true, unique: true, index: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    maxPlayers: { type: Number, default: 8, min: 2, max: 8 },
    smallBlind: { type: Number, default: 10 },
    bigBlind: { type: Number, default: 20 },
    initialChips: { type: Number, default: 1000 },
    players: { type: [PlayerSchema], default: [] },
  },
  { timestamps: true }
);

export type PlayerDoc = InferSchemaType<typeof PlayerSchema>;

export type RoomDoc = InferSchemaType<typeof RoomSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RoomModel =
  (mongoose.models.Room as mongoose.Model<RoomDoc>) ||
  mongoose.model<RoomDoc>("Room", RoomSchema);
