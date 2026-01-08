import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'The ID of the record to order',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of records to order',
    type: Number,
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
