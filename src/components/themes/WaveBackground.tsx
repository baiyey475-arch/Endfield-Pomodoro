import React, { useEffect, useRef } from "react";

interface WaveBackgroundProps {
    theme: string;
}

const WaveBackground: React.FC<WaveBackgroundProps> = ({ theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 设置画布尺寸
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // 波浪参数
        const waves = [
            {
                y: canvas.height * 0.7,
                length: 0.01,
                amplitude: 50,
                speed: 0.02,
            },
            {
                y: canvas.height * 0.8,
                length: 0.02,
                amplitude: 30,
                speed: 0.03,
            },
            {
                y: canvas.height * 0.9,
                length: 0.015,
                amplitude: 40,
                speed: 0.025,
            },
        ];

        // 颜色配置
        const colors = {
            MIKU: [
                "rgba(57, 197, 187, 0.3)",
                "rgba(100, 210, 255, 0.2)",
                "rgba(150, 230, 255, 0.1)",
            ],
            AZURE: [
                "rgba(0, 210, 255, 0.3)",
                "rgba(100, 180, 255, 0.2)",
                "rgba(150, 200, 255, 0.1)",
            ],
            MINIMAL: [
                "rgba(100, 150, 200, 0.3)",
                "rgba(150, 180, 220, 0.2)",
                "rgba(200, 220, 240, 0.1)",
            ],
            default: [
                "rgba(100, 150, 200, 0.3)",
                "rgba(150, 180, 220, 0.2)",
                "rgba(200, 220, 240, 0.1)",
            ],
        };

        const waveColors =
            colors[theme as keyof typeof colors] || colors.default;

        let animationId: number;
        let time = 0;

        // 绘制波浪
        const drawWaves = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            waves.forEach((wave, index) => {
                ctx.beginPath();
                ctx.moveTo(0, wave.y);

                for (let x = 0; x < canvas.width; x++) {
                    const y =
                        wave.y +
                        Math.sin(x * wave.length + time * wave.speed) *
                            wave.amplitude;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();

                ctx.fillStyle = waveColors[index];
                ctx.fill();
            });

            time += 1;
            animationId = requestAnimationFrame(drawWaves);
        };

        drawWaves();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0"
            style={{ pointerEvents: "none" }}
        />
    );
};

export default WaveBackground;
