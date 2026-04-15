import React, { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    update: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
}

interface ParticleBackgroundProps {
    theme: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme }) => {
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

        // 粒子配置
        const particles: Particle[] = [];
        const particleCount = 50;

        // 颜色配置
        const colors = {
            MIKU: [
                "rgba(57, 197, 187, 0.5)",
                "rgba(100, 210, 255, 0.3)",
                "rgba(150, 230, 255, 0.2)",
            ],
            AZURE: [
                "rgba(0, 210, 255, 0.5)",
                "rgba(100, 180, 255, 0.3)",
                "rgba(150, 200, 255, 0.2)",
            ],
            MINIMAL: [
                "rgba(100, 150, 200, 0.5)",
                "rgba(150, 180, 220, 0.3)",
                "rgba(200, 220, 240, 0.2)",
            ],
            default: [
                "rgba(0, 210, 255, 0.5)",
                "rgba(95, 255, 220, 0.3)",
                "rgba(150, 230, 255, 0.2)",
            ],
        };

        const particleColors =
            colors[theme as keyof typeof colors] || colors.default;

        // 创建粒子
        const createParticle = (): Particle => {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25,
                color: particleColors[
                    Math.floor(Math.random() * particleColors.length)
                ],
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;

                    if (this.x < 0 || this.x > canvas.width) {
                        this.speedX *= -1;
                    }
                    if (this.y < 0 || this.y > canvas.height) {
                        this.speedY *= -1;
                    }
                },
                draw(ctx) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                },
            };
        };

        // 初始化粒子
        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }

        // 连接粒子
        const connectParticles = () => {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 210, 255, ${0.15 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        let animationId: number;

        // 动画循环
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.update();
                particle.draw(ctx);
            });

            connectParticles();
            animationId = requestAnimationFrame(animate);
        };

        animate();

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

export default ParticleBackground;
