// Select the video element and the glasses image
const video = document.getElementById('video');
const glasses = document.getElementById('glasses');

// Load face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models')
]).then(startVideo);

// Start the video stream
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error("Error accessing the webcam: ", error);
        });
}

// Function to update the glasses position
async function updateGlasses() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    if (detections.length > 0) {
        const { x, y, width, height } = detections[0].alignedRect.box;
        const glassesWidth = width * 1.5;
        const glassesHeight = glassesWidth / 2;
        const glassesX = x - (glassesWidth - width) / 2;
        const glassesY = y + height / 4;

        glasses.style.width = `${glassesWidth}px`;
        glasses.style.height = `${glassesHeight}px`;
        glasses.style.left = `${glassesX}px`;
        glasses.style.top = `${glassesY}px`;
        glasses.style.display = 'block';
    } else {
        glasses.style.display = 'none';
    }
}

// Update the glasses position when the video is playing
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        updateGlasses();
    }, 100);
});
