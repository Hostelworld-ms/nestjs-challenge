import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

export class UpdateRecordRequestDTO {
  @ApiProperty({
    description: 'Artist of the record',
    type: String,
    example: 'The Beatles',
    required: false,
  })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiProperty({
    description: 'Album name',
    type: String,
    example: 'Abbey Road',
    required: false,
  })
  @IsString()
  @IsOptional()
  album?: string;

  @ApiProperty({
    description: 'Price of the record',
    type: Number,
    example: 30,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Quantity of the record in stock',
    type: Number,
    example: 1000,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  qty?: number;

  @ApiProperty({
    description: 'Format of the record (Vinyl, CD, etc.)',
    enum: RecordFormat,
    example: RecordFormat.VINYL,
    required: false,
  })
  @IsEnum(RecordFormat)
  @IsOptional()
  format?: RecordFormat;

  @ApiProperty({
    description: 'Category or genre of the record (e.g., Rock, Jazz)',
    enum: RecordCategory,
    example: RecordCategory.ROCK,
    required: false,
  })
  @IsEnum(RecordCategory)
  @IsOptional()
  category?: RecordCategory;

  @ApiProperty({
    description:
      'Optional MusicBrainz release MBID used to fetch tracklist (artist MBIDs are invalid here)',
    type: String,
    example: '2f8f1118-53f1-3ea4-9c52-a4f9ed89d734',
    required: false,
  })
  @IsOptional()
  mbid?: string;
}
