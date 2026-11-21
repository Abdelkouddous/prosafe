import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDecimal, Min, isNumber } from 'class-validator';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class CreateInventoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  min_stock_level: number;

  @ApiProperty({ enum: InventoryCategory })
  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

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
  metadata?: any;
}

/**
 * the inventory class contains the following attributes :
 * - name: The name of the inventory item (string, required)
 * - description: Detailed description of the inventory item (string, required)
 * - quantity: Current quantity in stock (number, min: 0)
 * - min_stock_level: Minimum stock level before reorder (number, min: 0)
 * - category: Category of the inventory item (enum InventoryCategory)
 * - status: Current status of the inventory item (enum InventoryStatus, optional)
 * - supplier: Name of the supplier (string, optional)
 * - location: Storage location of the item (string, optional)
 * - metadata: Additional custom data (any, optional)
 */
