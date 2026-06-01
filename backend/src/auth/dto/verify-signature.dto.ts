import { IsNotEmpty, IsString } from 'class-validator';

export class VerifySignatureDto {
  @IsString()
  @IsNotEmpty({ message: 'signedXdr is required and must not be empty' })
  signedXdr: string = '';
}
