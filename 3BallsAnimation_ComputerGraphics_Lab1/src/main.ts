interface Circle {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
}

function start(): void {
    const canvas = document.getElementById("scene");
    const colorInput = document.getElementById("color");
    const toggleBtn = document.getElementById("toggle");
    const resetBtn = document.getElementById("reset");
    const status = document.getElementById("status");
    const selectCircle = document.getElementById("selectCircle");
    const speedInput = document.getElementById("speedInput");
    const applySpeedBtn = document.getElementById("applySpeed");

    if (
        !(canvas instanceof HTMLCanvasElement) ||
        !(colorInput instanceof HTMLInputElement) ||
        !(toggleBtn instanceof HTMLButtonElement) ||
        !(resetBtn instanceof HTMLButtonElement) ||
        !(status instanceof HTMLParagraphElement) ||
        !(selectCircle instanceof HTMLSelectElement) ||
        !(speedInput instanceof HTMLInputElement) ||
        !(applySpeedBtn instanceof HTMLButtonElement)
    ) {
        throw new Error("Required DOM elements are missing");
    }

    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("Canvas 2D context unavailable");

    // Initial configuration for 3 circles (stored immutably to support Reset)
    const initialCircles: readonly Circle[] = [                                      // array of objects
        { x: 80, y: 100, radius: 20, color: "#2563eb", vx: 120, vy: 80 },
        { x: 200, y: 200, radius: 25, color: "#dc2626", vx: -100, vy: 110 },
        { x: 400, y: 150, radius: 15, color: "#16a34a", vx: 150, vy: -90 }
    ];

    // Deep copy for runtime mutation
    const circles: Circle[] = initialCircles.map((c) => ({ ...c }));

    let selectedIndex = 0;
    let running = true;
    let showError = false;

    const clamp = (v: number, low: number, high: number): number =>       // we use it when user clicks on canvas to move the circle, 
        Math.max(low, Math.min(v, high));                               // ensures the circle stays within canvas boundaries

    const syncUI = (): void => {
        const current = circles[selectedIndex];
        if (current) {
            colorInput.value = current.color;
            speedInput.value = Math.abs(current.vx).toFixed(1);
        }
    };

    const updateStatus = (): void => {
        if (showError) return;

        const current = circles[selectedIndex];
        if (current) {
            status.textContent = `[Circle ${selectedIndex + 1}] x=${current.x.toFixed(1)}, y=${current.y.toFixed(1)} | State: ${running ? "running" : "paused"}`;
        } else {
            status.textContent = "No circle selected";
        }
    };

    const draw = (): void => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const c of circles) {
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // updateStatus();
    };

    // Event Listeners
    selectCircle.addEventListener("change", () => {
        selectedIndex = Number(selectCircle.value);
        syncUI();
        draw();
    });

    colorInput.addEventListener("input", () => {
        const current = circles[selectedIndex];
        if (current) {
            current.color = colorInput.value;
            draw();
        }
    });

    applySpeedBtn.addEventListener("click", () => {
        const raw = speedInput.value.trim();
        const num = Number(raw);

        if (raw === "" || !Number.isFinite(num) || num < 0) {
            showError = true;
            status.textContent = "Error: Please enter a valid non-negative number for speed";
            return;
        }

        showError = false;

        const current = circles[selectedIndex];
        if (current) {
            const currentDir = current.vx >= 0 ? 1 : -1;
            current.vx = (num === 0 ? 0 : num) * currentDir;
            if (current.vx === 0 && num > 0) {
                current.vx = num; // Default to rightward if previously 0
            }
            draw();
            updateStatus();
        }
    });

    toggleBtn.addEventListener("click", () => {
        running = !running;
        toggleBtn.textContent = running ? "Pause" : "Resume";
        updateStatus();
    });

    resetBtn.addEventListener("click", () => {
        // Restore deep copies of initial circles without mutating initialCircles
        circles.length = 0;
        for (const c of initialCircles) {
            circles.push({ ...c });
        }

        selectedIndex = 0;
        selectCircle.value = "0";
        running = false;
        toggleBtn.textContent = "Resume";

        syncUI();
        draw();
    });

    canvas.addEventListener("pointerdown", (event) => {
        const bounds = canvas.getBoundingClientRect();
        const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
        const y = (event.clientY - bounds.top) * canvas.height / bounds.height;

        const current = circles[selectedIndex];
        if (current) {
            current.x = clamp(x, current.radius, canvas.width - current.radius);
            current.y = clamp(y, current.radius, canvas.height - current.radius);
            draw();
        }
    });

    // Animation loop
    let previous: number | undefined;

    const frame = (now: number): void => {
        const dt = previous === undefined ? 0 : Math.min((now - previous) / 1000, 0.05);
        previous = now;

        if (running) {
            for (const c of circles) {
                c.x += c.vx * dt;
                c.y += c.vy * dt;

                // Bounce X boundaries
                if (c.x > canvas.width - c.radius) {
                    c.x = canvas.width - c.radius;
                    c.vx = -Math.abs(c.vx);
                } else if (c.x < c.radius) {
                    c.x = c.radius;
                    c.vx = Math.abs(c.vx);
                }

                // Bounce Y boundaries
                if (c.y > canvas.height - c.radius) {
                    c.y = canvas.height - c.radius;
                    c.vy = -Math.abs(c.vy);
                } else if (c.y < c.radius) {
                    c.y = c.radius;
                    c.vy = Math.abs(c.vy);
                }
            }
        }

        draw();
        updateStatus();
        requestAnimationFrame(frame);
    };

    syncUI();
    requestAnimationFrame(frame);
}

start();
export {};