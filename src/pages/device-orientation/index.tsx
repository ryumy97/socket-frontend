import useReceive from 'hooks/socket/useReceive';
import { sendData } from 'hooks/socket/useSend';
import useSocket from 'hooks/socket/useSocket';
import { NextPage } from 'next';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Canvas } from '@react-three/fiber';
import DeviceOrientation from 'components/DeviceOrientation';

const Socket: NextPage = () => {
    const { socket, isConnected } = useSocket('/admin');

    const [roomId, setRoomId] = useState('');
    const [users, setUsers] = useState(0);

    const mouseRef = useRef(null);

    const orientation = useMemo(
        () => ({
            x: 0,
            y: 0,
            z: 0,
            w: 0,
        }),
        []
    );

    useReceive<{ roomId: string }>(socket, 'room-id', ({ id, data }) => {
        setRoomId(data?.roomId);
    });

    useReceive<{ users: number }>(socket, 'room-user', ({ id, data }) => {
        setUsers(data?.users);
    });

    useEffect(() => {
        gsap.registerPlugin({
            name: 'directionalRotation',
            init(target: any, values: any) {
                if (typeof values !== 'object') {
                    values = { rotation: values };
                }
                var data = this as any,
                    cap = values.useRadians ? Math.PI * 2 : 360,
                    min = 1e-6,
                    p,
                    v,
                    start,
                    end,
                    dif,
                    split;
                data.endValues = {};
                data.target = target;
                for (p in values) {
                    if (p !== 'useRadians') {
                        end = values[p];
                        split = (end + '').split('_');
                        v = split[0];
                        start = parseFloat(target[p]);
                        end = data.endValues[p] =
                            typeof v === 'string' && v.charAt(1) === '='
                                ? start +
                                  parseInt(v.charAt(0) + '1', 10) *
                                      Number(v.substr(2))
                                : +v || 0;
                        dif = end - start;
                        if (split.length) {
                            v = split.join('_');
                            if (~v.indexOf('short')) {
                                dif = dif % cap;
                                if (dif !== dif % (cap / 2)) {
                                    dif = dif < 0 ? dif + cap : dif - cap;
                                }
                            }
                            if (v.indexOf('_cw') !== -1 && dif < 0) {
                                dif =
                                    ((dif + cap * 1e10) % cap) -
                                    ((dif / cap) | 0) * cap;
                            } else if (v.indexOf('ccw') !== -1 && dif > 0) {
                                dif =
                                    ((dif - cap * 1e10) % cap) -
                                    ((dif / cap) | 0) * cap;
                            }
                        }
                        if (dif > min || dif < -min) {
                            data.add(target, p, start, start + dif);
                            data._props.push(p);
                        }
                    }
                }
            },
            render(progress: any, data: any) {
                if (progress === 1) {
                    for (let p in data.endValues) {
                        data.target[p] = data.endValues[p];
                    }
                } else {
                    let pt = data._pt;
                    while (pt) {
                        pt.r(progress, pt.d);
                        pt = pt._next;
                    }
                }
            },
        });
    }, []);

    useReceive<{ x: number; y: number; z: number; w: number }>(
        socket,
        'device-orientation',
        ({ id, data }) => {
            gsap.to(orientation, {
                directionalRotation: {
                    x: `${data.x}_short`,
                    y: `${data.y}_short`,
                    z: `${data.z}_short`,
                    w: `${data.w}_short`,
                },
                onUpdate: () => {
                    console.log(orientation.x);
                },
            });
        }
    );

    return (
        <>
            <div>{isConnected ? 'connected' : 'not connected'}</div>
            <div>Room Id: {roomId}</div>
            <div>Users: {users}</div>

            {isConnected && (
                <div className='absolute h-screen w-screen'>
                    <Canvas>
                        <DeviceOrientation orientation={orientation} />
                    </Canvas>
                </div>
            )}
        </>
    );
};

export default Socket;
