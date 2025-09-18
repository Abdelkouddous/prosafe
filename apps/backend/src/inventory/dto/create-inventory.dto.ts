import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDecimal, Min, isNumber } from 'class-validator';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  sku: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  min_stock_level: number;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;

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
