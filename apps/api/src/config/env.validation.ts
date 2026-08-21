import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY?: string = '24h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY?: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string = 'http://localhost:4200,http://localhost:3001';

  @IsString()
  @IsOptional()
  ADMIN_APP_URL?: string = 'http://localhost:4200';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  THROTTLE_TTL_MS?: number = 60000;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  THROTTLE_LIMIT?: number = 100;

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'log';

  @IsIn(['local', 'supabase'])
  @IsOptional()
  STORAGE_DRIVER?: 'local' | 'supabase' = 'local';

  @IsString()
  @IsOptional()
  SUPABASE_URL?: string;

  @IsString()
  @IsOptional()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @IsString()
  @IsOptional()
  SUPABASE_STORAGE_BUCKET?: string = 'kabootar';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  if (validated.NODE_ENV === Environment.Production && validated.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  if (
    validated.STORAGE_DRIVER === 'supabase' &&
    (!validated.SUPABASE_URL || !validated.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when STORAGE_DRIVER=supabase',
    );
  }

  return validated;
}
