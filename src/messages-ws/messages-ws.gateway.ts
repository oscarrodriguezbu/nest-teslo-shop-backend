import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces';
import { NewMessageDto } from './dtos/new-message.dto';
import { MessagesWsService } from './messages-ws.service';

//el gateway es como algo parecido a los controladores
@WebSocketGateway({ cors: true }) //  Aqui iria un namespace si se necesitase
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // OnGatewayConnection, OnGatewayDisconnect con ellos puedo saber si un cliente se conecta o se desconcta

  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);

    } catch (error) {
      client.disconnect();
      return;
    }

    // console.log({ payload })    
    // console.log('Cliente conectado:', client.id );


    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients()); //emite todos los clientes conectados
  }

  handleDisconnect(client: Socket) {
    // console.log('Cliente desconectado', client.id )
    this.messagesWsService.removeClient(client.id);

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients()); //emite los clientes que quedan conectados
  }

  @SubscribeMessage('message-from-client')// SubscribeMessage va a esperar el nombre del evento que se esta esperando
  onMessageFromClient(client: Socket, payload: NewMessageDto) { // en el payload viene el message

    //! Emite únicamente al cliente.
    // client.emit('message-from-server', {
    //   fullName: 'Soy Yo!',
    //   message: payload.message || 'no-message!!'
    // });

    //! Emitir a todos MENOS, al cliente inicial
    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Soy Yo!',
    //   message: payload.message || 'no-message!!'
    // });

    //* Emitir a todos
    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message!!'
    });

  }


}
