import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';
import { stringToMongoId } from '../validators/string-to-mongo-id';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'Quantity of records being ordered',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Record ID being ordered',
    required: true,
    type: String,
    example: '6908ea6849513baafefa3983',
  })
  @IsMongoId()
  @IsNotEmpty()
  @Transform((value) => stringToMongoId(value))
  recordId: string;
}
