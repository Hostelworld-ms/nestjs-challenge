import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsInt, Min, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Record Id',
    type: String,
    example: '6834a9fb49c883f8509cc26e',
  })
  @IsMongoId()
  @IsString()
  recordId: string;

  @ApiProperty({
    description: 'Order Quantity',
    type: Number,
    example: 4,
  })
  @IsInt()
  @Min(1)
  qty: number;
}
