import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { createHash } from 'crypto';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentStatus } from './enums/incident-status.enum';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  async create(
    createIncidentDto: CreateIncidentDto,
    // photo: Express.Multer.File,
    photo: any,
    userId: number,
  ): Promise<{ incidentId: string }> {
    // Validate photo only if provided
    if (photo) {
      this.validatePhoto(photo);
    }

    // Validate location
    this.validateLocation(createIncidentDto.location);

    // Generate metadata
    const photoHash = photo ? this.generatePhotoHash(photo.buffer) : null;
    const incidentId = this.generateIncidentId();
    const timestamp = new Date();

    // Check for duplicates (only if photo is provided)
    if (photo) {
      await this.checkDuplicates(photoHash, createIncidentDto.location, timestamp, userId);
    }

    // Create incident
    const incident = this.incidentRepository.create({
      incidentId,
      photo: photo ? photo.buffer : null,
      photoHash,
      description: createIncidentDto.description,
      type: createIncidentDto.type,
      severity: createIncidentDto.severity,
      timestamp,
      reportedBy: userId,
      status: IncidentStatus.OPEN,
      geoLatitude: createIncidentDto.location.lat,
      geoLongitude: createIncidentDto.location.long,
      manualAddress: createIncidentDto.location.manualAddress,
    });

    await this.incidentRepository.save(incident);
    return { incidentId };
  }
  //
  async updateStatus(incidentId: string, updateStatusDto: UpdateIncidentStatusDto, userId: number): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Validate status transition
    this.validateStatusTransition(incident.status, updateStatusDto.status);

    incident.status = updateStatusDto.status;

    if (updateStatusDto.status === IncidentStatus.RESOLVED || updateStatusDto.status === IncidentStatus.INVESTIGATING) {
      incident.resolvedAt = new Date();
      incident.resolvedBy = userId;
    }

    return this.incidentRepository.save(incident);
  }
  //
  async findAll(): Promise<Incident[]> {
    return this.incidentRepository.find({
      relations: ['reporter', 'resolver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(incidentId: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { incidentId },
      relations: ['reporter', 'resolver'],
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  // Add this method to the IncidentsService class, after the findOne method (around line 75)

  async findMyIncidents(userId: number): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { reportedBy: userId },
      relations: ['reporter', 'resolver'],
      order: { createdAt: 'DESC' },
      take: 10, // Limit to last 10 incidents for performance
    });
  }

  private validatePhoto(photo: any): void {
    if (!photo) {
      // throw new BadRequestException('Photo is required');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(photo.mimetype)) {
      throw new BadRequestException('Photo must be JPEG or PNG format');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (photo.size > maxSize) {
      throw new BadRequestException('Photo size must be less than 5MB');
    }
  }

  private validateLocation(location: any): void {
    const hasGeoCoordinates = location.lat !== undefined && location.long !== undefined;
    const hasManualAddress = location.manualAddress && location.manualAddress.trim();

    if (!hasGeoCoordinates && !hasManualAddress) {
      throw new BadRequestException('Either geo coordinates or manual address is required');
    }
  }

  private generatePhotoHash(photoBuffer: Buffer): string {
    return createHash('sha256').update(photoBuffer).digest('hex');
  }

  private generateIncidentId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < 6; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `INC-${date}-${randomString}`;
  }

  private async checkDuplicates(photoHash: string, location: any, timestamp: Date, userId: number): Promise<void> {
    // Check photo hash duplicate
    const existingByPhoto = await this.incidentRepository.findOne({
      where: { photoHash, reportedBy: userId },
    });

    if (existingByPhoto) {
      throw new ConflictException(`Duplicate photo detected. Existing incident: ${existingByPhoto.incidentId}`);
    }

    // Check location and time window duplicate (30 minutes)
    if (location.lat && location.long) {
      const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
      const startTime = new Date(timestamp.getTime() - timeWindow);
      const endTime = new Date(timestamp.getTime() + timeWindow);

      const existingByLocation = await this.incidentRepository.findOne({
        where: {
          reportedBy: userId,
          geoLatitude: Between(location.lat - 0.001, location.lat + 0.001),
          geoLongitude: Between(location.long - 0.001, location.long + 0.001),
          timestamp: Between(startTime, endTime),
        },
      });

      if (existingByLocation) {
        throw new ConflictException(
          `Similar incident reported recently at this location. Existing incident: ${existingByLocation.incidentId}`,
        );
      }
    }
  }

  private validateStatusTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): void {
    const validTransitions = {
      [IncidentStatus.OPEN]: [IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED],
      [IncidentStatus.INVESTIGATING]: [IncidentStatus.RESOLVED],
      [IncidentStatus.RESOLVED]: [IncidentStatus.INVESTIGATING],
      // [IncidentStatus.RESOLVED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ForbiddenException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
  // patching and updating incidents
  async update(incidentId: string, updateDto: UpdateIncidentStatusDto): Promise<Incident> {
    const incident = await this.incidentRepository.findOneBy({ incidentId });
    if (!incident) {
      throw new NotFoundException(`Incident not found: ${incidentId}`);
    }
    this.validateStatusTransition(incident.status, updateDto.status);
    incident.status = updateDto.status;
    return this.incidentRepository.save(incident);
  }
}
