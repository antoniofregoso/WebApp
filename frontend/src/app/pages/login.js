import { renderLogin } from '../components';

export function login(req, router){

    const appEl = document.getElementById('app');
   
     appEl.innerHTML = renderLogin();
}