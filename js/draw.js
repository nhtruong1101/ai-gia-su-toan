document.addEventListener('DOMContentLoaded', () => {
    const canvasModal = document.getElementById('canvasModal');
    const openCanvasBtn = document.getElementById('openCanvasBtn');
    const closeCanvasBtn = document.getElementById('closeCanvasBtn');
    const saveCanvasBtn = document.getElementById('saveCanvasBtn');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const colorPicker = document.getElementById('drawColor');
    const sizeSlider = document.getElementById('drawSize');
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');

    let isDrawing = false;
    let isErasing = false;

    // Reset canvas to default background
    function clearCanvas() {
        ctx.fillStyle = '#1e1b4b'; // Background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    clearCanvas(); // Init

    // Events to open/close modal
    openCanvasBtn.addEventListener('click', () => {
        canvasModal.classList.remove('hidden');
    });

    closeCanvasBtn.addEventListener('click', () => {
        canvasModal.classList.add('hidden');
    });

    clearCanvasBtn.addEventListener('click', clearCanvas);

    eraserBtn.addEventListener('click', () => {
        isErasing = !isErasing;
        if (isErasing) {
            eraserBtn.classList.remove('btn-secondary');
            eraserBtn.classList.add('btn-primary');
        } else {
            eraserBtn.classList.add('btn-secondary');
            eraserBtn.classList.remove('btn-primary');
        }
    });

    // Drawing logic
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        // Calculate scaling if CSS resizes canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        ctx.lineTo(pos.x, pos.y);
        ctx.lineWidth = sizeSlider.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isErasing) {
            ctx.strokeStyle = '#1e1b4b'; // Match background
        } else {
            ctx.strokeStyle = colorPicker.value;
        }

        ctx.stroke();
        e.preventDefault();
    }

    function stopDrawing() {
        if (isDrawing) {
            ctx.closePath();
            isDrawing = false;
        }
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support for mobile/tablets
    canvas.addEventListener('touchstart', startDrawing, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Save canvas to app.js
    saveCanvasBtn.addEventListener('click', () => {
        const dataUrl = canvas.toDataURL('image/png');
        
        // Put data directly into app variables
        currentImageMimeType = 'png';
        currentImageBase64 = dataUrl.split(',')[1];
        
        // Show preview
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        imagePreview.src = dataUrl;
        imagePreviewContainer.classList.remove('hidden');

        canvasModal.classList.add('hidden');
    });
});
