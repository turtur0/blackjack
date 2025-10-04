// models/GameHistory.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface IGameHistory extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  date: Date;
  bet: number;
  playerScore: number;
  dealerScore: number;
  result: 'win' | 'loss' | 'push' | 'blackjack';
  chipsWon: number;
  chipsAfter: number;
}

const GameHistorySchema = new Schema<IGameHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  bet: {
    type: Number,
    required: true,
    min: 0,
  },
  playerScore: {
    type: Number,
    required: true,
    min: 0,
    max: 21,
  },
  dealerScore: {
    type: Number,
    required: true,
    min: 0,
    max: 21,
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'push', 'blackjack'],
    required: true,
  },
  chipsWon: {
    type: Number,
    required: true,
  },
  chipsAfter: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Index for efficient querying
GameHistorySchema.index({ userId: 1, date: -1 });

const GameHistory = models.GameHistory || model<IGameHistory>('GameHistory', GameHistorySchema);

export default GameHistory;