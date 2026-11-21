import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ListInventoryQueryDto } from './dto/inventory-query.dto';
import { InventoryStatus } from './enums/inventory-status.enum';
import { InventoryCondition } from './enums/inventory-condition.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { MANAGER_ROLES } from '../users/enums/role.enum';

/** Days before expiry at which managers are warned. */
export const EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Status derived from quantity vs minimum level; keeps manual statuses (inactive, discontinued) otherwise. */
  private computeStatus(quantity: number, minStock: number, current?: InventoryStatus): InventoryStatus {
    if (quantity === 0) return InventoryStatus.OUT_OF_STOCK;
    if (quantity <= minStock) return InventoryStatus.LOW_STOCK;
    if (!current || current === InventoryStatus.OUT_OF_STOCK || current === InventoryStatus.LOW_STOCK) return InventoryStatus.ACTIVE;
    return current;
  }

  private async notifyStock(item: InventoryItem): Promise<void> {
    const out = item.status === InventoryStatus.OUT_OF_STOCK;
    await this.notifications.notifyRoles(MANAGER_ROLES, {
      type: NotificationType.INVENTORY,
      title: out ? 'Rupture de stock' : 'Stock bas',
      body: out
        ? `${item.name} est en rupture de stock.`
        : `${item.name} est en stock bas (${item.quantity} restant(s), minimum ${item.min_stock_level}).`,
      data: { key: `stock:${item.id}:${item.status}`, itemId: item.id, status: item.status },
    });
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<InventoryItem> {
    const item = this.inventoryRepository.create(createInventoryDto as unknown as Partial<InventoryItem>);
    item.status = this.computeStatus(item.quantity, item.min_stock_level, createInventoryDto.status);
    const saved = await this.inventoryRepository.save(item);
    if (saved.status === InventoryStatus.LOW_STOCK || saved.status === InventoryStatus.OUT_OF_STOCK) await this.notifyStock(saved);
    return saved;
  }

  async findAll(q: ListInventoryQueryDto = {}) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('item')
      .leftJoin('item.created_by', 'created_by')
      .addSelect(['created_by.id', 'created_by.firstName', 'created_by.lastName'])
      .leftJoin('item.updated_by', 'updated_by')
      .addSelect(['updated_by.id', 'updated_by.firstName', 'updated_by.lastName'])
      .orderBy('item.created_at', 'DESC')
      .addOrderBy('item.id', 'DESC');

    if (q.category) queryBuilder.andWhere('item.category = :category', { category: q.category });
    if (q.status) queryBuilder.andWhere('item.status = :status', { status: q.status });
    if (q.condition) queryBuilder.andWhere('item.condition = :condition', { condition: q.condition });
    if (q.search?.trim()) {
      const term = `%${q.search.trim().replace(/[%_\\]/g, '\\$&')}%`;
      queryBuilder.andWhere(
        '(item.name ILIKE :term OR item.sku ILIKE :term OR item.location ILIKE :term OR item.supplier ILIKE :term)',
        { term },
      );
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // `items`/`totalPages` kept for existing clients; `data`/`limit` follow the shared list contract.
    return { data: items, items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
      throw new NotFoundException('Inventory item not found');
    }
    const previousStatus = item.status;
    const dto = { ...updateInventoryDto };

    // Auto-update status based on quantity / minimum level
    if (dto.quantity !== undefined || dto.min_stock_level !== undefined) {
      dto.status = this.computeStatus(
        dto.quantity ?? item.quantity,
        dto.min_stock_level ?? item.min_stock_level,
        dto.status ?? item.status,
      );
    }

    Object.assign(item, dto);
    const saved = await this.inventoryRepository.save(item);

    const lowNow = saved.status === InventoryStatus.LOW_STOCK || saved.status === InventoryStatus.OUT_OF_STOCK;
    if (lowNow && saved.status !== previousStatus) await this.notifyStock(saved);
    return saved;
  }

  async remove(id: number): Promise<void> {
    await this.inventoryRepository.delete(id);
  }

  /** Any authenticated user reports a faulty item: marks it non functional and alerts managers. */
  async reportDefect(id: number, description: string, reporterId: number): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');
    item.condition = InventoryCondition.NON_FUNCTIONAL;
    const saved = await this.inventoryRepository.save(item);
    await this.notifications.notifyRoles(MANAGER_ROLES, {
      type: NotificationType.INVENTORY,
      title: 'Equipement defectueux signale',
      body: `${item.name} : ${description}`,
      data: { key: `defect:${item.id}:${Date.now()}`, itemId: item.id, reportedById: reporterId },
      priority: 'high',
    });
    return saved;
  }

  async getInventoryStats(): Promise<any> {
    const totalItems = await this.inventoryRepository.count();
    const lowStockItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.LOW_STOCK } });
    const outOfStockItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.OUT_OF_STOCK } });
    const activeItems = await this.inventoryRepository.count({ where: { status: InventoryStatus.ACTIVE } });
    const nonFunctionalItems = await this.inventoryRepository.count({ where: { condition: InventoryCondition.NON_FUNCTIONAL } });

    const raw = await this.inventoryRepository
      .createQueryBuilder('item')
      .select('COALESCE(SUM(item.price * item.quantity), 0)', 'total')
      .getRawOne<{ total: string }>();

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      activeItems,
      nonFunctionalItems,
      totalValue: Number(raw?.total ?? 0),
    };
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      where: { status: InventoryStatus.LOW_STOCK },
      relations: ['created_by', 'updated_by'],
    });
  }

  // ---------- Scheduled job (daily 07:00 Africa/Algiers) ----------

  @Cron('0 7 * * *', { name: 'inventory-daily-checks', timeZone: 'Africa/Algiers' })
  async runDailyChecks(): Promise<{ stock: number; expiry: number }> {
    try {
      const stock = await this.notifyLowStock();
      const expiry = await this.notifyExpiring();
      return { stock, expiry };
    } catch (err) {
      this.logger.error(`inventory daily checks failed: ${(err as Error).message}`);
      return { stock: 0, expiry: 0 };
    }
  }

  /** Managers are warned about low / out-of-stock items (deduplicated over 24h). */
  async notifyLowStock(): Promise<number> {
    const items = await this.inventoryRepository.find({
      where: [{ status: InventoryStatus.LOW_STOCK }, { status: InventoryStatus.OUT_OF_STOCK }],
    });
    for (const item of items) {
      const out = item.status === InventoryStatus.OUT_OF_STOCK;
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.INVENTORY,
        title: out ? 'Rupture de stock' : 'Stock bas',
        body: out ? `${item.name} est en rupture de stock.` : `${item.name} est en stock bas (${item.quantity}/${item.min_stock_level}).`,
        data: { key: `stock:${item.id}:${item.status}`, itemId: item.id, status: item.status },
      });
    }
    return items.length;
  }

  /** Managers are warned about items expiring within 30 days (or already expired). */
  async notifyExpiring(now = new Date()): Promise<number> {
    const limit = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 86_400_000).toISOString().slice(0, 10);
    const items = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.expiryDate IS NOT NULL')
      .andWhere('item.expiryDate <= :limit', { limit })
      .andWhere('item.status != :disc', { disc: InventoryStatus.DISCONTINUED })
      .getMany();
    const today = now.toISOString().slice(0, 10);
    for (const item of items) {
      const expired = String(item.expiryDate) < today;
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.INVENTORY,
        title: expired ? 'Equipement expire' : 'Expiration proche',
        body: expired ? `${item.name} a expire le ${item.expiryDate}.` : `${item.name} expire le ${item.expiryDate}.`,
        data: { key: `expiry:${item.id}:${item.expiryDate}`, itemId: item.id, expiryDate: item.expiryDate },
      });
    }
    return items.length;
  }
}
