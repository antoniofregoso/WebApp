import { renderPasswordReset } from '../components';
import { currentLang } from '../store';

export function passwordReset(req, router){

    const appEl = document.getElementById('app');
   
     appEl.innerHTML = renderPasswordReset(currentLang.value);
}
