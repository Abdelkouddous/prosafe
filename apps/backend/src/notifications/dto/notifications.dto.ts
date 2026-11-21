import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Only unread notifications' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unread?: boolean;
}

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Expo push token, e.g. ExponentPushToken[xxx]' })
  @IsString()
  @MaxLength(255)
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsIn(['ios', 'android', 'web'])
  platform: string;
}

export class UpdatePreferencesDto {
  @ApiProperty() @IsBoolean() incidents: boolean;
  @ApiProperty() @IsBoolean() trainings: boolean;
  @ApiProperty() @IsBoolean() audits: boolean;
  @ApiProperty() @IsBoolean() inventory: boolean;
  @ApiProperty() @IsBoolean() emergency: boolean;
  @ApiProperty() @IsBoolean() messages: boolean;
  @ApiProperty() @IsBoolean() push: boolean;
  @ApiProperty() @IsBoolean() email: boolean;
}
