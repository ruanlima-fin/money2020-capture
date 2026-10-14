// Dependency-free ZIP (STORE) writer/reader. No network or CDN dependencies.
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal:true});
const table = Uint32Array.from({length:256}, (_, n) => {for(let k=0;k<8;k++) n=(n&1)?0xedb88320^(n>>>1):n>>>1; return n>>>0;});
export function crc32(data){let n=0xffffffff;for(const b of data)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
const block=n=>new Uint8Array(n);
const view=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
export async function createZip(files){
  const local=[],central=[];let offset=0;
  const now=new Date(),dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),dosDate=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  for(const [path,value] of files){
    const name=encoder.encode(path),data=value instanceof Blob?new Uint8Array(await value.arrayBuffer()):typeof value==='string'?encoder.encode(value):value;
    if(name.length>65535 || data.length>0xffffffff)throw Error('Arquivo grande demais para ZIP.');
    const crc=crc32(data),h=block(30),v=view(h);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
    v.setUint16(10,dosTime,true);v.setUint16(12,dosDate,true);local.push(h,name,data);const c=block(46),cv=view(c);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(12,dosTime,true);cv.setUint16(14,dosDate,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.push(c,name);offset+=h.length+name.length+data.length;
  }
  if(files.length>65535 || offset>0xffffffff)throw Error('Backup excede os limites ZIP.');
  const size=central.reduce((n,b)=>n+b.length,0),end=block(22),ev=view(end);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
export async function readZip(blob){
  if(blob.size>512*1024*1024)throw Error('Importe backups de até 512 MB.');
  const b=new Uint8Array(await blob.arrayBuffer()),v=view(b),files=new Map();let end=-1;
  for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(v.getUint32(p,true)===0x06054b50 && p+22+v.getUint16(p+20,true)===b.length){end=p;break;}
  if(end<0)throw Error('ZIP incompleto ou inválido.');
  const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),start=v.getUint32(end+16,true);
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||start+size!==end)throw Error('Formato ZIP não suportado.');
  let p=start;
  for(let i=0;i<count;i++){
    if(p+46>end || v.getUint32(p,true)!==0x02014b50)throw Error('Diretório ZIP inválido.');
    const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),packed=v.getUint32(p+20,true),length=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),pos=v.getUint32(p+42,true);
    if(flags&1 || method!==0 || packed!==length)throw Error('Use o ZIP original gerado pelo Capture, sem recomprimir.');
    if(p+46+nl+extra+comment>end || pos+30>start || v.getUint32(pos,true)!==0x04034b50)throw Error('Entrada ZIP inválida.');
    const name=decoder.decode(b.slice(p+46,p+46+nl));
    if(!name || name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')||files.has(name))throw Error('Caminho inválido ou duplicado no ZIP.');
    const localNameLength=v.getUint16(pos+26,true),localExtra=v.getUint16(pos+28,true),from=pos+30+localNameLength+localExtra;
    if(from+length>start || decoder.decode(b.slice(pos+30,pos+30+localNameLength))!==name)throw Error('Entrada ZIP truncada.');
    const data=b.slice(from,from+length);if(crc32(data)!==crc)throw Error('Backup corrompido (CRC).');files.set(name,data);p+=46+nl+extra+comment;
  }
  if(p!==end)throw Error('Diretório ZIP inconsistente.');return files;
}
