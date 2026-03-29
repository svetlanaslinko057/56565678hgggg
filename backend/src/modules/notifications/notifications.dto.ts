import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEnum, Min } from 'class-validator';
import { NotificationType, NotificationPayload, NotificationAction } from './notifications.schema';

export class CreateNotificationDto {
  @IsString()
  userWallet: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  payload?: NotificationPayload;

  @IsOptional()
  @IsArray()
  actions?: NotificationAction[];
}

export class GetNotificationsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}

export class MarkReadDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

export class NotificationResponse {
  id: string;
  userWallet: string;
  type: NotificationType;
  title: string;
  message: string;
  payload: NotificationPayload;
  actions: NotificationAction[];
  read: boolean;
  createdAt: Date;
}

export class UnreadCountResponse {
  count: number;
}

export class NotificationsListResponse {
  data: NotificationResponse[];
  nextCursor?: string;
  hasMore: boolean;
}
