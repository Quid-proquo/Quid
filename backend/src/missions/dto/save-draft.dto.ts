import { IsNotEmpty, IsObject, IsString, ValidateIf } from 'class-validator';
import { Prisma } from '@prisma/client';

export class SaveDraftDto {
  @IsString()
  @IsNotEmpty()
  title: string = '';

  @ValidateIf((_, value) => value !== null)
  @IsObject()
  data: Prisma.InputJsonValue | null = null;
}
