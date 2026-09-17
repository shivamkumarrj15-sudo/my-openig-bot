import { SessionStatusType } from '../../config/constants';

export interface ILoginCredentials {
  username: string;
  password?: string;
  cookies?: Record<string, string>;
  proxy?: string;
  verificationCode?: string;
  twoFactorIdentifier?: string;
}

export interface IAuthResult {
  success: boolean;
  status: SessionStatusType;
  userId?: string;
  username?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  challengeRequired?: boolean;
  challengeType?: '2fa' | 'email' | 'sms' | 'checkpoint';
  twoFactorIdentifier?: string;
  challengeUrl?: string;
  errorMessage?: string;
}

export interface IInstagramUserProfile {
  pk: string;
  username: string;
  fullName: string;
  isPrivate: boolean;
  isVerified: boolean;
  profilePicUrl: string;
  biography?: string;
  externalUrl?: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
}

export interface IInstagramThreadItem {
  itemId: string;
  userId: string;
  timestamp: string;
  itemType: 'text' | 'media' | 'voice_media' | 'like' | 'raven_media' | 'link';
  text?: string;
  mediaUrl?: string;
  reactions?: Array<{ userId: string; emoji: string }>;
  replyToMessageId?: string;
}

export interface IInstagramThread {
  threadId: string;
  threadTitle: string;
  isGroup: boolean;
  users: Array<{
    pk: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
  }>;
  lastActivityAt: string;
  unreadCount: number;
  items: IInstagramThreadItem[];
}

export interface IPublishPostOptions {
  type: 'feed' | 'carousel' | 'reel' | 'story';
  mediaUrls: string[];
  caption?: string;
  hashtags?: string[];
  location?: string;
  storyLink?: string;
  storyLinkText?: string;
}

export interface IPublishResult {
  success: boolean;
  mediaId?: string;
  code?: string;
  permalink?: string;
  errorMessage?: string;
}
