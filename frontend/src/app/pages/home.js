export function home(req, router){
    document.getElementById('app').innerHTML = `
    <main class="app-shell app-home">
        <h1>Home</h1>
        <p>Welcome to the home page!</p>
    </main>
    `;
}
