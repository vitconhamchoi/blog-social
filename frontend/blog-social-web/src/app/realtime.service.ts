import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private connection?: signalR.HubConnection;

  connect(onFeedUpdated: () => void) {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/social')
      .withAutomaticReconnect()
      .build();

    this.connection.on('feedUpdated', onFeedUpdated);
    this.connection.start().catch(() => undefined);
  }
}
