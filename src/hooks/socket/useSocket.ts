import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const useSocket = (namespace: string, shoudConnect: boolean = true) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(socket?.connected);

    useEffect(() => {
        if (shoudConnect) {
            const url = process.env.NEXT_PUBLIC_SOCKET_URL;

            const socket = io(`${url}${namespace}`, {
                secure: true,
            });

            setSocket(socket);
            socket.connect();

            return () => {
                socket.disconnect();
            };
        }
    }, [namespace, shoudConnect]);

    useEffect(() => {
        if (shoudConnect) {
            const onConnect = () => {
                console.log('connect');
                setIsConnected(true);
            };

            const onDisconnect = () => {
                console.log('disconnect');
                setIsConnected(false);
            };

            socket?.on('connect', onConnect);
            socket?.on('disconnect', onDisconnect);

            return () => {
                socket?.off('connect', onConnect);
                socket?.off('disconnect', onDisconnect);
            };
        }
    }, [shoudConnect, socket]);

    return { socket, isConnected };
};

export default useSocket;
