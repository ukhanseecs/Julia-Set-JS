let msPrev = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;



function IsInJuliaSet(c, pixel, maxIterations, scale){
    let z = pixel;
    for(let i = 0; i < maxIterations; i++){
        z = z * z + c;
        if(z.abs() > 2){
            return i;
        }
    }
    return maxIterations;
}


function Loop(){

}

Loop();
    