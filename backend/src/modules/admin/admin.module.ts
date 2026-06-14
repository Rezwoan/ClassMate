import { Module } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminController } from './admin.controller';
import { AdminSeeder } from './admin.seeder';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, AdminSeeder],
})
export class AdminModule {}
