import { Injectable } from '@nestjs/common';
import { Prisma, RealEstateListing } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class RealEstateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.RealEstateListingUncheckedCreateInput,
  ): Promise<RealEstateListing> {
    return this.prisma.realEstateListing.create({ data });
  }

  update(
    id: number,
    data: Prisma.RealEstateListingUncheckedUpdateInput,
  ): Promise<RealEstateListing> {
    return this.prisma.realEstateListing.update({
      where: { id },
      data,
    });
  }

  upsertByExternalId(
    sourceId: number,
    externalId: string,
    createData: Omit<
      Prisma.RealEstateListingUncheckedCreateInput,
      'sourceId' | 'externalId'
    >,
    updateData: Prisma.RealEstateListingUncheckedUpdateInput,
  ): Promise<RealEstateListing> {
    return this.prisma.realEstateListing.upsert({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId,
        },
      },
      update: updateData,
      create: {
        ...createData,
        sourceId,
        externalId,
      },
    });
  }

  findById(id: number): Promise<RealEstateListing | null> {
    return this.prisma.realEstateListing.findUnique({ where: { id } });
  }

  findByExternalId(
    sourceId: number,
    externalId: string,
  ): Promise<RealEstateListing | null> {
    return this.prisma.realEstateListing.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId,
        },
      },
    });
  }

  findMany(params: Prisma.RealEstateListingFindManyArgs = {}): Promise<
    RealEstateListing[]
  > {
    return this.prisma.realEstateListing.findMany(params);
  }
}
