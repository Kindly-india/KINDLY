import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  // GET /certificates/:id/download
  // Auth required. Service checks: owner | admin | event's org.
  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async getDownloadUrl(@Request() req: any, @Param('id') certId: string) {
    return this.certificateService.getDownloadUrl(certId, req.user.id);
  }
}
