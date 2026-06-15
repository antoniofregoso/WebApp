import { appSignal } from '../appStore';

export const dashboardActions = {

     setView(view) {
        appSignal.value = {
            ...appSignal.value,
            dashboard: {
                ...appSignal.value.dashboard,
                view
            }
        };
    },

}