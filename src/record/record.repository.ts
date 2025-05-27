import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Record } from './schemas/record.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RecordRepository extends AbstractRepository<Record> {
  protected readonly logger = new Logger(RecordRepository.name);

  constructor(
    @InjectModel(Record.name)
    reservationModel: Model<Record>,
  ) {
    super(reservationModel);
  }
}
