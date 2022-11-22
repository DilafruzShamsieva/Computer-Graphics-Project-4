var canvas;
var gl;

var zoomFactor = 1.3;
var translateFactorX = 0.2;
var translateFactorY = 0.2;

var numTimesToSubdivide = 6;
var index = 0;

//0-35 are for the table and chairs points
//36-71 are for the folder holder
//72-95 are for the lamp cubes i.e they do not have a top or bottom
var pointsArray = [];
var normalsArray = [];

//for mini fridge
var N;
var cubeVertices = [];
var N_Cube;



var left = -1;
var right = 1;
var ytop = 1;
var bottom = -1;
var near = -10;
var far = 10;

//var deg=5;
var eye=[.3, .6, .6];
var at=[.1, .1, 0];
var up=[0, 1, 0];

var cubeCount=36;
var sphereCount=0;
var numVertices  = 36;

var vertices = [
  vec4(0, 0, 0, 1),   // A(0)
        vec4(1, 0, 0, 1),   // B(1)
        vec4(1, 3, 0, 1),   // C(2)
        vec4(0, 3, 0, 1), // D(3)
        vec4(0, 3, 0.5, 1),    // E(4)
        vec4(1, 3, 0.5, 1),    // F(5)
        vec4(0, 1, 1.5, 1),    // G(6)
        vec4(1, 1, 1.5, 1),    // H(7)
        vec4(0, 0, 1.5, 1),  // I(8)
        vec4(1, 0, 1.5, 1),     // J(9)

        vec4( -0.5, -0.5,  0.5, 1.0 ), //10
        vec4( -0.5,  0.5,  0.5, 1.0 ), //11
        vec4( 0.5,  0.5,  0.5, 1.0 ), //12
        vec4( 0.5, -0.5,  0.5, 1.0 ), //13
        vec4( -0.5, -0.5, -0.5, 1.0 ), //14
        vec4( -0.5,  0.5, -0.5, 1.0 ), //15
        vec4( 0.5,  0.5, -0.5, 1.0 ), //16
        vec4( 0.5, -0.5, -0.5, 1.0 ) //17

        //trashcan points
        //vec4()
    ];

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var lightPosition = vec4(1.2, 1.2, 1.2, 0.3 );
var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.2, 1.2, 1.2, 1.2 );
var lightSpecular = vec4( 1.2, 1.2, 1.2, 1.2 );

var materialAmbient = vec4( 0.8, 0.0, 0.8, 0.8 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.2, 0.8, 0.0, 1.2 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;
var program;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var mvMatrixStack=[];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
     program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // set up lighting and material
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // generate the 36 points needed for the table cubes
    Cube();
    //tetrahedron(va, vb, vc, vd, numTimesToSubdivide);


    GenerateFolderHolder();

    //generate cube points
    LampCube();
console.log(pointsArray.length);
    ExtrudedCube();

    //generates sphere points
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);



    //console.log(pointsArray);
    // pass data onto GPU
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );

    // support user interface
    //document.getElementById("zoomIn").onclick=function(){zoomFactor *= 0.95;};
    //document.getElementById("zoomOut").onclick=function(){zoomFactor *= 1.05;};
    //document.getElementById("left").onclick=function(){translateFactorX -= 0.1;};
    //document.getElementById("right").onclick=function(){translateFactorX += 0.1;};
    //document.getElementById("up").onclick=function(){translateFactorY += 0.1;};
    //document.getElementById("down").onclick=function(){translateFactorY -= 0.1;};

    // keyboard handle
    //window.onkeydown = HandleKeyboard;
    attachListeners();
    render();
}

function HandleKeyboard(event)
{
    switch (event.keyCode)
    {
    case 37:  // left cursor key
              xrot -= deg;
              break;
    case 39:   // right cursor key
              xrot += deg;
              break;
    case 38:   // up cursor key
              yrot -= deg;
              break;
    case 40:    // down cursor key
              yrot += deg;
              break;
    }
}

// ******************************************
// Draw simple and primitive objects
// ******************************************

function DrawSolidSphere(radius)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(radius, radius, radius);   // scale to the given radius
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

 	// draw unit radius sphere
        for( var i=0; i<sphereCount; i+=3)
            gl.drawArrays( gl.TRIANGLES, cubeCount+i, 3 );

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawSolidCube(length)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(length, length, length );   // scale to the given width/height/depth
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

        gl.drawArrays( gl.TRIANGLES, 0, 36);

	modelViewMatrix=mvMatrixStack.pop();
}

function ExtrudedCube(){

  var height=4;
  cubeVertices = [
    vec4(2, 0, 0, 1),
    vec4(0, 0, 2, 1),
    vec4(0, 0, 0, 1),
    vec4(2, 0, 2, 1)
	];
  N=N_Cube = cubeVertices.length;

      // add the second set of points
      for (var i=0; i<N; i++)
      {
          cubeVertices.push(vec4(cubeVertices[i][0], cubeVertices[i][1]+height, cubeVertices[i][2], 1));
      }

      ExtrudedShape();
}

function ExtrudedShape()
{
    var basePoints=[];
    var topPoints=[];

    // create the face list
    // add the side faces first --> N quads
    for (var j=0; j<N; j++)
    {
        quad(j, j+N, (j+1)%N+N, (j+1)%N);
    }

    // the first N vertices come from the base
    basePoints.push(0);
    for (var i=N-1; i>0; i--)
    {
        basePoints.push(i);  // index only
    }
    // add the base face as the Nth face
    polygon(basePoints);

    // the next N vertices come from the top
    for (var i=0; i<N; i++)
    {
        topPoints.push(i+N); // index only
    }
    console.log(pointsArray.length);
    console.log(pointsArray);
    // add the top face
    polygon(topPoints);

    console.log(pointsArray.length);
    console.log(pointsArray);
}

function polygon(indices)
{
    // for indices=[a, b, c, d, e, f, ...]
    var M=indices.length;
    var normal=Newell(indices);
    console.log(M);
    var prev=1;
    var next=2;
    // triangles:
    // a-b-c
    // a-c-d
    // a-d-e
    // ...
    for (var i=0; i<M-2; i++)
    {
        pointsArray.push(cubeVertices[indices[0]]);
        normalsArray.push(normal);

        pointsArray.push(cubeVertices[indices[prev]]);
        normalsArray.push(normal);

        pointsArray.push(cubeVertices[indices[next]]);
        normalsArray.push(normal);

        prev=next;
        next=next+1;
    }
}

function Newell(indices)
{
   var L=indices.length;
   var x=0, y=0, z=0;
   var index, nextIndex;

   for (var i=0; i<L; i++)
   {
       index=indices[i];
       nextIndex = indices[(i+1)%L];

       x += (cubeVertices[index][1] - cubeVertices[nextIndex][1])*
            (cubeVertices[index][2] + cubeVertices[nextIndex][2]);
       y += (cubeVertices[index][2] - cubeVertices[nextIndex][2])*
            (cubeVertices[index][0] + cubeVertices[nextIndex][0]);
       z += (cubeVertices[index][0] - cubeVertices[nextIndex][0])*
            (cubeVertices[index][1] + cubeVertices[nextIndex][1]);
   }

   return (normalize(vec3(x, y, z)));
}

function pentagon(a, b, c, d, e) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     normal = vec3(normal);
     normal = normalize(normal);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
     pointsArray.push(vertices[b]);
     normalsArray.push(normal);
     pointsArray.push(vertices[c]);
     normalsArray.push(normal);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
     pointsArray.push(vertices[c]);
     normalsArray.push(normal);
     pointsArray.push(vertices[d]);
     normalsArray.push(normal);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
     pointsArray.push(vertices[d]);
     normalsArray.push(normal);
     pointsArray.push(vertices[e]);
     normalsArray.push(normal);
}

// start drawing the wall
function DrawWall(thickness, scale)
{
	var s, t, r;

	// draw thin wall with top = xz-plane, corner at origin
	mvMatrixStack.push(modelViewMatrix);

	t=translate(0.2, 0.5*thickness, 0.5);
	s=scale4(scale, thickness, 1.0);
        modelViewMatrix=mult(mult(modelViewMatrix, t), s);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);

	modelViewMatrix=mvMatrixStack.pop();
}

// ******************************************
// Draw composite objects
// ******************************************


function DrawTableLeg(thick, len)
{
	var s, t;

	mvMatrixStack.push(modelViewMatrix);

	t=translate(0, len/2, 0);
	var s=scale4(thick, len, thick);
        modelViewMatrix=mult(mult(modelViewMatrix, t), s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);

	modelViewMatrix=mvMatrixStack.pop();
}

function DrawTable(topWid, topThick, legThick, legLen)
{
	var s, t;

	// draw the table top
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0, legLen, 0);
	s=scale4(topWid, topThick, topWid);
    	modelViewMatrix=mult(mult(modelViewMatrix, t), s);
    	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);
	modelViewMatrix=mvMatrixStack.pop();

	// place the four table legs
	var dist = 0.95 * topWid / 2.0 - legThick / 2.0;
	mvMatrixStack.push(modelViewMatrix);
	t= translate(dist, 0, dist);
        modelViewMatrix = mult(modelViewMatrix, t);
	DrawTableLeg(legThick, legLen);

        // no push and pop between leg placements
	t=translate(0, 0, -2*dist);
        modelViewMatrix = mult(modelViewMatrix, t);
	DrawTableLeg(legThick, legLen);

	t=translate(-2*dist, 0, 2*dist);
        modelViewMatrix = mult(modelViewMatrix, t);
	DrawTableLeg(legThick, legLen);

	t=translate(0, 0, -2*dist);
        modelViewMatrix = mult(modelViewMatrix, t);
	DrawTableLeg(legThick, legLen);

	modelViewMatrix=mvMatrixStack.pop();
}

function render()
{
	var s, t, r;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   	// set up view and projection
    projectionMatrix = ortho(left*zoomFactor-translateFactorX, right*zoomFactor-translateFactorX, bottom*zoomFactor-translateFactorY, ytop*zoomFactor-translateFactorY, near, far);
   	//projectionMatrix = ortho(-10, 10, -10, 10, -20, 20);
   	modelViewMatrix=lookAt(eye, at, up);
 	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

//s = scale4(1.5, 1.5, 1.5);
//modelViewMatrix = mult(modelViewMatrix, s);
//mvMatrixStack.push(modelViewMatrix);
var materialAmbient = vec4( 1, 1, 1, 1 );
var materialDiffuse = vec4( 1.0, 1, 1, 1.0);
var materialSpecular = vec4( 1, 1, 1, 1 );

ambientProduct = mult(lightAmbient, materialAmbient);
diffuseProduct = mult(lightDiffuse, materialDiffuse);
specularProduct = mult(lightSpecular, materialSpecular);

gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
	// draw the table
	mvMatrixStack.push(modelViewMatrix);
	t=translate(-.5, -0.3, 0.7);
  s=scale4(1, 0.7, 0.4);
  //r = rotate(0.0, 0.0, 0.0, 1.0);
        //modelViewMatrix = mult(modelViewMatrix, r);
  //modelViewMatrix=mult(modelViewMatrix, t);
  modelViewMatrix= mult(t, mult(modelViewMatrix, s));
	DrawTable(0.5, 0.04, 0.02, 0.35);
	modelViewMatrix=mvMatrixStack.pop();
/*
  // draw the chair
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.85, 0.1, 0.7);
        modelViewMatrix=mult(modelViewMatrix, t);
	DrawTable(0.15, 0.015, 0.01, 0.2);
	modelViewMatrix=mvMatrixStack.pop();

  // draw the chair
	mvMatrixStack.push(modelViewMatrix);
	t=translate(0.08, 0, 0.5);
        modelViewMatrix=mult(modelViewMatrix, t);
	DrawTable(0.15, 0.015, 0.01, 0.2);
	modelViewMatrix=mvMatrixStack.pop();
*/
  // draw the chair
	mvMatrixStack.push(modelViewMatrix);
	t=translate(-0.3, 0, 0.85);
        modelViewMatrix=mult(modelViewMatrix, t);
	DrawTable(0.15, 0.015, 0.01, 0.2);
	modelViewMatrix=mvMatrixStack.pop();

  // draw the chair
	mvMatrixStack.push(modelViewMatrix);
	t=translate(-0.3, 0, 0.25);
        modelViewMatrix=mult(modelViewMatrix, t);
	DrawTable(0.15, 0.015, 0.01, 0.2);
	modelViewMatrix=mvMatrixStack.pop();

  var materialAmbient = vec4( 0.5, 0.2, 0.3, 0.8 );
  var materialDiffuse = vec4( 1.1, 0.4, 0.5, 1.0);
  var materialSpecular = vec4( 1.6, 0.3, 0.5, 1.2 );

  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
  gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
  gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );

	// wall # 1: in xz-plane
	DrawWall(0.02, 1.5);

	// wall #2: in yz-plane
	mvMatrixStack.push(modelViewMatrix);
  t=translate(-0.545, 0.31, 0);
        modelViewMatrix=mult(modelViewMatrix, t);
	r=rotate(90.0, 0.0, 0.0, 1.0);
        modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02, 1);
	modelViewMatrix=mvMatrixStack.pop();

	// wall #3: in xy-plane
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-90, 1.0, 0.0, 0.0);
	//r=rotate(90, 1.0, 0.0, 0.0);  // ??
        modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02, 1.5);
	modelViewMatrix=mvMatrixStack.pop();
	//modelViewMatrix=mvMatrixStack.pop();
  	//modelViewMatrix=mvMatrixStack.pop();

    var materialAmbient = vec4( 0.1, 0.9, 0.4, 0.8 );
    var materialDiffuse = vec4( 0.3, 1, 0.5, 1.0);
    var materialSpecular = vec4( .5, 0.7, 0.9, 1.2 );

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    //painting
    mvMatrixStack.push(modelViewMatrix);
    t=translate(0, 0.7, 0.2);
    modelViewMatrix=mult(modelViewMatrix, t);
    r=rotate(-90, 1.1, 0, 0.0);
    s=scale4(0.2, 0.02, 0.2);
    modelViewMatrix=mult(mult(modelViewMatrix, r), s);
    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    DrawSolidCube(1);
    modelViewMatrix=mvMatrixStack.pop();

    //painting
    mvMatrixStack.push(modelViewMatrix);
    t=translate(0.6, 0.7, 0.2);
    modelViewMatrix=mult(modelViewMatrix, t);
    r=rotate(-90, 1.1, 0, 0.0);
    s=scale4(0.2, 0.02, 0.2);
    modelViewMatrix=mult(mult(modelViewMatrix, r), s);
    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    DrawSolidCube(1);
    modelViewMatrix=mvMatrixStack.pop();


    //change color of the folder holder
    var materialAmbient = vec4( 0.4, 0.1, 0.2, 0.8 );
    var materialDiffuse = vec4( 1.0, 0.3, 0.4, 1.0);
    var materialSpecular = vec4( 1.5, 0.2, 0.4, 1.2 );

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );

    //folder holder
    mvMatrixStack.push(modelViewMatrix);
    t = translate(-.7, -.05, 1.3);
    s=scale4(0.05, 0.05, 0.05);
    modelViewMatrix= mult(t, mult(modelViewMatrix, s));
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelViewMatrix) );
      gl.drawArrays( gl.TRIANGLES, 36, 36 );
    modelViewMatrix = mvMatrixStack.pop();


    var materialAmbient = vec4( 0, 1, 1, 0.8 );
    var materialDiffuse = vec4( 0, 1, 1, 1.0);
    var materialSpecular = vec4( 0, 1, 1, 1.2 );

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
     //lamp
     mvMatrixStack.push(modelViewMatrix);
     t = translate(.7, -.2, 1.3);
     s=scale4(0.2, 0.2, 0.2);
     modelViewMatrix= mult(t, mult(modelViewMatrix, s));
     gl.uniformMatrix4fv( gl.getUniformLocation(program,
             "modelViewMatrix"), false, flatten(modelViewMatrix) );
     DrawLamp();
     modelViewMatrix = mvMatrixStack.pop();

     //extruded shape
     mvMatrixStack.push(modelViewMatrix);
     t=translate(0.4, 0.2, 0.6);
     s=scale4(0.1, 0.1, 0.1);
     modelViewMatrix= mult(t, mult(modelViewMatrix, s));
     gl.uniformMatrix4fv( gl.getUniformLocation(program,
             "modelViewMatrix"), false, flatten(modelViewMatrix) );
     gl.drawArrays(gl.TRIANGLES, 96, 36);
     modelViewMatrix = mvMatrixStack.pop();



    requestAnimFrame(render);
}

//surface of revolution object




function SurfaceRevPoints()
{
	//Setup initial points matrix
	for (var i = 0; i<11; i++)
	{
		//pointsArray.push(vec4(candlePoints[i][0], candlePoints[i][1],
        //                           candlePoints[i][2], 1));
	}

	var r;
        var t=Math.PI/12;

        // sweep the original curve another "angle" degree
	for (var j = 0; j < 10; j++)
	{
                var angle = (j+1)*t;

                // for each sweeping step, generate 25 new points corresponding to the original points
		for(var i = 0; i < 11 ; i++ )
		{
		        r = pointsArray[i][0];
                        vertices.push(vec4(r*Math.cos(angle), vertices[i][1], -r*Math.sin(angle), 1));
		}
	}

       var N=11;
       // quad strips are formed slice by slice (not layer by layer)
       //          ith slice      (i+1)th slice
       //            i*N+(j+1)-----(i+1)*N+(j+1)
       //               |              |
       //               |              |
       //            i*N+j --------(i+1)*N+j
       // define each quad in counter-clockwise rotation of the vertices
       for (var i=0; i<10; i++) // slices
       {
           for (var j=0; j<10; j++)  // layers
           {
				quad(i*N+j, (i+1)*N+j, (i+1)*N+(j+1), i*N+(j+1));
           }
       }
}

function GenerateFolderHolder()
{
    pentagon(2, 5, 7, 9, 1);   // right side
    quad(0, 8, 9, 1);   // bottom
    quad(7, 6, 8, 9); // front
    pentagon(3, 4, 6, 8, 0); // left side
    quad(2, 3, 0, 1); // back


}

function LampCube()
{
    	quad( 11, 10, 13, 12 ); // front
    	quad( 12, 13, 17, 16 ); // right
    	quad( 14, 15, 16, 17 ); // back
    	quad( 15, 14, 10, 11 ); // left
}

function DrawLamp()
{

  //var materialAmbient = vec4(0.5, 0.8, 0.1, 1.0);
  //var materialDiffuse = vec4(1, 0.4, 1, 1.0);
  //var materialSpecular = vec4(1.0, 0.8, 1.0, 1.0);

  //ambientProduct = mult(lightAmbient, materialAmbient);
  //diffuseProduct = mult(lightDiffuse, materialDiffuse);
  //specularProduct = mult(lightSpecular, materialSpecular);

  //gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
  //gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
  //gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
//lamp stem
  mvMatrixStack.push(modelViewMatrix);
  s=scale4(0.1, 0.4, 0.2);
  t = translate(0, .25, .4);
  modelViewMatrix= mult(t, mult(modelViewMatrix, s));
  gl.uniformMatrix4fv( gl.getUniformLocation(program,
          "modelViewMatrix"), false, flatten(modelViewMatrix) );
  gl.drawArrays( gl.TRIANGLES, 72 , 24 );
  modelViewMatrix=mvMatrixStack.pop();

  //lamp shade
  mvMatrixStack.push(modelViewMatrix);
  s=scale4(0.6, 0.4, 0.6);
  t = translate(0, .3, .4);
  modelViewMatrix= mult(t, mult(modelViewMatrix, s));
  gl.uniformMatrix4fv( gl.getUniformLocation(program,
          "modelViewMatrix"), false, flatten(modelViewMatrix) );
  gl.drawArrays( gl.TRIANGLES, 72 , 24 );
  modelViewMatrix=mvMatrixStack.pop();

  //lamp base
  mvMatrixStack.push(modelViewMatrix);
  s=scale4(0.5, 0, 0.4);
  modelViewMatrix=  mult(modelViewMatrix, s);
  gl.uniformMatrix4fv( gl.getUniformLocation(program,
          "modelViewMatrix"), false, flatten(modelViewMatrix) );
  for( var i=0; i<index; i+=3)
    gl.drawArrays( gl.TRIANGLES, i+132, 3 );
    modelViewMatrix=mvMatrixStack.pop();

    //lamp middle sphere
    mvMatrixStack.push(modelViewMatrix);
    s=scale4(0.3, 0.3, 0.3);
    t=translate(0, 0.08, 0);
    modelViewMatrix= mult(t, mult(modelViewMatrix, s));
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelViewMatrix) );
    for( var i=0; i<index; i+=3)
          gl.drawArrays( gl.TRIANGLES, i+132, 3 );
    modelViewMatrix=mvMatrixStack.pop();

    //lamp top sphere
   mvMatrixStack.push(modelViewMatrix);
   s=scale4(0.2, 0.2, 0.2);
   t = translate(0, 0.17, 0);
   modelViewMatrix= mult(t, mult(modelViewMatrix, s));
   gl.uniformMatrix4fv( gl.getUniformLocation(program,
           "modelViewMatrix"), false, flatten(modelViewMatrix) );
   for( var i=0; i<index; i+=3)
     gl.drawArrays( gl.TRIANGLES, i+132, 3 );
   //tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
   modelViewMatrix=mvMatrixStack.pop();

}

// ******************************************
// supporting functions below this:
// ******************************************
function triangle(a, b, c)
{
     normalsArray.push(vec3(a[0], a[1], a[2]));
     normalsArray.push(vec3(b[0], b[1], b[2]));
     normalsArray.push(vec3(c[0], c[1], c[2]));

     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     sphereCount += 3;
     index+=3
}

function divideTriangle(a, b, c, count)
{
    if ( count > 0 )
    {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n)
{
    	divideTriangle(a, b, c, n);
    	divideTriangle(d, c, b, n);
    	divideTriangle(a, d, b, n);
    	divideTriangle(a, c, d, n);
}

function quad(a, b, c, d)
{
     	var t1 = subtract(vertices[b], vertices[a]);
     	var t2 = subtract(vertices[c], vertices[b]);
     	var normal = cross(t1, t2);
     	var normal = vec3(normal);
     	normal = normalize(normal);

     	pointsArray.push(vertices[a]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[b]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[c]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[a]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[c]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[d]);
     	normalsArray.push(normal);
}

function Cube()
{
    	quad( 11, 10, 13, 12 );
    	quad( 12, 13, 17, 16 );
    	quad( 13, 10, 14, 17 );
    	quad( 16, 15, 11, 12 );
    	quad( 14, 15, 16, 17 );
    	quad( 15, 14, 10, 11 );
}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}



function attachListeners(){
	window.onkeydown = function(e){
		let code = e.keycode;
		if (e.key == 'a' || e.key == 'A'){
        console.log("a is pressed")
		}
  }
}
