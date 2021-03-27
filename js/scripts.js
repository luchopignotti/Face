const webcamFeed = document.querySelector("#webcam-feed");

async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/assets/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/assets/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/assets/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/assets/models");
        await faceapi.nets.ageGenderNet.loadFromUri("/assets/models");
        console.info("Loaded models");
    } catch (error) {
        // console.log(error);
        console.error("There was an error loading models");
    }
}

function setVideoFeed() {
    navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetetUserMedia ||
        navigator.mozGetetUserMedia ||
        navigator.msGetetUserMedia;

    navigator.getUserMedia(
        { video: {} },
        stream => (webcamFeed.srcObject = stream),
        _error => console.error("There was an error on startVideo()")
    );
}

function setVideoCanvas() {
    webcamFeed.addEventListener("play", () => {
        const videoWrapper = webcamFeed.parentElement;
        const canvas = faceapi.createCanvasFromMedia(webcamFeed);
        const context = canvas.getContext("2d");
        const displaySize = {
            width: videoWrapper.clientWidth,
            height: videoWrapper.clientHeight,
        };

        videoWrapper.append(canvas);
        faceapi.matchDimensions(canvas, displaySize);

        const setDetections = async () => {
            const detections = await faceapi
                .detectAllFaces(webcamFeed, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            // faceapi.draw.drawDetections(canvas, resizedDetections);

            resizedDetections.forEach(detection => {
                const box = detection.detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {
                    label: Math.round(detection.age) + " year old " + detection.gender,
                });

                drawBox.draw(canvas);

                // console.log(detection);
            });

            await setDetections();
        };

        requestAnimationFrame(setDetections);
    });
}

async function start() {
    await loadModels();
    setVideoFeed();
    setVideoCanvas();
}

start();
