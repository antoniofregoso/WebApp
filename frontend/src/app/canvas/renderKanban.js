
export function renderKanban(data={}, lang) {
    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Kanban Board">
        <div class="dash-content-inner">
            <div class="dash-content-hero">
                <h2 class="dash-content-title">Kanban Board</h2>
                <p class="dash-content-placeholder">This is where the kanban board will be displayed.</p>
            </div>
        </div>
    </main>
    `;
}