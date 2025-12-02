import { Controller, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Req() req: any) {
    const userId = req.user?.userId;
    const token = req.user?.access_token;
    return this.profilesService.getProfileByUserId(userId, token);
  }

  @Get(':userId')
  async getProfile(@Param('userId') userId: string, @Req() req: any) {
    const token = req.user?.access_token;
    return this.profilesService.getProfileByUserId(userId, token);
  }

  @Patch(':userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updates: any,
    @Req() req: any,
  ) {
    // Validar que o usuário só pode atualizar seu próprio profile (ou ser admin)
    const requestUserId = req.user?.userId;
    const token = req.user?.access_token;
    if (requestUserId !== userId) {
      // TODO: verificar se é admin antes de permitir
    }
    return this.profilesService.updateProfile(userId, updates, token);
  }

  @Patch(':userId/active-role')
  async updateActiveRole(
    @Param('userId') userId: string,
    @Body('active_role') activeRole: string,
    @Req() req: any,
  ) {
    const requestUserId = req.user?.userId;
    const token = req.user?.access_token;
    if (requestUserId !== userId) {
      throw new Error('Usuário só pode atualizar seu próprio role');
    }
    return this.profilesService.updateProfile(userId, { active_role: activeRole }, token);
  }
}
