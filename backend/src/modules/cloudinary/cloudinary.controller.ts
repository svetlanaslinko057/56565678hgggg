import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Check if Cloudinary is configured
   * GET /api/cloudinary/status
   */
  @Get('status')
  @ApiOperation({ summary: 'Check Cloudinary configuration status' })
  getStatus() {
    return ApiResponse.success({
      configured: this.cloudinaryService.isReady(),
    });
  }

  /**
   * Generate signed upload parameters for frontend direct upload
   * GET /api/cloudinary/signature
   */
  @Get('signature')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generate signed upload parameters' })
  generateSignature(
    @Req() req: any,
    @Query('folder') folder: string = 'avatars',
    @Query('resourceType') resourceType: string = 'image',
  ) {
    if (!this.cloudinaryService.isReady()) {
      throw new HttpException(
        'Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Validate folder - only allow certain paths
    const allowedFolders = ['avatars', 'users', 'posts', 'uploads'];
    const folderBase = folder.split('/')[0];
    if (!allowedFolders.includes(folderBase)) {
      throw new HttpException('Invalid folder path', HttpStatus.BAD_REQUEST);
    }

    // Add user wallet to folder for organization
    const userFolder = `${folder}/${req.user.wallet.slice(0, 10)}`;
    
    const signature = this.cloudinaryService.generateSignature(userFolder, resourceType);
    return ApiResponse.success(signature);
  }

  /**
   * Upload image directly from backend (base64)
   * POST /api/cloudinary/upload
   */
  @Post('upload')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Upload image (base64)' })
  async uploadImage(
    @Req() req: any,
    @Body() body: { image: string; folder?: string },
  ) {
    if (!this.cloudinaryService.isReady()) {
      throw new HttpException(
        'Cloudinary not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!body.image) {
      throw new HttpException('Image data required', HttpStatus.BAD_REQUEST);
    }

    // Validate base64 format
    if (!body.image.startsWith('data:image/')) {
      throw new HttpException('Invalid image format. Must be base64 data URL', HttpStatus.BAD_REQUEST);
    }

    try {
      const folder = body.folder || `avatars/${req.user.wallet.slice(0, 10)}`;
      const result = await this.cloudinaryService.uploadImage(body.image, { folder });
      
      return ApiResponse.success({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      }, 'Image uploaded successfully');
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Upload failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete image
   * DELETE /api/cloudinary/delete
   */
  @Delete('delete')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete image' })
  async deleteImage(
    @Req() req: any,
    @Query('publicId') publicId: string,
  ) {
    if (!this.cloudinaryService.isReady()) {
      throw new HttpException(
        'Cloudinary not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!publicId) {
      throw new HttpException('publicId required', HttpStatus.BAD_REQUEST);
    }

    // Validate ownership - publicId should contain user's wallet prefix
    const walletPrefix = req.user.wallet.slice(0, 10).toLowerCase();
    if (!publicId.toLowerCase().includes(walletPrefix)) {
      throw new HttpException('Unauthorized to delete this image', HttpStatus.FORBIDDEN);
    }

    const success = await this.cloudinaryService.deleteImage(publicId);
    
    if (success) {
      return ApiResponse.success({ deleted: true }, 'Image deleted successfully');
    } else {
      throw new HttpException('Delete failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
