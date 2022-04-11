export function typicalAgGridOptions(inherit) {
    return {
        defaultColDef: { resizable: true },
        domLayout: 'autoHeight',
        onGridReady: (event) => event.columnApi.autoSizeAllColumns(),
        components: {
            // see https://www.ag-grid.com/javascript-grid/components/
            workspaceEditorRedirectCellRenderer: (params) => {
                const [src, label] = [params.data["editorRedirectSrc"], params.data["editorRedirectLabel"]];
                return `<a href="/workspace/editor-redirect/abs${src}" title="Open ${src} in IDE">${label}</a>`;
            },
        },
        ...inherit,
    };
}

export function populateAgGrid(agGrid, target, gridDefn) {
    const gridOptions = gridDefn(typicalAgGridOptions);
    new agGrid.Grid(target, gridOptions);
}
