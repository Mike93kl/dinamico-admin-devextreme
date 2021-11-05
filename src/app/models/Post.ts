import { Model } from "./Model";

export type PostType = 'event' | 'post';

export class PostEventSubscribers {
    clientId: string;
    fullName: string;
    phone: string;
    email: string;
}

export interface Post extends Model {
    imagePath?: string;
    imageURL?: string;
    title?: string;
    text: string;
    notifyUsers?: boolean;
    visible: boolean;
    likes: string[];
    numberOfViewers?: string[];
    postType?: PostType;
    eventSubscribers?: PostEventSubscribers[];
    postImmediately: boolean;
    notifyAt_ts?: number;
    postedAt_ts?: number;
    isEvent?: boolean;
}