const canvas = document.getElementById("game-canvas");  // dohvaćamo canvas definiran u HTML-u
const ctx = canvas.getContext("2d");        // dohvaćamo 2D kontekst koji se koristi za crtanje

const spaceshipImage = new Image();         // slika svemirskog broda
spaceshipImage.src = 'spaceship.png';

const asteroidImage = new Image();          // slika asteroida
asteroidImage.src = 'asteroid.png';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let asteroidInterval;

// Inicijalizacija objekta igrača
const player = {
    x: canvas.width / 2,        // početna pozicija mu je na sredini canvasa
    y: canvas.height / 2,
    width: 50,
    height: 100,
    speed: 10
};

// Inicijalizacija asteroida
const asteroids = [];
const asteroidSpeed = 2;
const asteroidSpawnInterval = 2000;     // period stvaranja asteroida

// Inicijalizacija vremena
let startTime = 0;
let bestTime = localStorage.getItem("bestTime") || 0;
document.getElementById("best-time-div").innerText = "Najbolje vrijeme: " + formatTime(bestTime);

// Funkcija za crtanje igrača
function drawPlayer() {
    ctx.drawImage(spaceshipImage, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}

// Funkcija za crtanje asteroida
function drawAsteroids() {
    for (const asteroid of asteroids) {
        ctx.drawImage(asteroidImage, asteroid.x - asteroid.width / 2, asteroid.y - asteroid.height / 2, asteroid.width, asteroid.height);
    }
}

// Funkcija za detekciju kolizije
function checkCollision() {
    if (player.x > canvas.width) player.x = 0
    else if (player.x < 0) player.x = canvas.width
    if (player.y > canvas.height) player.y = 0
    else if (player.y < 0) player.y = canvas.height
    for (const asteroid of asteroids) {
        if (
            player.x < asteroid.x + asteroid.width / 2 &&
            player.x + player.width / 2 > asteroid.x &&
            player.y < asteroid.y + asteroid.height / 2 &&
            player.y + player.height / 2 > asteroid.y
        ) {
            playCrashSound();
            endGame();
        }
    }
}

// Funkcija za kraj igre
function endGame() {
    const currentTime = new Date().getTime() - startTime;   
    if (currentTime > bestTime) {
        bestTime = currentTime;
        localStorage.setItem("bestTime", bestTime);     // ako je trenutno vrijeme bolje od dosadašnjeg najboljeg postavi ga za najbolje
    }
    document.getElementById("best-time-div").innerText = "Najbolje vrijeme: " + formatTime(bestTime);
    alert("Ponovno pokreni:");
    resetGame();
}

// Funkcija za resetiranje igre, vraćamo igrača u centar, resetiramo vrijeme i brišemo sve asteroide
function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    asteroids.length = 0;
    startTime = 0;
    spawnAsteroids();
}

// Funkcija za formatiranje vremena
function formatTime(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

// Funkcija za pomicanje asteroida
function moveAsteroids() {
    for (const asteroid of asteroids) {
        asteroid.x += asteroid.speedX;      // pomići asteroide prema zadanoj brzini
        asteroid.y += asteroid.speedY;

        if (asteroid.x < 0 || asteroid.x > canvas.width) {      // ako je asteroid izvan canvasa
            if (asteroid.x < 0 && asteroid.x > -20 && asteroid.speedX > 0) {    // ako je s lijeve strane canvasa i ima smjer prema canvasu znači da je to početni asteroid i pusti ga unutra
                asteroid.x = 0;
            } else if (asteroid.x > canvas.width && asteroid.x < canvas.width+20 && asteroid.speedX < 0) {  // isto ako je s desne strane
                asteroid.x = canvas.width;
            } else if (asteroid.x < 0 && asteroid.x > -20) {    // ako je s lijeve strane canvasa, ali došo je iz canvasa, odbij ga nazad unutra
                asteroid.x = 0;
                asteroid.speedX *= -1;
            } else if (asteroid.x > canvas.width && asteroid.x < canvas.width + 20) {   // isto ako je s desne strane
                asteroid.x = canvas.width;
                asteroid.speedX *= -1;
            }
        }

        if (asteroid.y < 0 || asteroid.y > canvas.height) {     // isto kao prethodni blok koda, ali ispitujemo gornju i donju stranu canvasa
            if (asteroid.y < 0 && asteroid.y > -20 && asteroid.speedY > 0) {
                asteroid.y = 0;
            } else if (asteroid.y > canvas.height && asteroid.y < canvas.height+20 && asteroid.speedY < 0) {
                asteroid.x = canvas.width;
            } else if (asteroid.y < 0 && asteroid.y > -20) {
                asteroid.y = 0;
                asteroid.speedY *= -1;
            } else if (asteroid.y > canvas.height && asteroid.y < canvas.height + 20) {
                asteroid.y = canvas.height;
                asteroid.speedY *= -1;
            }
        }
    }
}

// Funkcija za glavnu animaciju
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();       // u svakom frame-u crtaj igrača, asteroide, provjeri koliziju i pomakni asteroide
    drawAsteroids();
    checkCollision();
    moveAsteroids();

    // Ažuriranje vremena preživljavanja
    if (startTime) {
        const currentTime = new Date().getTime() - startTime;
        document.getElementById("last-time-div").innerText = "Vrijeme: " + formatTime(currentTime);
    }

    // Pokretanje igre
    if (!startTime) {
        startTime = new Date().getTime();
        spawnAsteroids();
    }

    // Ponovno iscrtavanje Canvasa
    requestAnimationFrame(animate);
}

function spawnAsteroids() {
    if (asteroidInterval) {
        clearInterval(asteroidInterval);
    }

    // Inicijalno stvaranje 20 asteroida izvan vidljivog područja
    for (let i = 0; i < 20; i++) {
        let initialX = 0;
        let initialY = 0;

        // Nasumično odaberi stranu ruba ekrana
        const side = Math.floor(Math.random() * 4);  // 0 - lijevo, 1 - desno, 2 - gore, 3 - dolje

        // Postavi inicijalne pozicije uz rub područja igre
        switch (side) {
            case 0: // lijevo
                initialX = -50;
                initialY = Math.random() * canvas.height;
                break;
            case 1: // desno
                initialX = canvas.width + 50;
                initialY = Math.random() * canvas.height;
                break;
            case 2: // gore
                initialX = Math.random() * canvas.width;
                initialY = -50;
                break;
            case 3: // dolje
                initialX = Math.random() * canvas.width;
                initialY = canvas.height + 50;
                break;
        }

        const asteroid = {
            x: initialX,
            y: initialY,
            width: 50,
            height: 50,
            speedX: (Math.random() - 0.5) * 6, // Nasumična brzina u smjeru x
            speedY: (Math.random() - 0.5) * 6  // Nasumična brzina u smjeru y
        };
        asteroids.push(asteroid);
    }

    // periodički stvaraj asteroide unutar područja igre
    asteroidInterval = setInterval(() => {
        const asteroid = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: 50,
            height: 50,
            speedX: (Math.random() - 0.5) * 6, // Nasumična brzina 
            speedY: (Math.random() - 0.5) * 6  // Nasumična brzina 
        };
        asteroids.push(asteroid);
    }, asteroidSpawnInterval);
}

// Funkcija za upravljanje igračem pomoću tipkovnice
function handleKeyPress(event) {
    switch (event.key) {
        case "ArrowUp":
            player.y -= player.speed;
            break;
        case "ArrowDown":
            player.y += player.speed;
            break;
        case "ArrowLeft":
            player.x -= player.speed;
            break;
        case "ArrowRight":
            player.x += player.speed;
            break;
    }
}

// Funkcija za zvuk sudara
function playCrashSound() {
    const crashSound = document.getElementById("crash-sound");
    crashSound.currentTime = 0;  
    crashSound.play();
}

// Dodavanje event listenera za tipkovnicu
window.addEventListener("keydown", handleKeyPress);

// Pokretanje igre
animate();
