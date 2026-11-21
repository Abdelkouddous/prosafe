import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { InventoryCondition } from '../enums/inventory-condition.enum';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class UpdateInventoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock_level?: number;

  @ApiPropertyOptional({ enum: InventoryCategory })
  @IsOptional()
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: InventoryCondition })
  @IsOptional()
  @IsEnum(InventoryCondition)
  condition?: InventoryCondition;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Expiry date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastInspectionAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextInspectionAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updated_by_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;
}
