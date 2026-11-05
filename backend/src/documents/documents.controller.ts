import { Controller, HttpCode, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProcessingService, type ProcessingResult } from '../processing/processing.service';
import { assertPdfFile, type UploadedPdf } from './validators/pdf-file.validator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly processing: ProcessingService) {}

  @Post('process')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  process(@UploadedFile() file: UploadedPdf | undefined): Promise<ProcessingResult> {
    assertPdfFile(file);
    return this.processing.process(file.buffer);
  }
}
