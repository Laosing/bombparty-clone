declare module 'socket.io-mock' {
    import { Socket } from 'socket.io-client';

    class SocketMock {
        constructor();
        socketClient: Socket;
        on(event: string, callback: (...args: any[]) => void): void;
        emit(event: string, ...args: any[]): void;
    }

    export default SocketMock;
}
