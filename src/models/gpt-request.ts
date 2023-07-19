import { Schema, Document, model } from 'mongoose';
import { USER_LANGUAGES } from './user.js';

export type GPTRequestStatus = 'waiting' | 'done' | 'rejected';

export interface IGPTRequest extends Document {
  user: number;
  language: string;
  requestDate: Date;
  answerDate?: Date;
  status: GPTRequestStatus;
  question: string;
  answer?: string;
}

const GPTRequestSchema = new Schema<IGPTRequest>({
  user: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: Object.values(USER_LANGUAGES)
  },
  requestDate: {
    type: Date,
    default: () => new Date()
  },
  answerDate: Date,
  status: {
    type: String,
    required: true,
    default: 'waiting',
    enum: ['waiting', 'done', 'rejected']
  },
  question: {
    type: String,
    required: true
  },
  answer: String
});

const GPTRequest = model('gpt-requests', GPTRequestSchema);
export default GPTRequest;
