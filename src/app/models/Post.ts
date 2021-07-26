import { Model } from "./Model";

export interface Post extends Model {
    imageURL?: string;
    title?: string;
    text: string;
    createdAt: number;
    lastUpdatedAt: number;
    notifyUsers?: boolean;
    visible: boolean;
    likes: string[]
}