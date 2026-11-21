import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { InventoryCategory } from './enums/inventory-category.enum';
import { InventoryStatus } from './enums/inventory-status.enum';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.ADMIN, Role.SST_MANAGER)
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateInventoryDto: UpdateInventoryDto, @Req() req) {
    updateInventoryDto.updated_by_id = req.user.id;
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.inventoryService.remove(id);
  }
}
