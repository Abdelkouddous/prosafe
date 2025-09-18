import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { Role } from '../users/enums/role.enum';
import { InventoryCategory } from './enums/inventory-category.enum';
import { InventoryStatus } from './enums/inventory-status.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto, @Req() req) {
    createInventoryDto['created_by_id'] = req.user.id;
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category?: InventoryCategory,
    @Query('status') status?: InventoryStatus,
  ) {
    return this.inventoryService.findAll(+page, +limit, category, status);
  }

  @Get('stats')
  async getStats() {
    return this.inventoryService.getInventoryStats();
  }

  @Get('low-stock')
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto, @Req() req) {
    updateInventoryDto.updated_by_id = req.user.id;
    return this.inventoryService.update(+id, updateInventoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    // Only admins can delete inventory items
    if (!req.user.roles.includes(Role.admin)) {
      throw new Error('Forbidden: Only admins can delete inventory items');
    }
    return this.inventoryService.remove(+id);
  }
}
