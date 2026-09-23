import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SemanticSearchDto {
  /** Natural-language query, e.g. "remote backend work with cloud infra". */
  @IsString()
  @IsNotEmpty({ message: 'A search query is required' })
  @MaxLength(512)
  q!: string;

  @IsOptional()
  @IsString()
  @IsIn(['remote', 'onsite', 'hybrid'], {
    message: 'Location must be remote, onsite, or hybrid',
  })
  location?: string;

  @IsOptional()
  @IsString()
  @IsIn(['full-time', 'part-time', 'contract', 'internship'], {
    message: 'Job type must be full-time, part-time, contract, or internship',
  })
  jobType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  /**
   * Cosine-similarity floor. Below roughly 0.2 the model starts returning
   * postings that share only generic job-posting boilerplate with the query.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minSimilarity?: number;
}
