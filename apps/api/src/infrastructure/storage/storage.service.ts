import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_BUCKET = 'kabootar';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly tournamentsDir = join(process.cwd(), 'uploads', 'tournaments');
  private readonly participantsDir = join(process.cwd(), 'uploads', 'participants');
  private readonly driver: 'local' | 'supabase';
  private readonly bucket: string;
  private readonly supabase: SupabaseClient | null;

  constructor(private readonly config: ConfigService) {
    this.driver =
      config.get<string>('STORAGE_DRIVER', 'local') === 'supabase' ? 'supabase' : 'local';
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET', DEFAULT_BUCKET);

    const supabaseUrl = config.get<string>('SUPABASE_URL');
    const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase =
      this.driver === 'supabase' && supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null;
  }

  validateImageFile(file: Express.Multer.File, label = 'Image'): void {
    if (!file) {
      throw new BadRequestException(`${label} file is required`);
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`${label} must be a JPEG, PNG, or WebP image`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`${label} must be 5MB or smaller`);
    }
  }

  validateBannerFile(file: Express.Multer.File): void {
    this.validateImageFile(file, 'Banner');
  }

  async saveTournamentBanner(file: Express.Multer.File): Promise<string> {
    return this.saveImage(
      file,
      'tournaments',
      this.tournamentsDir,
      '/uploads/tournaments/',
      'Banner',
    );
  }

  async saveParticipantProfile(file: Express.Multer.File): Promise<string> {
    return this.saveImage(
      file,
      'participants',
      this.participantsDir,
      '/uploads/participants/',
      'Profile image',
    );
  }

  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;

    if (url.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), url.replace(/^\//, ''));
      try {
        await unlink(filePath);
      } catch {
        // Legacy local files may already be absent.
      }
      return;
    }

    if (!this.supabase) return;

    const storagePath = this.getSupabaseStoragePath(url);
    if (!storagePath) return;

    const { error } = await this.supabase.storage.from(this.bucket).remove([storagePath]);
    if (error) {
      this.logger.warn(`Could not delete storage object "${storagePath}": ${error.message}`);
    }
  }

  private async saveImage(
    file: Express.Multer.File,
    folder: 'tournaments' | 'participants',
    directory: string,
    publicPrefix: string,
    label: string,
  ): Promise<string> {
    this.validateImageFile(file, label);

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] ?? '.jpg';
    const filename = `${randomUUID()}${extension}`;

    if (this.driver === 'supabase') {
      if (!this.supabase) {
        throw new InternalServerErrorException('Object storage is not configured');
      }

      const storagePath = `${folder}/${filename}`;
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Could not upload "${storagePath}": ${error.message}`);
        throw new InternalServerErrorException('Could not store uploaded image');
      }

      return this.supabase.storage.from(this.bucket).getPublicUrl(storagePath).data.publicUrl;
    }

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), file.buffer);

    return `${publicPrefix}${filename}`;
  }

  private getSupabaseStoragePath(publicUrl: string): string | null {
    try {
      const pathname = decodeURIComponent(new URL(publicUrl).pathname);
      const marker = `/storage/v1/object/public/${this.bucket}/`;
      const markerIndex = pathname.indexOf(marker);
      return markerIndex === -1 ? null : pathname.slice(markerIndex + marker.length);
    } catch {
      return null;
    }
  }
}
