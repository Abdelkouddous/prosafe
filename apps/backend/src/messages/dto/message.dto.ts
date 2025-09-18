import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { MessageStatus } from '../enums/message-status.enum';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  sender_id: number;

  @IsOptional()
  recipient_id?: number;

  @IsOptional()
  @IsBoolean()
  send_to_all?: boolean;

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}

export class AdminMessageDTO {
  @IsString()
  @IsNotEmpty()
  message: string;
}
