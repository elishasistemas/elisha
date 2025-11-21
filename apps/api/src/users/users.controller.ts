import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    @Get(':id/roles')
    @ApiOperation({ summary: 'Obter roles e active_role do usuário' })
    async getUserRoles(@Param('id') id: string, @Req() request: any) {
      const token = request.user?.access_token
      return this.usersService.getUserRoles(id, token);
    }
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter dados do usuário atual' })
  async getCurrentUser(@Req() req) {
    const token = req.user?.access_token
    return this.usersService.getCurrentUser(req.user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter dados de um usuário específico' })
  async getUser(@Param('id') id: string, @Req() request: any) {
    const token = request.user?.access_token
    return this.usersService.getUser(id, token);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  async getAllUsers(@Req() request: any) {
    const token = request.user?.access_token
    return this.usersService.getAllUsers(token);
  }
}