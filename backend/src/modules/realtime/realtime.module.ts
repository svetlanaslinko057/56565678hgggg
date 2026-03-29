import { Module, Global } from '@nestjs/common';
import { ArenaGateway } from './realtime.gateway';

@Global()
@Module({
  providers: [ArenaGateway],
  exports: [ArenaGateway],
})
export class RealtimeModule {}
