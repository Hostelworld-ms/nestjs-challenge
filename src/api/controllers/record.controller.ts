import {
  Body,
  ConflictException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';
import { MusicBrainzService } from '../services/music-brainz.service';
import { RecordService } from '../services/record.service';
import {
  DEFAULT_PAGINATION_LIMIT,
  PaginationUtils,
} from '../utils/pagination.utils';

@Controller('records')
export class RecordController {
  private readonly logger = new Logger(RecordController.name);

  constructor(
    private readonly musicBrainzService: MusicBrainzService,
    private readonly recordService: RecordService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    const record = await this.recordService.findOne({
      artist: request.artist,
      album: request.album,
      format: request.format,
    });

    if (record) {
      throw new ConflictException(
        'Record already exists with the same artist, album, and format',
      );
    }

    let trackList: string[] = [];
    if (request.mbid) {
      trackList = await this.musicBrainzService.getReleaseTrackList(
        request.mbid,
      );
    }

    const recordData = {
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
      trackList,
    };

    this.logger.log(
      `Creating record with the following data: ${JSON.stringify(recordData)}`,
    );

    return this.recordService.createRecord(recordData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const record = await this.recordService.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (
      record.mbid &&
      updateRecordDto.mbid &&
      record.mbid !== updateRecordDto.mbid
    ) {
      let trackList = await this.musicBrainzService.getReleaseTrackList(
        updateRecordDto.mbid,
      );
      Object.assign(record, { trackList });
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
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
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
  async findAll(
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
    @Query('next') next?: string,
  ): Promise<{
    data: Record[];
    nextCursor: string;
  }> {
    const cursorValue =
      next ?? PaginationUtils.encodeCursor({ limit: DEFAULT_PAGINATION_LIMIT });

    const findParams = {
      q,
      artist,
      album,
      format,
      category,
      cursor: cursorValue,
    };

    const records = await this.recordService.findAllCached(findParams);

    const last =
      records && records.length
        ? (records[records.length - 1]._id as string)
        : undefined;

    const nextCursor = last
      ? PaginationUtils.encodeCursor({
          last,
          limit: DEFAULT_PAGINATION_LIMIT,
        })
      : undefined;

    return {
      data: records,
      nextCursor,
    };
  }
}
