import {
    library,
    icon as faIcon,
} from '@fortawesome/fontawesome-svg-core';

import {
    faChartLine,
    faUsers,
    faFolder,
    faCloud,
    faGear,
    faBars,
    faChevronLeft,
    faSun,
    faMoon,
    faDesktop,
    faChevronDown,
    faUser,
    faAngleRight,
    faListCheck,
    faMagnifyingGlass,
    faChevronRight,
    faTableColumns,
    faList,
    faRectangleList,
    faCalendarDays,
    faGripVertical,
} from '@fortawesome/free-solid-svg-icons';

import {
    faBell,
    faCircleUser,
    faEnvelope,
} from '@fortawesome/free-regular-svg-icons';

// Register all icons with the library
library.add(
    faChartLine,
    faUsers,
    faFolder,
    faGear,
    faBars,
    faCloud,
    faChevronLeft,
    faSun,
    faMoon,
    faDesktop,
    faChevronDown,
    faUser,
    faAngleRight,
    faListCheck,
    faMagnifyingGlass,
    faChevronRight,
    faTableColumns,
    faList,
    faRectangleList,
    faCalendarDays,
    faGripVertical,
    faBell,
    faCircleUser,
    faEnvelope,
);

/**
 * Render a FontAwesome icon as an HTML string.
 * @param {object} iconDef  — FA icon definition (e.g. faChartLine)
 * @param {string} classes  — extra CSS classes to apply to the <svg>
 * @returns {string}        — SVG HTML string ready to inject with innerHTML
 */
export function icon(iconDef, classes = '') {
    const result = faIcon(iconDef);
    if (!result) return '';
    let svg = result.html[0];
    if (classes) {
        // Inject classes into the <svg> tag
        svg = svg.replace('<svg ', `<svg class="${classes}" `);
    }
    return svg;
}

// Re-export icon definitions for use in other components
export {
    faChartLine,
    faUsers,
    faFolder,
    faGear,
    faBars,
    faCloud,
    faChevronLeft,
    faSun,
    faMoon,
    faDesktop,
    faChevronDown,
    faUser,
    faAngleRight,
    faListCheck,
    faMagnifyingGlass,
    faChevronRight,
    faTableColumns,
    faList,
    faRectangleList,
    faCalendarDays,
    faGripVertical,
    faBell,
    faCircleUser,
    faEnvelope,
};
