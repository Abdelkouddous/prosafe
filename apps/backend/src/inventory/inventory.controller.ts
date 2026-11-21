import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { ListInventoryQueryDto, ReportDefectDto } from './dto/inventory-query.dto';

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
  async findAll(@Query() query: ListInventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.inventoryService.getInventoryStats();
  }

  @Get('low-stock')
  async getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  @Post(':id/report-defect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Report a defective item: sets condition=non_functional and notifies managers' })
  async reportDefect(@Param('id', ParseIntPipe) id: number, @Body() dto: ReportDefectDto, @Req() req) {
    return this.inventoryService.reportDefect(id, dto.description, req.user.id);
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
