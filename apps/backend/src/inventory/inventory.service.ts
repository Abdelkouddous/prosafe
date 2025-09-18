import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryStatus } from './enums/inventory-status.enum';
import { InventoryCategory } from './enums/inventory-category.enum';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<InventoryItem> {
    const item = this.inventoryRepository.create(createInventoryDto);
    return this.inventoryRepository.save(item);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    category?: InventoryCategory,
    status?: InventoryStatus,
  ): Promise<{ items: InventoryItem[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.created_by', 'created_by')
      .leftJoinAndSelect('item.updated_by', 'updated_by')
      .orderBy('item.created_at', 'DESC');

    if (category) {
      queryBuilder.andWhere('item.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('item.status = :status', { status });
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<InventoryItem> {
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ['created_by', 'updated_by'],
    });
  }

  async update(id: number, updateInventoryDto: UpdateInventoryDto): Promise<InventoryItem> {
    const item = await this.findOne(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Auto-update status based on quantity
    if (updateInventoryDto.quantity !== undefined) {
      if (updateInventoryDto.quantity === 0) {
        updateInventoryDto.status = InventoryStatus.OUT_OF_STOCK;
      } else if (updateInventoryDto.quantity <= item.min_stock_level) {
        updateInventoryDto.status = InventoryStatus.LOW_STOCK;
      } else if (item.status === InventoryStatus.OUT_OF_STOCK || item.status === InventoryStatus.LOW_STOCK) {
        updateInventoryDto.status = InventoryStatus.ACTIVE;
      }
    }

    Object.assign(item, updateInventoryDto);
    return this.inventoryRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    await this.inventoryRepository.delete(id);
  }

  async getInventoryStats(): Promise<any> {
    const totalItems = await this.inventoryRepository.count();
    const lowStockItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.LOW_STOCK } });
    const outOfStockItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.OUT_OF_STOCK } });
    const activeItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.ACTIVE } });
  
    // Remove the totalValue calculation temporarily
    // const totalValue = await this.inventoryRepository
    //   .createQueryBuilder('item')
    //   .select('SUM(item.price * item.quantity)', 'total')
    //   .getRawOne();
  
    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      activeItems,
      totalValue: 0 // Temporary placeholder
    };
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      where: { status: InventoryStatus.LOW_STOCK },
      relations: ['created_by', 'updated_by'],
    });
  }
}
