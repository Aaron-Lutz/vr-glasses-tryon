// Select the video element and the glasses image
const video = document.getElementById('video');
const glasses = document.getElementById('glasses');

// Load face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('https://aaron-lutz.github.io/vr-glasses-tryon/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('https://aaron-lutz.github.io/vr-glasses-tryon/models')
]).then(startVideo);

// Start the video stream
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.addEventListener('loadeddata', () => {
                video.width = video.videoWidth;
                video.height = video.videoHeight;
                runFaceDetection();
            });
        })
        .catch(error => {
            console.error("Error accessing the webcam: ", error);
        });
}

// Function to run face detection
function runFaceDetection() {
    // Remove any existing canvas
    const existingCanvas = document.getElementById('overlay');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.id = 'overlay';
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        updateGlasses(resizedDetections);
    }, 100);
}

// Function to update the glasses position
function updateGlasses(detections) {
    if (detections.length > 0) {
        const { x, y, width, height } = detections[0].alignedRect.box;
        const glassesWidth = width * 1.0;  // Adjusted width multiplier to make smaller
        const glassesHeight = glassesWidth / 2;  // Uniform scaling to maintain aspect ratio
        const glassesX = x - (glassesWidth - width) / 2;
        const glassesY = y - height * 4;  // Adjusted height to lower the glasses

        glasses.style.width = `${glassesWidth}px`;
        glasses.style.height = `${glassesHeight}px`;
        glasses.style.left = `${glassesX}px`;
        glasses.style.top = `${glassesY}px`;
        glasses.style.display = 'block';
    } else {
        glasses.style.display = 'none';
    }
}

// Add event listener to start the face detection when the video is playing
video.addEventListener('play', () => {
    video.width = video.videoWidth;
    video.height = video.videoHeight;
    runFaceDetection();
});
