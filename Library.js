const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height=window.innerHeight;




function make_checkerboard()
{
    const rows = 30;
    const cols = 50;
    const tileSize = canvas.width / cols;
    const colors = ["#D7263D", "#F46036", "#2E294E", "#1B998B","#C5D86D"];
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let colorIndex = (row + col) % colors.length; // Cycle through colors
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }
    
}


//===========================vec2d class and helper functions ========================================================
 class Vec2d{

    constructor(a,b,c=0){
        this.x=a;
        this.y=b;
        this.z=c;
    }

}

 function vec_add(a,b){ return new Vec2d(a.x+b.x , a.y+b.y); }
 function vec_sub(a,b){ return new Vec2d(a.x-b.x , a.y-b.y); }
 function vec_dotproduct(a,b){ return (a.x*b.x + a.y*b.y); }
//function vec_crossproduct(a,b){} //get this right this time!!
 function vec_mag(a){ return Math.sqrt((a.x*a.x)+(a.y*a.y)+(a.z*a.z));}
 function vec_multiply(a,b){
    let c = new Vec2d(0,0);
    c.x=a.x*b;
    c.y=a.y*b;
    c.z=a.z*b;
    return c;
}
 function vec_normalise(a){
    let c = new Vec2d(0,0);
    let b=vec_mag(a);
    c.x=a.x/b;
    c.y=a.y/b;
    c.z=a.z/b;
    
    return c;
}
 function Line_Intersection( p1,  pdir,  v1,  vdir){ 

     p2 = vec_add(pdir , p1);
     v2 = vec_add(vdir , v1);
    
    const x1=p1.x; const y1=p1.y;
    const x2=p2.x; const y2=p2.y;
    const x3=v1.x; const y3=v1.y;
    const x4=v2.x; const y4=v2.y;
    
    let Px=0;
    let Py=0;
    
    if( ((x1-x2)*(y3-y4)  -  (y1-y2)*(x3-x4) ) != 0)
    {
     Px = (  (x1*y2 - y1*x2)*(x3-x4) - (x1-x2)*(x3*y4 - y3*x4)  ) / ((x1-x2)*(y3-y4)  -  (y1-y2)*(x3-x4) );
     Py = (  (x1*y2 - y1*x2)*(y3-y4) - (y1-y2)*(x3*y4 - y3*x4)  ) / ((x1-x2)*(y3-y4)  -  (y1-y2)*(x3-x4) );
    
    let intersection = new Vec2d(Px,Py);
    
    return intersection;
    }

    return null;
}
 function pointChecker_Line( point,  v1 , dir){

    let tempX = dir.x;
    let tempY = dir.y;

    dir = new Vec2d(tempY,-1*tempX);

    if(vec_dotproduct(v1,dir) > vec_dotproduct(point,dir)){return false;}

    else{return true;}

}
 function normal_dir(p1,p2){
    let c = new Vec2d(1*(p2.y-p1.y) , -1*(p2.x-p1.x));  c = vec_normalise(c);
    return c;
}
//============================Drawing Functions==========================================================
 function DrawLine(vertexA,vertexB,lineCol='red',lw=5,fillcol='black'){
    ctx.fillStyle=fillcol;
    ctx.strokeStyle=lineCol;
    ctx.lineWidth=lw;
    ctx.beginPath();
    ctx.moveTo(vertexA.x,vertexA.y);
    ctx.lineTo(vertexB.x,vertexB.y);
    ctx.stroke();
}
//courtesy of chatGPT :)
function DrawLineColored(vertexA, vertexB, segmentLength = 4) {
    const ctx = canvas.getContext("2d");
    const colors = ["cyan", "purple", "yellow", "#ff00a2"]; // Color pattern

    // Calculate total distance between points
    let totalLength = vec_mag(vec_sub(vertexB,vertexA));
    
    // Compute number of full segments based on given segment length
    let segmentCount = Math.ceil(totalLength / segmentLength);

    // Compute step size for x and y
    let dx = (vertexB.x - vertexA.x) / segmentCount;
    let dy = (vertexB.y - vertexA.y) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
        let startX = vertexA.x + i * dx;
        let startY = vertexA.y + i * dy;
        let endX = vertexA.x + (i + 1) * dx;
        let endY = vertexA.y + (i + 1) * dy;

        ctx.strokeStyle = colors[i % colors.length]; // Cycle through colors
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

 function DrawTriangle(vertexA,vertexB,vertexC,lineCol='red',lw=5,fillcol='black'){

    DrawLine(vertexA,vertexB,lineCol,lw,fillcol);
    DrawLine(vertexB,vertexC,lineCol,lw,fillcol);
    DrawLine(vertexC,vertexA,lineCol,lw,fillcol);



}
 function DrawCircle(vertex,r,lineCol='red',lw=5,fillcol='black'){
    ctx.fillStyle=fillcol;
    ctx.strokeStyle=lineCol;
    ctx.lineWidth=lw;
    ctx.beginPath();
    ctx.arc(vertex.x,vertex.y,r,0,2*Math.PI);
    ctx.stroke();

}
//GPT :)
function FillCircle(vertex, r, fillCol = 'black') {
    ctx.fillStyle = fillCol;
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, r, 0, 2 * Math.PI);
    ctx.fill();
}
//GPT :)
function FillQuarteredCircle(vertex, r, colors = ["cyan", "purple", "yellow", "#ff00a2"]) {
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(vertex.x, vertex.y);
        ctx.arc(vertex.x, vertex.y, r, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length]; // Cycle through provided colors
        ctx.fill();
    }
}
 function DrawPolygon(vertexBuffer,indexBuffer,lineCol='red',lw=5,fillcol='black'){

   
    for (let i=0 ; i<indexBuffer.length;i+=3)
    {
        DrawTriangle(vertexBuffer[indexBuffer[i]] , vertexBuffer[indexBuffer[i+1]],vertexBuffer[indexBuffer[i+2]],lineCol,lw,fillcol );
    }
}
 function DrawPolygon2(position,angle,vertexBuffer,indexBuffer,lineCol='red',lw=5,fillcol='black'){

    let transformedVertices=[];
    for(let i=0;i<vertexBuffer.length;i++)
    {
         transformedVertices.push (new Vec2d( (vertexBuffer[i].x * Math.cos(angle) - vertexBuffer[i].y * Math.sin(angle) ) + position.x , (vertexBuffer[i].x * Math.sin(angle) + vertexBuffer[i].y * Math.cos(angle) ) + position.y ) );
        
    }

    for (let i=0 ; i<indexBuffer.length;i+=3)
    {
        DrawTriangle(transformedVertices[indexBuffer[i]] , transformedVertices[indexBuffer[i+1]],transformedVertices[indexBuffer[i+2]],lineCol,lw,fillcol );
    }
}

function DrawPolygon3(vertices ,lineCol='red',lw=5,fillcol='black' ){

    for(let i =0 ; i < vertices.length;i++){
        DrawLine(vertices[i],vertices[(i+1)%vertices.length],lineCol,lw,fillcol);
    }

}


function FindCentroid(vertices){
    let xc=0; let yc=0;
    for(let i=0;i<vertices.length;i++){
        xc += vertices[i].x;
        yc += vertices[i].y;
    }
    xc = xc/vertices.length;    
    yc = yc/vertices.length;
    return new Vec2d(xc,yc);
}

function FillCentroid(vertices){
    let xc=0; let yc=0;
    for(let i=0;i<vertices.length;i++){
        xc += vertices[i].x;
        yc += vertices[i].y;
    }
    xc = xc/vertices.length;    
    yc = yc/vertices.length;
    if (vertices.length > 1){
        FillCircle(new Vec2d(xc,yc),5,'blue');
    }

}
