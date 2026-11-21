import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { allowedOrigins } from '../common/cors-origins';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';

export const userRoom = (userId: number) => `user:${userId}`;

/**
 * Socket.IO namespace `/ws`. Clients connect with `io(`${API}/ws`, { auth: { token } })`; the RS256 JWT is verified
 * in the handshake, then the socket joins the room `user:<id>`. Server -> client events:
 * `message:new { conversationId, message }` and `notification:new <notification>`.
 */
@WebSocketGateway({ namespace: '/ws', cors: { origin: allowedOrigins(), credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer() server: Namespace;

  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const raw = client.handshake?.auth?.token;
      const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : '';
      if (!token) throw new Error('missing token');
      const payload = await this.jwt.verifyAsync(token, { algorithms: ['RS256'] });
      const user = await this.userRepo.findOne({ where: { email: payload.email }, select: ['id', 'roles', 'isActive'] });
      if (!user || !user.isActive || !user.roles?.length || user.roles.includes(Role.PENDING)) throw new Error('forbidden');
      (client.data as any).userId = user.id;
      await client.join(userRoom(user.id));
    } catch {
      // Never log the token or the verification error details
      this.logger.warn('WebSocket connection rejected');
      client.disconnect(true);
    }
  }

  /** Emits to every socket of the given users. No-op when the server is not started (tests, CLI). */
  emitToUsers(userIds: number[], event: string, payload: unknown): void {
    try {
      if (!this.server) return;
      for (const id of new Set(userIds)) this.server.to(userRoom(id)).emit(event, payload);
    } catch (err) {
      this.logger.error(`emit ${event} failed: ${(err as Error).message}`);
    }
  }
}
