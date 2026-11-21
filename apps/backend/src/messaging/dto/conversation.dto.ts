import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';

export class CreateConversationDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) subject: string;
  @ApiProperty({ description: 'First message' }) @IsString() @IsNotEmpty() @MaxLength(5000) body: string;
  @ApiPropertyOptional({ description: 'Required for managers. Employees may omit it (all SST managers are added) or target a manager.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  recipientId?: number;
}

export class SendMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(5000) body: string;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number = 50;
}

export class ListConversationsQueryDto extends PageQueryDto {}
