import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private connection?: signalR.HubConnection;

  connect(userId: string, handlers: {
    onFeedUpdated?: () => void;
    onFriendRequestReceived?: () => void;
    onFriendRequestAccepted?: () => void;
    onFriendsUpdated?: () => void;
  }) {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/social?userId=${encodeURIComponent(userId)}`)
      .withAutomaticReconnect()
      .build();

    this.connection.on('feedUpdated', () => handlers.onFeedUpdated?.());
    this.connection.on('friendRequestReceived', () => handlers.onFriendRequestReceived?.());
    this.connection.on('friendRequestAccepted', () => handlers.onFriendRequestAccepted?.());
    this.connection.on('friendsUpdated', () => handlers.onFriendsUpdated?.());

    this.connection.start().catch(() => undefined);
  }
}
