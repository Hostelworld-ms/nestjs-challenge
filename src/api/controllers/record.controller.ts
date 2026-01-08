import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Record } from '../schemas/record.schema';
import { Model, Types } from 'mongoose';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { MusicBrainzService } from '../services/musicbrainz.service';

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    private readonly musicBrainzService: MusicBrainzService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    let tracklist: string[] = [];

    if (request.mbid) {
      tracklist = await this.musicBrainzService.fetchTracklistByMbid(
        request.mbid,
      );
    }

    return await this.recordModel.create({
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
      tracklist,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    // If MBID changed, refetch tracklist
    if (
      updateRecordDto.mbid !== undefined &&
      updateRecordDto.mbid !== record.mbid
    ) {
      if (updateRecordDto.mbid) {
        record.tracklist = await this.musicBrainzService.fetchTracklistByMbid(
          updateRecordDto.mbid,
        );
      } else {
        // mbid removed => clear tracklist
        record.tracklist = [];
      }
    }

    Object.assign(record, updateRecordDto);

    await record.save();
    return record;
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Full-text search across artist/album/category (uses text index)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name (exact match)',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of records to return (default 20, max 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'after',
    required: false,
    description:
      'Cursor pagination: Mongo ObjectId of the last item from the previous page',
    type: String,
  })
  async findAll(
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
    @Query('limit') limit = '20',
    @Query('after') after?: string,
  ): Promise<Record[]> {
    const filter: any = {};

    // clamp limit to 1..100 (default 20)
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    const take = Math.min(Math.max(safeLimit, 1), 100);

    if (format) filter.format = format;
    if (category) filter.category = category;

    // index-friendly exact matches
    if (artist) filter.artist = artist;
    if (album) filter.album = album;

    // full-text search
    if (q) {
      filter.$text = { $search: q };
    }

    if (after) {
      if (!Types.ObjectId.isValid(after)) {
        throw new BadRequestException('Invalid "after" cursor');
      }
      filter._id = { $gt: new Types.ObjectId(after) };
    }

    return this.recordModel.find(filter).sort({ _id: 1 }).limit(take).exec();
  }
}
