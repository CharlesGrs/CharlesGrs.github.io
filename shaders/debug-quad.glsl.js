window.DEBUG_QUAD_VERTEX_SHADER = `
attribute vec2 aPosition;
uniform vec2 uCenter,uResolution;
uniform vec3 uCameraPos;
uniform float uSize,uCameraRotX,uCameraRotY,uWorldZ;
varying vec2 vUV;
void main(){
vUV=aPosition;
float c=cos(uCameraRotX),s=sin(uCameraRotX),cy=cos(uCameraRotY),sy=sin(uCameraRotY);
vec3 cam=uCameraPos,fwd=vec3(sy*c,-s,cy*c),rt=vec3(cy,0,-sy),up=cross(fwd,rt);
vec3 p=vec3((uCenter-uResolution*.5)/uResolution.x*vec2(1,-1),uWorldZ)-cam;
float z=dot(p,fwd);
if(z<.01){gl_Position=vec4(2,2,0,1);return;}
float ps=1./z;
float sc=uSize*ps;
vec2 pr=uResolution*.5+vec2(dot(p,rt),-dot(p,up))*ps*uResolution.x+aPosition*sc*3.;
gl_Position=vec4(pr/uResolution*2.-1.,0,1);gl_Position.y*=-1.;
}`;

window.DEBUG_QUAD_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
void main(){
float w=.05;
float e=max(abs(vUV.x),abs(vUV.y));
float border=smoothstep(1.-w,1.,e);
float diag=1.-smoothstep(0.,w,abs(vUV.x-vUV.y));
float a=max(border,diag)*.9;
if(a<.01)discard;
gl_FragColor=vec4(1.,.5,0.,a);
}`;
