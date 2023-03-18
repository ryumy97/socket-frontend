import { DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import useReceive from 'hooks/socket/useReceive';
import { sendData } from 'hooks/socket/useSend';
import useSocket from 'hooks/socket/useSocket';
import {
    GetServerSideProps,
    GetStaticPaths,
    GetStaticProps,
    InferGetServerSidePropsType,
    NextPage,
} from 'next';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import DeviceOrientation from 'components/DeviceOrientation';
import useAnimationFrame from 'hooks/useAnimationFrame';

const setDeviceOrientationPermission = async () => {
    if (
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
        await (DeviceOrientationEvent as any).requestPermission();

        return true;
    }
};

const User: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = (
    props
) => {
    const { id } = props;

    const [shouldConnect, setShouldConnect] = useState(false);
    const [deviceOrientationEnabled, setDeviceOrientationEnabled] =
        useState(false);

    const orientation = useMemo(
        () => ({
            x: 0,
            y: 0,
            z: 0,
            w: 0,
        }),
        []
    );

    const { socket, isConnected } = useSocket('/user', shouldConnect);

    useEffect(() => {
        if (socket && isConnected) {
            console.log(id);
            sendData(socket, 'set-room', {
                id,
            });
            console.log('connect', id);
        }
    }, [id, isConnected, socket]);

    useEffect(() => {
        if (socket && isConnected) {
            const onDeviceRotation = (event: DeviceOrientationEvent) => {
                orientation.x = event.alpha || 0;
                orientation.y = event.beta || 0;
                orientation.z = event.gamma || 0;
            };

            const onScreenRotation = () => {
                orientation.w = window.orientation || 0;
            };

            window.addEventListener('deviceorientation', onDeviceRotation);
            window.addEventListener('orientationchange', onScreenRotation);
            return () => {
                window.removeEventListener(
                    'deviceorientation',
                    onDeviceRotation
                );
                window.removeEventListener(
                    'orientationchange',
                    onScreenRotation
                );
            };
        }
    }, [socket, isConnected, orientation]);

    useAnimationFrame(() => {
        if (socket && isConnected) {
            sendData(socket, 'device-orientation', {
                x: orientation.x,
                y: orientation.y,
                z: orientation.z,
                w: orientation.w,
            });
        }
    });

    return (
        <>
            {!shouldConnect ? (
                <button
                    onClick={() => {
                        setDeviceOrientationPermission();
                        setDeviceOrientationEnabled(true);
                        setShouldConnect(true);
                    }}
                    className=''
                >
                    connect
                </button>
            ) : (
                <></>
            )}
            {deviceOrientationEnabled && (
                <div className='absolute h-screen w-screen'>
                    <Canvas>
                        <DeviceOrientation orientation={orientation} />
                    </Canvas>
                </div>
            )}
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;

    const data = (await fetch(`${url}/room`).then((res) =>
        res.json()
    )) as string[];

    const id = context?.params?.id as string;

    if (!data.find((item) => item === id)) {
        return {
            notFound: true,
        };
    }

    return {
        props: { id },
    };
};

export default User;
