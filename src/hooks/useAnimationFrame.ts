import { useEffect } from 'react';

const useAnimationFrame = (callback: () => void) => {
    useEffect(() => {
        let id = 0;

        const animate = () => {
            callback();
            id = window.requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.cancelAnimationFrame(id);
        };
    }, [callback]);
};

export default useAnimationFrame;
