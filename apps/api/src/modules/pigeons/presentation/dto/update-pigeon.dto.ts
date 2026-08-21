import { PartialType } from '@nestjs/swagger';
import { CreatePigeonDto } from './create-pigeon.dto';

export class UpdatePigeonDto extends PartialType(CreatePigeonDto) {}
