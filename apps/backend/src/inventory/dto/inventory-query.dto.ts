import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryCondition } from '../enums/inventory-condition.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class ListInventoryQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: InventoryCategory })
  @IsOptional()
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ enum: InventoryCondition })
  @IsOptional()
  @IsEnum(InventoryCondition)
  condition?: InventoryCondition;

  @ApiPropertyOptional({ description: 'Matches name, sku, location, supplier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class ReportDefectDto {
  @ApiProperty({ description: 'What is wrong with the equipment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
