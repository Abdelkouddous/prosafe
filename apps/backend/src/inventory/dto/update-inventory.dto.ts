import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock_level?: number;

  @IsOptional()
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  updated_by_id?: number;

  @IsOptional()
  metadata?: any;
}
