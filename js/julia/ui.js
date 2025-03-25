export function setupControls(juliaSet) {
    document.querySelectorAll('input[name="colorMode"]').forEach(input => {
        input.addEventListener('change', function() {
            juliaSet.setColorMode(this.value).draw();
        });
    });
    
    document.addEventListener('click', (event) => {
        juliaSet.setCenter(event.clientX, event.clientY).draw();
    });
    
    return juliaSet;
}