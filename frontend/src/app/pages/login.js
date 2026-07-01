import { renderLogin } from '../components';
import { currentLang } from '../store';

export function login(req, router){
    const appEl = document.getElementById('app');
    appEl.innerHTML = renderLogin(currentLang.value);
    router.goTo('dash');
}
