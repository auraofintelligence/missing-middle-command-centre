import {brandFiles} from './brand-files.mjs';

const brandBase='/brand/missing-middle-v1';
export const brandLogo=brandBase+'-logo.png';
export const brandHead=`<link rel="icon" href="${brandBase}.ico" sizes="16x16 24x24 32x32 48x48">
  <link rel="icon" href="${brandBase}-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${brandBase}-apple.png" sizes="180x180">`;

const files={
  '/favicon.ico':['ico','image/vnd.microsoft.icon'],
  [brandBase+'.ico']:['ico','image/vnd.microsoft.icon'],
  [brandBase+'-32.png']:['tab','image/png'],
  [brandLogo]:['logo','image/png'],
  [brandBase+'-apple.png']:['apple','image/png']
};

export function serveBrand(request,pathname) {
  if (!Object.hasOwn(files,pathname) || !['GET','HEAD'].includes(request.method)) return null;
  const [name,type]=files[pathname];
  const bytes=Uint8Array.from(atob(brandFiles[name]),character=>character.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{
    headers:{
      'Content-Type':type,
      'Cache-Control':pathname==='/favicon.ico'?'public, max-age=3600':'public, max-age=31536000, immutable',
      'Content-Length':String(bytes.byteLength),
      'X-Content-Type-Options':'nosniff'
    }
  });
}
