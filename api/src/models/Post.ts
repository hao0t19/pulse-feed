import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const reactionCountsSchema = new Schema(
  {
    like: { type: Number, default: 0, min: 0 },
    comment: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    title: { type: String, maxlength: 200 },
    body: { type: String, required: true, maxlength: 8000 },
    tags: { type: [String], default: [], index: true },
    postType: { type: String, enum: ['text', 'link'], default: 'text' },
    /** Optional payload — e.g. link preview fields for `link` posts. */
    extras: { type: Schema.Types.Mixed, default: {} },
    reactionCounts: { type: reactionCountsSchema, default: () => ({}) },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'posts',
  },
);

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Post = mongoose.model('Post', postSchema);
