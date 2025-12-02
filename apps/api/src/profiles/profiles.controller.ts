import { Controller, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/v1/profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const userId = req.user?.sub;
    return this.profilesService.getProfileByUserId(userId);
  }

  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    return this.profilesService.getProfileByUserId(userId);
  }

  @Patch(':userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updates: any,
    @Req() req: Request,
  ) {
    // Validar que o usuário só pode atualizar seu próprio profile (ou ser admin)
    const requestUserId = req.user?.sub;
    if (requestUserId !== userId) {
      // TODO: verificar se é admin antes de permitir
    }
    return this.profilesService.updateProfile(userId, updates);
  }
}
