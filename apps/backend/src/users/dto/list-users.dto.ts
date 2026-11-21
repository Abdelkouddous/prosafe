import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { Role } from '../enums/role.enum';

export class ListUsersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;
  @ApiPropertyOptional({ description: 'Matches first name, last name or email' }) @IsOptional() @IsString() @MaxLength(100) search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) department?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true')) @IsBoolean() isActive?: boolean;
}
