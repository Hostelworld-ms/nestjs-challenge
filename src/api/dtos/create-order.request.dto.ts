import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @ApiProperty({
    description: 'ID of the record to purchase',
    type: String,
  })
  @IsMongoId()
  recordId: string;

  @ApiProperty({
    description: 'Quantity requested for the order',
    type: Number,
    example: 2,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
