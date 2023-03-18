import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

type Props = {
    orientation: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
};

var setObjectQuaternion = (function () {
    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

    return function (
        quaternion: THREE.Quaternion,
        alpha: number,
        beta: number,
        gamma: number,
        orient: number
    ) {
        // 'ZXY' for the device, but 'YXZ' for us
        euler.set(beta, alpha, -gamma, 'YXZ');

        // Orient the device
        quaternion.setFromEuler(euler);

        // camera looks out the back of the device, not the top
        quaternion.multiply(q1);

        // adjust for screen orientation
        quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
    };
})();

function Quat2Angle(x: number, y: number, z: number, w: number) {
    let pitch, roll, yaw;

    const test = x * y + z * w;
    // singularity at north pole
    if (test > 0.499) {
        yaw = Math.atan2(x, w) * 2;
        pitch = Math.PI / 2;
        roll = 0;

        return new THREE.Vector3(pitch, roll, yaw);
    }

    // singularity at south pole
    if (test < -0.499) {
        yaw = -2 * Math.atan2(x, w);
        pitch = -Math.PI / 2;
        roll = 0;
        return new THREE.Vector3(pitch, roll, yaw);
    }

    const sqx = x * x;
    const sqy = y * y;
    const sqz = z * z;

    yaw = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz);
    pitch = Math.asin(2 * test);
    roll = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz);

    return new THREE.Vector3(pitch, roll, yaw);
}

const DeviceOrientation: React.FC<Props> = (props) => {
    const { orientation } = props;

    const orbitControlsRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    const prev = useMemo(
        () => ({
            x: 0,
            y: 0,
            z: 0,
            w: 0,
        }),
        []
    );

    useFrame(() => {
        const alpha = THREE.MathUtils.degToRad(orientation.x);
        const beta = THREE.MathUtils.degToRad(orientation.y);
        const gamma = THREE.MathUtils.degToRad(orientation.z);
        const orient = THREE.MathUtils.degToRad(orientation.w);

        if (meshRef.current) {
            const currentQ = new THREE.Quaternion().copy(
                meshRef.current.quaternion
            );

            setObjectQuaternion(currentQ, alpha, beta, gamma, orient);
            const currentAngle = Quat2Angle(
                currentQ.x,
                currentQ.y,
                currentQ.z,
                currentQ.w
            );
            meshRef.current.rotation.y = currentAngle.z;
            prev.z = currentAngle.z;

            meshRef.current.rotation.x = currentAngle.y;
            prev.y = currentAngle.y;
        }
    });

    return (
        <>
            <OrbitControls ref={orbitControlsRef}></OrbitControls>
            <mesh ref={meshRef}>
                <boxGeometry args={[1, 2, 0.5]} />
                <meshBasicMaterial color={'hotpink'} />
            </mesh>
        </>
    );
};

export default DeviceOrientation;
