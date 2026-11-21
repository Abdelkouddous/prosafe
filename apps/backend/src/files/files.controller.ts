import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Streams a stored file with its Content-Type.
   * Access policy: any authenticated user may read a file by id. File ids are sequential, but they are only
   * obtainable through parent resources (incident media...) which are themselves access controlled;
   * per-parent checks can be added here later.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Stream a stored file (any authenticated user)' })
  async stream(@Param('id', ParseIntPipe) id: number) {
    const { stream } = await this.filesService.getStream(id);
    return stream;
  }
}
