import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { MessageStatus } from '../enums/message-status.enum';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sender_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  recipient_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  send_to_all?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  system_sender?: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: MessageStatus })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}

export class AdminMessageDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
