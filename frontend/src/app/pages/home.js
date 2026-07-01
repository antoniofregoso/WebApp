export function home(req, router){
    console.log('**************', router.pathFor("dash"))
    document.getElementById('app').innerHTML = `
    <main class="app-shell app-home">
        <h1>Home</h1>
        <p>Welcome to the home page!</p>
    </main>
    `;
}
